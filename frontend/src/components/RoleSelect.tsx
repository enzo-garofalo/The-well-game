import { useState } from 'react'
import { PawnColor, Role } from '../types'

const COLORS: PawnColor[] = ['red', 'blue', 'green', 'yellow', 'purple']
const COLOR_LABELS: Record<PawnColor, string> = {
  red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow', purple: 'Purple',
}

interface Props {
  onJoinTeacher: (name: string) => void
  onJoinStudent: (roomCode: string, name: string, color: PawnColor) => void
  error: string | null
}

export default function RoleSelect({ onJoinTeacher, onJoinStudent, error }: Props) {
  const [role, setRole] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [color, setColor] = useState<PawnColor>('blue')

  const handleSubmit = () => {
    if (!name.trim()) return
    if (role === 'teacher') {
      onJoinTeacher(name.trim())
    } else if (role === 'student') {
      if (!roomCode.trim()) return
      onJoinStudent(roomCode.trim().toUpperCase(), name.trim(), color)
    }
  }

  return (
    <div className="role-select-bg">
      {/* Decorative circles */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <div className="role-select-container animate-fadeIn">
        <div className="role-select-header">
          <h1 className="game-title">
            <span className="title-the">The</span>
            <span className="title-well"> Well </span>
            <span className="title-game">Game</span>
          </h1>
          <p className="game-subtitle">Master English prepositions in real-time competition</p>
        </div>

        {!role ? (
          <div className="role-cards">
            <button
              id="btn-role-teacher"
              className="role-card"
              onClick={() => setRole('teacher')}
            >
              <div className="role-icon">🎓</div>
              <h3>I'm a Teacher</h3>
              <p>Create a room and run the game</p>
            </button>
            <button
              id="btn-role-student"
              className="role-card"
              onClick={() => setRole('student')}
            >
              <div className="role-icon">🎮</div>
              <h3>I'm a Student</h3>
              <p>Join a room and play</p>
            </button>
          </div>
        ) : (
          <div className="role-form card animate-fadeIn">
            <button className="btn btn-ghost back-btn" onClick={() => setRole(null)}>← Back</button>

            <h2>{role === 'teacher' ? '🎓 Create a Room' : '🎮 Join a Room'}</h2>

            <div className="form-group">
              <label htmlFor="input-name">Your name</label>
              <input
                id="input-name"
                className="input"
                placeholder="e.g. Ms. Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>

            {role === 'student' && (
              <>
                <div className="form-group">
                  <label htmlFor="input-room-code">Room code</label>
                  <input
                    id="input-room-code"
                    className="input mono"
                    placeholder="e.g. WLG-4F2"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                </div>

                <div className="form-group">
                  <label>Choose your pawn color</label>
                  <div className="color-picker">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        id={`btn-color-${c}`}
                        className={`color-swatch ${color === c ? 'selected' : ''}`}
                        style={{ '--pawn-c': `var(--pawn-${c})` } as React.CSSProperties}
                        onClick={() => setColor(c)}
                        title={COLOR_LABELS[c]}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && <div className="error-banner">{error}</div>}

            <button
              id="btn-confirm-join"
              className="btn btn-primary btn-lg"
              onClick={handleSubmit}
              disabled={!name.trim() || (role === 'student' && !roomCode.trim())}
            >
              {role === 'teacher' ? 'Create Room' : 'Join Room'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .role-select-bg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.12;
          pointer-events: none;
        }
        .orb-1 { width: 500px; height: 500px; background: var(--accent); top: -150px; left: -150px; }
        .orb-2 { width: 400px; height: 400px; background: var(--green); bottom: -100px; right: -100px; }
        .orb-3 { width: 300px; height: 300px; background: var(--pawn-purple); top: 50%; left: 60%; }

        .role-select-container {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          position: relative;
          z-index: 1;
        }
        .role-select-header { text-align: center; }
        .game-title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -2px;
          margin-bottom: 12px;
        }
        .title-the  { color: var(--text-secondary); }
        .title-well {
          background: linear-gradient(135deg, #4f6ef7, #22d3a9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .title-game { color: var(--text-primary); }
        .game-subtitle { font-size: 1.05rem; color: var(--text-secondary); }

        .role-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .role-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 36px 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-primary);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .role-card:hover {
          border-color: var(--accent);
          transform: translateY(-4px);
          box-shadow: 0 8px 32px var(--accent-glow);
        }
        .role-card h3 { font-size: 1.2rem; font-weight: 700; }
        .role-card p  { font-size: 0.9rem; color: var(--text-muted); }
        .role-icon { font-size: 3rem; }

        .role-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .back-btn { align-self: flex-start; padding: 8px 16px; font-size: 0.9rem; }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .color-picker {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .color-swatch {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--pawn-c);
          border: 3px solid transparent;
          cursor: pointer;
          transition: transform 0.15s, border-color 0.15s;
        }
        .color-swatch:hover { transform: scale(1.15); }
        .color-swatch.selected {
          border-color: #fff;
          box-shadow: 0 0 0 3px var(--pawn-c);
          transform: scale(1.15);
        }
      `}</style>
    </div>
  )
}
