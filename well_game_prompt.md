# Prompt — Build The Well Game MVP

You are a senior full-stack engineer. Build a complete, playable MVP of **The Well Game**, an educational multiplayer boardgame for English teachers and students.

---

## What You Are Building

A real-time browser-based boardgame where a teacher draws cards with incomplete English sentences and students race to fill in the correct preposition (in / on / at / from) within 10 seconds.

---

## Tech Stack

- **Backend**: Django 4.x + Django Channels 4.x (WebSocket support)
- **Frontend**: React 18 + TypeScript + Vite
- **Real-time**: WebSocket (Django Channels with in-memory channel layer)
- **State**: In-memory Python dict on the server (no database)
- **Cards**: `backend/cards.json` — JSON file loaded at server startup
- **Containerization**: Docker + Docker Compose

Do NOT use any database. Do NOT use Redis. Use the in-memory channel layer from Django Channels.

---

## Project Structure

```
well-game/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── cards.json
│   ├── manage.py
│   └── game/
│       ├── __init__.py
│       ├── consumers.py      # WebSocket logic
│       ├── routing.py
│       ├── state.py          # In-memory game state
│       └── views.py          # HTTP: generate room code
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── types.ts
        ├── components/
        │   ├── RoleSelect.tsx
        │   ├── Lobby.tsx
        │   ├── Board.tsx
        │   ├── CardButtons.tsx
        │   ├── TeacherControls.tsx
        │   ├── Timer.tsx
        │   └── ResultOverlay.tsx
        └── hooks/
            └── useGameSocket.ts
```

---

## Game Rules (implement exactly)

### Board Layout
- Three parallel horizontal tracks, each with 20 squares:
  - **Track 0** — Main path (top)
  - **Track 1** — Trail / penalty path (middle)
  - **Track 2** — The Well (bottom)
- Each player has a colored pawn. Available colors: `red`, `blue`, `green`, `yellow`, `purple`.
- All pawns start on Track 0, Square 1.

### Movement Logic (applied after each round)

```
If player is on Track 0:
  Correct → advance 1 square on Track 0
  Wrong   → move to Track 1, same square number

If player is on Track 1:
  Correct → move back to Track 0, same square number
  Wrong   → move to Track 2, same square number

If player is on Track 2:
  Correct → move to Track 1, same square number
  Wrong   → reset to Track 0, Square 1
```

### Win Condition
Any player reaching Square 20 on any track triggers an immediate game end. Display a winner screen to all connected clients.

### Round Flow
1. Teacher clicks "Draw Card" → server picks a random unplayed card from `cards.json`
2. Server broadcasts `round_start` event to all clients with: sentence (with `**`), card ID, timestamp
3. 10-second countdown begins simultaneously on all clients (client-side timer, synced by server timestamp)
4. Players click IN / ON / AT / FROM — sends `player_answer` WebSocket message
5. After 10 seconds, server broadcasts `round_end` with: correct answer, explanation, each player's answer, updated positions
6. Show result overlay for 3 seconds, then return to waiting state

---

## WebSocket Protocol

All messages are JSON. Direction: C = client, S = server.

### C → S Messages

```json
// Join room
{ "type": "join", "room_code": "WLG-4F2", "role": "student", "name": "Ana", "color": "red" }

// Teacher: start game
{ "type": "start_game" }

// Teacher: draw card
{ "type": "draw_card" }

// Student: submit answer
{ "type": "player_answer", "answer": "in" }

// Teacher: end game
{ "type": "end_game" }
```

### S → C Messages

```json
// Room state update (lobby)
{ "type": "room_update", "players": [{"name": "Ana", "color": "red"}], "started": false }

// Round started
{ "type": "round_start", "card_id": 3, "sentence": "I live ** Brazil.", "server_time": 1700000000000 }

// Round ended
{
  "type": "round_end",
  "correct_answer": "in",
  "explanation": "Countries use 'in'.",
  "results": [
    { "name": "Ana", "color": "red", "answer": "in", "correct": true, "track": 0, "square": 2 }
  ]
}

// Game over
{ "type": "game_over", "winner": { "name": "Ana", "color": "red" } }

// Error
{ "type": "error", "message": "Room not found." }
```

---

## Backend — Key Requirements

### `state.py`
Maintain a global dict `ROOMS`:
```python
ROOMS: dict[str, RoomState] = {}
```

`RoomState` must hold:
- `room_code: str`
- `teacher_channel: str`
- `players: list[PlayerState]` (max 5)
- `cards: list[Card]` — shuffled at game start, popped each round
- `played_cards: list[int]` — card IDs already used
- `current_card: Card | None`
- `round_answers: dict[str, str]` — channel → answer
- `started: bool`

`PlayerState`:
- `name`, `color`, `channel_name`, `track` (0/1/2), `square` (1–20)

### `consumers.py`
- Single `GameConsumer(AsyncWebsocketConsumer)`
- On `connect`: add to channel group `room_{code}`
- On `disconnect`: remove player, broadcast `room_update`; if teacher disconnects, broadcast `game_over`
- Handle all message types listed above
- On `draw_card`: pop from shuffled deck, broadcast `round_start`, schedule `round_end` after 10s using `asyncio.sleep`
- On `round_end`: apply movement logic, check win condition, broadcast results

### HTTP endpoint
`POST /api/create-room/` → returns `{ "room_code": "WLG-4F2" }`. Generates a 6-char alphanumeric code and initializes empty room in `ROOMS`.

---

## Frontend — Key Requirements

### `types.ts`
Define all TypeScript interfaces matching the WebSocket protocol above.

### `useGameSocket.ts`
Custom hook that:
- Manages WebSocket connection lifecycle
- Parses incoming messages and updates React state
- Exposes: `sendMessage`, `gameState`, `connectionStatus`

### `App.tsx` — routing by game phase:
1. `role_select` → `<RoleSelect />`
2. `lobby` → `<Lobby />`
3. `playing` → `<Board />` + role-specific controls
4. `game_over` → winner screen

### `Board.tsx`
- Render 3 horizontal tracks, each with 20 numbered squares
- Render each player's pawn at the correct track + square
- Pawns are colored circles with the player's initial inside
- Animate pawn movement with a CSS transition

### `Timer.tsx`
- Receives `serverTime` from `round_start` event
- Calculates elapsed time client-side using `Date.now()`
- Displays countdown from 10 to 0
- Turns red below 3 seconds

### `CardButtons.tsx` (students only)
- Four large buttons: IN / ON / AT / FROM
- Disabled after the student submits an answer
- Disabled after `round_end` until next `round_start`

### `TeacherControls.tsx`
- "Draw Card" button — disabled while a round is active
- "End Game" button — always active during game

---

## `cards.json` — Starter Deck

Provide at least 20 cards covering:
- **Place**: countries, cities, streets, buildings, rooms, specific addresses
- **Time**: months, years, days, specific times, morning/afternoon/night
- **Exceptions**: `at home`, `on time`, `in time`, `at the end`, `on the way`, `from` origin

Example structure:
```json
[
  { "id": 1, "sentence": "I live ** Brazil.", "answer": "in", "category": "place", "explanation": "Countries use 'in'." },
  { "id": 2, "sentence": "The meeting is ** Monday.", "answer": "on", "category": "time", "explanation": "Days of the week use 'on'." },
  { "id": 3, "sentence": "She arrives ** 3 o'clock.", "answer": "at", "category": "time", "explanation": "Specific times use 'at'." },
  { "id": 4, "sentence": "He is ** home.", "answer": "at", "category": "exception", "explanation": "'At home' is a fixed expression." },
  { "id": 5, "sentence": "I was born ** 1995.", "answer": "in", "category": "time", "explanation": "Years use 'in'." }
]
```

---

## Docker Setup

### `docker-compose.yml`
```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes: ["./backend:/app"]

  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [backend]
    environment:
      - VITE_WS_URL=ws://localhost:8000/ws/game/
      - VITE_API_URL=http://localhost:8000
```

### Backend `Dockerfile`
- Python 3.11-slim
- Install: `django`, `channels`, `daphne`
- Run with: `daphne -b 0.0.0.0 -p 8000 backend.asgi:application`

### Frontend `Dockerfile`
- node:20-alpine
- `npm install && npm run dev -- --host`

---

## Acceptance Criteria

The MVP is complete when:

- [ ] Teacher opens site, gets a room code
- [ ] 3 students join with the code, each picks a distinct color
- [ ] Teacher starts game, all clients transition to the board view
- [ ] Teacher draws a card, all clients see the same sentence and synchronized 10s timer
- [ ] Students submit answers; after 10s server resolves the round and moves pawns correctly
- [ ] Movement logic (Track 0→1→2→reset) works for all error scenarios
- [ ] First player to reach Square 20 triggers game over on all screens
- [ ] Teacher can end game early at any time
- [ ] If teacher disconnects, game ends for all students

---

## Implementation Notes

- Use `asyncio.sleep(10)` inside the consumer for the round timer, not a frontend-driven timer end
- The frontend timer is display-only; round resolution is always server-authoritative
- CORS: allow `localhost:5173` in Django settings for development
- WebSocket URL pattern: `ws/game/<room_code>/`
- Channel layer: `channels.layers.InMemoryChannelLayer` — no Redis
- Load `cards.json` once at startup in `apps.py` `ready()` method
- Shuffle cards per game, not globally — each game gets its own shuffled copy
