import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GameState,
  Preposition,
  Role,
  PawnColor,
  ServerMessage,
  RoomUpdateMsg,
  RoundStartMsg,
  RoundEndMsg,
  GameOverMsg,
} from '../types'

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/game/'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const initialState: GameState = {
  phase: 'role_select',
  role: null,
  roomCode: '',
  playerName: '',
  playerColor: null,
  players: [],
  sentence: null,
  serverTime: null,
  roundActive: false,
  hasAnswered: false,
  lastAnswer: null,
  roundResult: null,
  winner: null,
  error: null,
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export function useGameSocket() {
  const [gameState, setGameState] = useState<GameState>(initialState)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const pendingJoinRef = useRef<object | null>(null)

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  const connect = useCallback((roomCode: string) => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    setConnectionStatus('connecting')
    const ws = new WebSocket(`${WS_BASE}${roomCode}/`)
    wsRef.current = ws

    ws.onopen = () => {
      setConnectionStatus('connected')
      if (pendingJoinRef.current) {
        ws.send(JSON.stringify(pendingJoinRef.current))
        pendingJoinRef.current = null
      }
    }

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data)
        handleServerMessage(msg)
      } catch {
        console.error('Failed to parse WS message', event.data)
      }
    }

    ws.onerror = () => {
      setGameState((s) => ({ ...s, error: 'WebSocket connection error.' }))
    }

    ws.onclose = () => {
      setConnectionStatus('disconnected')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleServerMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'room_update': {
        const m = msg as RoomUpdateMsg
        setGameState((s) => ({
          ...s,
          players: m.players,
          phase: m.started && s.phase === 'lobby' ? 'playing' : s.phase,
          error: null,
        }))
        break
      }
      case 'round_start': {
        const m = msg as RoundStartMsg
        setGameState((s) => ({
          ...s,
          sentence: m.sentence,
          serverTime: m.server_time,
          roundActive: true,
          hasAnswered: false,
          lastAnswer: null,
          roundResult: null,
        }))
        break
      }
      case 'round_end': {
        const m = msg as RoundEndMsg
        // Update players from results
        setGameState((s) => {
          const updatedPlayers = s.players.map((p) => {
            const result = m.results.find((r) => r.name === p.name && r.color === p.color)
            if (result) {
              return { ...p, track: result.track, square: result.square }
            }
            return p
          })
          return {
            ...s,
            roundActive: false,
            roundResult: m,
            players: updatedPlayers,
            sentence: null,
            serverTime: null,
          }
        })
        break
      }
      case 'game_over': {
        const m = msg as GameOverMsg
        setGameState((s) => ({
          ...s,
          phase: 'game_over',
          winner: m.winner,
          roundActive: false,
        }))
        wsRef.current?.close()
        break
      }
      case 'error': {
        setGameState((s) => ({ ...s, error: msg.message }))
        break
      }
    }
  }, [])

  // ─── Public API ────────────────────────────────────────────────────────────

  const createRoom = useCallback(async (): Promise<string> => {
    const res = await fetch(`${API_BASE}/api/create-room/`, { method: 'POST' })
    const data = await res.json()
    return data.room_code as string
  }, [])

  const joinAsTeacher = useCallback(
    async (name: string) => {
      const roomCode = await createRoom()
      setGameState((s) => ({
        ...s,
        role: 'teacher' as Role,
        roomCode,
        playerName: name,
        phase: 'lobby',
        error: null,
      }))
      pendingJoinRef.current = { type: 'join', room_code: roomCode, role: 'teacher', name }
      connect(roomCode)
    },
    [createRoom, connect]
  )

  const joinAsStudent = useCallback(
    (roomCode: string, name: string, color: PawnColor) => {
      setGameState((s) => ({
        ...s,
        role: 'student' as Role,
        roomCode,
        playerName: name,
        playerColor: color,
        phase: 'lobby',
        error: null,
      }))
      pendingJoinRef.current = { type: 'join', room_code: roomCode, role: 'student', name, color }
      connect(roomCode)
    },
    [connect]
  )

  const startGame = useCallback(() => send({ type: 'start_game' }), [send])
  const drawCard = useCallback(() => send({ type: 'draw_card' }), [send])
  const endGame = useCallback(() => send({ type: 'end_game' }), [send])

  const submitAnswer = useCallback(
    (answer: Preposition) => {
      send({ type: 'player_answer', answer })
      setGameState((s) => ({ ...s, hasAnswered: true, lastAnswer: answer }))
    },
    [send]
  )

  const reset = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    setGameState(initialState)
    setConnectionStatus('disconnected')
  }, [])

  useEffect(() => {
    return () => {
      wsRef.current?.close()
    }
  }, [])

  return {
    gameState,
    connectionStatus,
    joinAsTeacher,
    joinAsStudent,
    startGame,
    drawCard,
    endGame,
    submitAnswer,
    reset,
  }
}
