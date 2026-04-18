"""
In-memory game state for The Well Game.
No database — all state lives here per process lifetime.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class PlayerState:
    name: str
    color: str
    channel_name: str
    track: int = 0   # 0 = main path, 1 = trail, 2 = the well
    square: int = 1  # 1-20


@dataclass
class Card:
    id: int
    sentence: str
    answer: str
    category: str
    explanation: str


@dataclass
class RoomState:
    room_code: str
    teacher_channel: str = ""
    players: list[PlayerState] = field(default_factory=list)
    cards: list[Card] = field(default_factory=list)
    played_cards: list[int] = field(default_factory=list)
    current_card: Optional[Card] = None
    round_answers: dict[str, str] = field(default_factory=dict)
    started: bool = False
    round_active: bool = False


# Global rooms registry  {room_code: RoomState}
ROOMS: dict[str, RoomState] = {}
