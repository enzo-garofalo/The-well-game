"""
GameConsumer — single AsyncWebsocketConsumer handling all game logic.
"""
from __future__ import annotations

import asyncio
import json
import random
import time
from typing import Optional

from channels.generic.websocket import AsyncWebsocketConsumer

from game.state import ROOMS, Card, PlayerState, RoomState

# Load cards once at module import (after app is ready)
_CARDS_CACHE: Optional[list[Card]] = None


def _load_cards() -> list[Card]:
    global _CARDS_CACHE
    if _CARDS_CACHE is None:
        import os
        cards_path = os.path.join(os.path.dirname(__file__), "..", "cards.json")
        cards_path = os.path.normpath(cards_path)
        with open(cards_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        _CARDS_CACHE = [Card(**c) for c in data]
    return _CARDS_CACHE


def _room_update_payload(room: RoomState) -> dict:
    return {
        "type": "room_update",
        "players": [
            {"name": p.name, "color": p.color, "track": p.track, "square": p.square}
            for p in room.players
        ],
        "started": room.started,
    }


def _apply_movement(player: PlayerState, correct: bool) -> None:
    """Mutate player position according to game rules."""
    if player.track == 0:
        if correct:
            player.square = min(player.square + 1, 20)
        else:
            player.track = 1
    elif player.track == 1:
        if correct:
            player.track = 0
        else:
            player.track = 2
    elif player.track == 2:
        if correct:
            player.track = 1
        else:
            player.track = 0
            player.square = 1


class GameConsumer(AsyncWebsocketConsumer):
    # ------------------------------------------------------------------ #
    # Connection lifecycle                                                 #
    # ------------------------------------------------------------------ #

    async def connect(self):
        self.room_code = self.scope["url_route"]["kwargs"]["room_code"]
        self.group_name = f"room_{self.room_code}"
        self.role: str = ""
        self.player_name: str = ""

        if self.room_code not in ROOMS:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        room: Optional[RoomState] = ROOMS.get(self.room_code)
        if room is None:
            return

        if self.role == "teacher":
            # Teacher left → end the game for everyone
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "broadcast_message",
                    "payload": {
                        "type": "game_over",
                        "winner": None,
                        "reason": "Teacher disconnected.",
                    },
                },
            )
            del ROOMS[self.room_code]
        else:
            # Student left → remove from players list
            room.players = [p for p in room.players if p.channel_name != self.channel_name]
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "broadcast_message", "payload": _room_update_payload(room)},
            )

        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # ------------------------------------------------------------------ #
    # Inbound messages                                                     #
    # ------------------------------------------------------------------ #

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            await self._send_error("Invalid JSON.")
            return

        msg_type = data.get("type")
        room: Optional[RoomState] = ROOMS.get(self.room_code)

        if room is None:
            await self._send_error("Room not found.")
            return

        if msg_type == "join":
            await self._handle_join(data, room)
        elif msg_type == "start_game":
            await self._handle_start_game(room)
        elif msg_type == "draw_card":
            await self._handle_draw_card(room)
        elif msg_type == "player_answer":
            await self._handle_player_answer(data, room)
        elif msg_type == "end_game":
            await self._handle_end_game(room)
        else:
            await self._send_error(f"Unknown message type: {msg_type}")

    # ------------------------------------------------------------------ #
    # Handlers                                                             #
    # ------------------------------------------------------------------ #

    async def _handle_join(self, data: dict, room: RoomState):
        role = data.get("role", "student")
        name = data.get("name", "Anonymous")
        color = data.get("color", "blue")

        self.role = role
        self.player_name = name

        if role == "teacher":
            room.teacher_channel = self.channel_name
        else:
            # Validate color availability
            used_colors = {p.color for p in room.players}
            if color in used_colors:
                await self._send_error(f"Color '{color}' is already taken.")
                return
            if len(room.players) >= 5:
                await self._send_error("Room is full (max 5 students).")
                return

            room.players.append(
                PlayerState(
                    name=name,
                    color=color,
                    channel_name=self.channel_name,
                )
            )

        # Broadcast updated room state to everyone
        await self.channel_layer.group_send(
            self.group_name,
            {"type": "broadcast_message", "payload": _room_update_payload(room)},
        )

    async def _handle_start_game(self, room: RoomState):
        if self.role != "teacher":
            await self._send_error("Only the teacher can start the game.")
            return
        if room.started:
            await self._send_error("Game already started.")
            return

        # Shuffle a fresh copy of the deck for this game
        all_cards = _load_cards()
        room.cards = random.sample(all_cards, len(all_cards))
        room.played_cards = []
        room.started = True

        await self.channel_layer.group_send(
            self.group_name,
            {"type": "broadcast_message", "payload": _room_update_payload(room)},
        )

    async def _handle_draw_card(self, room: RoomState):
        if self.role != "teacher":
            await self._send_error("Only the teacher can draw cards.")
            return
        if not room.started:
            await self._send_error("Game has not started yet.")
            return
        if room.round_active:
            await self._send_error("A round is already active.")
            return
        if not room.cards:
            await self._send_error("No more cards in the deck.")
            return

        card = room.cards.pop()
        room.current_card = card
        room.played_cards.append(card.id)
        room.round_answers = {}
        room.round_active = True

        server_time = int(time.time() * 1000)  # ms

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "broadcast_message",
                "payload": {
                    "type": "round_start",
                    "card_id": card.id,
                    "sentence": card.sentence,
                    "server_time": server_time,
                },
            },
        )

        # Server-authoritative 10-second timer
        asyncio.ensure_future(self._end_round_after_delay(room))

    async def _handle_player_answer(self, data: dict, room: RoomState):
        if self.role == "teacher":
            return  # teachers don't answer
        if not room.round_active:
            return  # round already resolved

        answer = data.get("answer", "").lower()
        if answer not in ("in", "on", "at", "from"):
            await self._send_error("Invalid answer.")
            return

        # Only record first answer per player
        if self.channel_name not in room.round_answers:
            room.round_answers[self.channel_name] = answer

    async def _handle_end_game(self, room: RoomState):
        if self.role != "teacher":
            await self._send_error("Only the teacher can end the game.")
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "broadcast_message",
                "payload": {"type": "game_over", "winner": None, "reason": "Teacher ended the game."},
            },
        )
        if self.room_code in ROOMS:
            del ROOMS[self.room_code]

    # ------------------------------------------------------------------ #
    # Round resolution                                                     #
    # ------------------------------------------------------------------ #

    async def _end_round_after_delay(self, room: RoomState):
        await asyncio.sleep(10)

        if not room.round_active:
            return  # Game was ended while sleeping

        card = room.current_card
        if card is None:
            return

        correct_answer = card.answer.lower()
        results = []
        winner = None

        for player in room.players:
            submitted = room.round_answers.get(player.channel_name)
            is_correct = submitted == correct_answer
            _apply_movement(player, is_correct)

            results.append(
                {
                    "name": player.name,
                    "color": player.color,
                    "answer": submitted,
                    "correct": is_correct,
                    "track": player.track,
                    "square": player.square,
                }
            )

            if player.square >= 20 and player.track == 0:
                winner = {"name": player.name, "color": player.color}

        room.round_active = False

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "broadcast_message",
                "payload": {
                    "type": "round_end",
                    "correct_answer": correct_answer,
                    "explanation": card.explanation,
                    "results": results,
                },
            },
        )

        if winner:
            await asyncio.sleep(0.1)  # let round_end arrive first
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "broadcast_message",
                    "payload": {"type": "game_over", "winner": winner},
                },
            )
            if self.room_code in ROOMS:
                del ROOMS[self.room_code]

    # ------------------------------------------------------------------ #
    # Channel layer event handler (receives group broadcasts)             #
    # ------------------------------------------------------------------ #

    async def broadcast_message(self, event):
        """Called by channel layer when a group_send is posted."""
        await self.send(text_data=json.dumps(event["payload"]))

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    async def _send_error(self, message: str):
        await self.send(text_data=json.dumps({"type": "error", "message": message}))
