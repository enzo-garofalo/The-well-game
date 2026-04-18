import { PlayerInfo, Role } from '../types'

interface Props {
  roomCode: string
  role: Role
  players: PlayerInfo[]
  playerName: string
  onStartGame: () => void
  error: string | null
}

const PAWN_COLORS: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', purple: '#a855f7',
}

export default function Lobby({ roomCode, role, players, playerName, onStartGame, error }: Props) {
  const canStart = role === 'teacher' && players.length >= 1

  return (
    <div className="lobby-wrap animate-fadeIn">
      <div className="lobby-header">
        <h1>Waiting Room</h1>
        <p>Share the code below with your students</p>
      </div>

      <div className="room-code-display">
        <span className="room-code-label">Room Code</span>
        <div className="room-code-value mono">{roomCode}</div>
        <button
          id="btn-copy-code"
          className="btn btn-ghost copy-btn"
          onClick={() => navigator.clipboard.writeText(roomCode)}
        >
          📋 Copy
        </button>
      </div>

      <div className="lobby-players card">
        <h3>Players ({players.length}/5)</h3>
        {players.length === 0 ? (
          <p className="waiting-label">Waiting for students to join…</p>
        ) : (
          <ul className="player-list">
            {players.map((p) => (
              <li key={p.name + p.color} className="player-item">
                <div
                  className="pawn-dot"
                  style={{ background: PAWN_COLORS[p.color] ?? '#888' }}
                />
                <span className="player-name">
                  {p.name}
                  {p.name === playerName && role === 'student' && (
                    <span className="you-badge"> (you)</span>
                  )}
                </span>
                <span
                  className="player-color-tag"
                  style={{ color: PAWN_COLORS[p.color] ?? '#888' }}
                >
                  {p.color}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {role === 'teacher' ? (
        <button
          id="btn-start-game"
          className="btn btn-primary btn-lg animate-glow"
          onClick={onStartGame}
          disabled={!canStart}
        >
          🚀 Start Game
        </button>
      ) : (
        <div className="waiting-pill">
          <span className="dot-spinner" />
          Waiting for the teacher to start…
        </div>
      )}

      <style>{`
        .lobby-wrap {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 24px;
        }
        .lobby-header { text-align: center; }
        .lobby-header h1 { margin-bottom: 8px; }

        .room-code-display {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 28px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          min-width: 300px;
        }
        .room-code-label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; }
        .room-code-value {
          font-size: 3rem;
          font-weight: 700;
          letter-spacing: 6px;
          background: linear-gradient(135deg, var(--accent), var(--green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .copy-btn { font-size: 0.85rem; padding: 8px 16px; }

        .lobby-players {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .lobby-players h3 { color: var(--text-primary); }
        .waiting-label { color: var(--text-muted); font-size: 0.9rem; }

        .player-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .player-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: var(--bg-raised);
          border-radius: var(--radius-md);
          animation: fadeIn 0.3s ease;
        }
        .pawn-dot { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; }
        .player-name { flex: 1; font-weight: 600; }
        .you-badge { color: var(--text-muted); font-weight: 400; font-size: 0.85rem; }
        .player-color-tag { font-size: 0.8rem; font-weight: 600; text-transform: capitalize; }

        .waiting-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 14px 28px;
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .dot-spinner {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse 1.2s ease infinite;
        }
      `}</style>
    </div>
  )
}
