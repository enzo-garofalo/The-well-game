import { PlayerInfo } from '../types'

interface Props {
  players: PlayerInfo[]
}

const SQUARES = 20
const TRACK_NAMES = ['Main Path', 'Trail', 'The Well']

const PAWN_COLORS: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', purple: '#a855f7',
}

export default function Board({ players }: Props) {
  return (
    <div className="board-container">
      {[0, 1, 2].map((track) => (
        <div key={track} className="track-row">
          <div className={`track-label track-label-${track}`}>
            <span className="track-icon">{track === 0 ? '🏆' : track === 1 ? '⚠️' : '💀'}</span>
            <span>{TRACK_NAMES[track]}</span>
          </div>
          <div className="squares-grid">
            {Array.from({ length: SQUARES }, (_, i) => {
              const sq = i + 1
              const pawnsHere = players.filter(
                (p) => p.track === track && p.square === sq
              )
              return (
                <div
                  key={sq}
                  className={`square track-${track} ${sq === 20 ? 'square-finish' : ''}`}
                >
                  <span className="square-num">{sq}</span>
                  {sq === 20 && <span className="finish-star">⭐</span>}
                  {pawnsHere.length > 0 && (
                    <div className="pawns-in-square">
                      {pawnsHere.map((p) => (
                        <div
                          key={p.name}
                          className="pawn"
                          style={{ background: PAWN_COLORS[p.color] ?? '#888' }}
                          title={p.name}
                        >
                          {p.name[0].toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <style>{`
        .board-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 20px;
          overflow-x: auto;
        }
        .track-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .track-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          width: 68px;
          min-width: 68px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: center;
          color: var(--text-muted);
        }
        .track-label-0 { color: var(--green); }
        .track-label-1 { color: var(--yellow); }
        .track-label-2 { color: var(--red); }
        .track-icon { font-size: 1.3rem; }

        .squares-grid {
          display: grid;
          grid-template-columns: repeat(20, 1fr);
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .square {
          position: relative;
          aspect-ratio: 1;
          min-width: 32px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          background: var(--bg-raised);
          overflow: visible;
          transition: background 0.2s;
        }
        .track-0 { border-color: rgba(34,211,169,0.2); }
        .track-1 { border-color: rgba(251,191,36,0.2); }
        .track-2 { border-color: rgba(247,95,79,0.2); }
        .square-finish {
          border-color: #fbbf24 !important;
          box-shadow: 0 0 12px rgba(251,191,36,0.4);
          background: rgba(251,191,36,0.08) !important;
        }
        .square-num {
          font-size: 0.55rem;
          color: var(--text-muted);
          font-weight: 600;
          position: absolute;
          top: 2px;
          left: 3px;
          line-height: 1;
        }
        .finish-star {
          font-size: 0.9rem;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.5;
        }

        .pawns-in-square {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1px;
          padding: 2px;
          z-index: 2;
        }
        .pawn {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: 900;
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.6);
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
          animation: pawnMove 0.4s ease;
          flex-shrink: 0;
        }

        @media (max-width: 700px) {
          .square { min-width: 22px; }
          .pawn { width: 14px; height: 14px; font-size: 0.5rem; }
          .track-label { width: 50px; min-width: 50px; font-size: 0.55rem; }
        }
      `}</style>
    </div>
  )
}
