// ─── WebSocket protocol types ──────────────────────────────────────────────

export type Preposition = 'in' | 'on' | 'at' | 'from'

export type Role = 'teacher' | 'student'

export type GamePhase = 'role_select' | 'lobby' | 'playing' | 'game_over'

export type PawnColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple'

export interface PlayerInfo {
  name: string
  color: PawnColor
  track: number   // 0 | 1 | 2
  square: number  // 1–20
}

// ─── Server → Client messages ──────────────────────────────────────────────

export interface RoomUpdateMsg {
  type: 'room_update'
  players: PlayerInfo[]
  started: boolean
}

export interface RoundStartMsg {
  type: 'round_start'
  card_id: number
  sentence: string
  server_time: number // ms epoch
}

export interface RoundResult {
  name: string
  color: PawnColor
  answer: string | null
  correct: boolean
  track: number
  square: number
}

export interface RoundEndMsg {
  type: 'round_end'
  correct_answer: Preposition
  explanation: string
  results: RoundResult[]
}

export interface GameOverMsg {
  type: 'game_over'
  winner: { name: string; color: PawnColor } | null
  reason?: string
}

export interface ErrorMsg {
  type: 'error'
  message: string
}

export type ServerMessage =
  | RoomUpdateMsg
  | RoundStartMsg
  | RoundEndMsg
  | GameOverMsg
  | ErrorMsg

// ─── Game state shape ──────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase
  role: Role | null
  roomCode: string
  playerName: string
  playerColor: PawnColor | null
  players: PlayerInfo[]
  sentence: string | null
  serverTime: number | null  // ms epoch when round started
  roundActive: boolean
  hasAnswered: boolean
  lastAnswer: Preposition | null
  roundResult: RoundEndMsg | null
  winner: GameOverMsg['winner']
  error: string | null
}
