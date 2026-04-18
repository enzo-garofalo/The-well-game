import { useEffect, useState } from 'react'
import { useGameSocket } from './hooks/useGameSocket'
import RoleSelect from './components/RoleSelect'
import Lobby from './components/Lobby'
import Board from './components/Board'
import Timer from './components/Timer'
import CardButtons from './components/CardButtons'
import TeacherControls from './components/TeacherControls'
import ResultOverlay from './components/ResultOverlay'
import { Preposition } from './types'

const PAWN_COLORS: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', purple: '#a855f7',
}

export default function App() {
  const {
    gameState,
    joinAsTeacher,
    joinAsStudent,
    startGame,
    drawCard,
    endGame,
    submitAnswer,
    reset,
  } = useGameSocket()

  const { phase, role, players, sentence, serverTime, roundActive, hasAnswered, lastAnswer, roundResult, winner, error, roomCode, playerName } = gameState

  const [showResultOverlay, setShowResultOverlay] = useState(false)

  // Auto-dismiss result overlay after 3 seconds
  useEffect(() => {
    if (roundResult && !roundActive) {
      setShowResultOverlay(true)
      const t = setTimeout(() => {
        setShowResultOverlay(false)
      }, 3000)
      return () => clearTimeout(t)
    } else {
      setShowResultOverlay(false)
    }
  }, [roundResult, roundActive])

  // ─── Game Over screen ──────────────────────────────────────────────────────
  if (phase === 'game_over') {
    return (
      <div className="game-over-wrap">
        <div className="game-over-bg-orb orb-a" />
        <div className="game-over-bg-orb orb-b" />

        <div className="game-over-card animate-slideUp">
          {winner ? (
            <>
              <div className="trophy">🏆</div>
              <h1>We have a winner!</h1>
              <div className="winner-display">
                <div
                  className="winner-pawn"
                  style={{ background: PAWN_COLORS[winner.color] ?? '#888' }}
                >
                  {winner.name[0].toUpperCase()}
                </div>
                <span className="winner-name">{winner.name}</span>
              </div>
              <p className="winner-color-label" style={{ color: PAWN_COLORS[winner.color] }}>
                The {winner.color} pawn reaches square 20!
              </p>
            </>
          ) : (
            <>
              <div className="trophy">🎓</div>
              <h1>Game Over</h1>
              <p>The teacher ended the session.</p>
            </>
          )}
          <button id="btn-play-again" className="btn btn-primary btn-lg" onClick={reset}>
            Play Again
          </button>
        </div>

        <style>{`
          .game-over-wrap {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            padding: 24px;
          }
          .game-over-bg-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(100px);
            opacity: 0.15;
            pointer-events: none;
          }
          .orb-a { width: 600px; height: 600px; background: var(--accent); top: -200px; right: -200px; }
          .orb-b { width: 500px; height: 500px; background: var(--green); bottom: -150px; left: -150px; }
          .game-over-card {
            position: relative; z-index: 1;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-xl);
            padding: 48px 56px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            box-shadow: var(--shadow-lg);
            text-align: center;
            max-width: 480px;
            width: 100%;
          }
          .trophy { font-size: 5rem; animation: pulse 1.5s ease infinite; }
          .winner-display {
            display: flex;
            align-items: center;
            gap: 16px;
            background: var(--bg-raised);
            border-radius: var(--radius-xl);
            padding: 16px 32px;
          }
          .winner-pawn {
            width: 56px; height: 56px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem; font-weight: 900; color: #fff;
            border: 3px solid rgba(255,255,255,0.5);
            box-shadow: 0 0 20px currentColor;
          }
          .winner-name { font-size: 2rem; font-weight: 700; }
          .winner-color-label { font-size: 0.9rem; font-weight: 600; }
        `}</style>
      </div>
    )
  }

  // ─── Role select ───────────────────────────────────────────────────────────
  if (phase === 'role_select') {
    return (
      <RoleSelect
        onJoinTeacher={joinAsTeacher}
        onJoinStudent={joinAsStudent}
        error={error}
      />
    )
  }

  // ─── Lobby ─────────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <Lobby
        roomCode={roomCode}
        role={role!}
        players={players}
        playerName={playerName}
        onStartGame={startGame}
        error={error}
      />
    )
  }

  // ─── Playing ───────────────────────────────────────────────────────────────
  const sentenceFormatted = sentence
    ? sentence.replace(/\*\*/g, '______')
    : null

  return (
    <div className="game-wrap">
      {/* Header bar */}
      <header className="game-header">
        <div className="header-left">
          <span className="game-brand">🪣 The Well Game</span>
          <span className="room-code-badge mono">{roomCode}</span>
        </div>
        <div className="header-right">
          {roundActive && serverTime !== null && (
            <Timer serverTime={serverTime} />
          )}
        </div>
      </header>

      {/* Sentence card */}
      <div className="sentence-area">
        {sentence ? (
          <div className="sentence-card animate-fadeIn">
            <span className="sentence-hint">Fill in the blank:</span>
            <p className="sentence-text">{sentenceFormatted}</p>
          </div>
        ) : (
          <div className="sentence-placeholder">
            {role === 'teacher'
              ? 'Press "Draw Card" to start a round'
              : 'Waiting for the teacher to draw a card…'}
          </div>
        )}
      </div>

      {/* Board */}
      <div className="board-area">
        <Board players={players} />
      </div>

      {/* Player legend */}
      <div className="player-legend">
        {players.map((p) => (
          <div key={p.name} className="legend-item">
            <div className="legend-pawn" style={{ background: PAWN_COLORS[p.color] ?? '#888' }}>
              {p.name[0].toUpperCase()}
            </div>
            <span className="legend-name">{p.name}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="controls-area">
        {role === 'teacher' ? (
          <TeacherControls
            roundActive={roundActive}
            onDrawCard={drawCard}
            onEndGame={endGame}
          />
        ) : (
          <CardButtons
            disabled={!roundActive}
            answered={hasAnswered}
            lastAnswer={lastAnswer as Preposition | null}
            onAnswer={submitAnswer}
          />
        )}
      </div>

      {error && <div className="error-banner game-error">{error}</div>}

      {/* Result overlay */}
      {showResultOverlay && roundResult && !roundActive && (
        <ResultOverlay result={roundResult} />
      )}

      <style>{`
        .game-wrap {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .game-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 12px 20px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .game-brand {
          font-size: 1.1rem;
          font-weight: 700;
        }
        .room-code-badge {
          font-size: 0.85rem;
          padding: 4px 12px;
          background: var(--bg-raised);
          border: 1px solid var(--border);
          border-radius: 99px;
          color: var(--text-secondary);
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sentence-area {
          min-height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sentence-card {
          width: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 24px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          box-shadow: 0 0 30px var(--accent-glow);
        }
        .sentence-hint {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .sentence-text {
          font-size: clamp(1.3rem, 3vw, 2rem);
          font-weight: 700;
          color: var(--text-primary);
          text-align: center;
          line-height: 1.4;
        }
        .sentence-placeholder {
          color: var(--text-muted);
          font-size: 1rem;
          text-align: center;
          animation: pulse 2s ease infinite;
        }

        .board-area { flex: 1; }

        .player-legend {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 6px 14px 6px 8px;
        }
        .legend-pawn {
          width: 24px; height: 24px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; font-weight: 900; color: #fff;
          border: 1.5px solid rgba(255,255,255,0.4);
        }
        .legend-name { font-size: 0.85rem; font-weight: 600; }

        .controls-area {
          padding-bottom: 8px;
        }

        .game-error {
          margin-top: -8px;
        }
      `}</style>
    </div>
  )
}
