import { Preposition } from '../types'

interface Props {
  disabled: boolean
  answered: boolean
  lastAnswer: Preposition | null
  onAnswer: (p: Preposition) => void
}

const PREPS: Preposition[] = ['in', 'on', 'at', 'from']

const DESCRIPTIONS: Record<Preposition, string> = {
  in:   'Inside / within',
  on:   'Surface / day',
  at:   'Point / time',
  from: 'Origin',
}

export default function CardButtons({ disabled, answered, lastAnswer, onAnswer }: Props) {
  return (
    <div className="card-buttons-wrap">
      {PREPS.map((p) => {
        const isChosen = lastAnswer === p
        return (
          <button
            key={p}
            id={`btn-answer-${p}`}
            className={`prep-btn ${isChosen ? 'chosen' : ''} ${answered && !isChosen ? 'dimmed' : ''}`}
            disabled={disabled || answered}
            onClick={() => onAnswer(p)}
          >
            <span className="prep-label">{p.toUpperCase()}</span>
            <span className="prep-desc">{DESCRIPTIONS[p]}</span>
          </button>
        )
      })}

      <style>{`
        .card-buttons-wrap {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }
        .prep-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 20px 12px;
          background: var(--bg-raised);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: 'Outfit', sans-serif;
        }
        .prep-btn:hover:not(:disabled) {
          border-color: var(--accent);
          background: rgba(79, 110, 247, 0.1);
          transform: translateY(-4px);
          box-shadow: 0 8px 24px var(--accent-glow);
        }
        .prep-btn:active:not(:disabled) { transform: translateY(-1px); }
        .prep-btn:disabled { cursor: not-allowed; }
        .prep-btn.chosen {
          border-color: var(--accent);
          background: rgba(79, 110, 247, 0.2);
          box-shadow: 0 0 20px var(--accent-glow);
        }
        .prep-btn.dimmed { opacity: 0.35; }

        .prep-label {
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: 2px;
          line-height: 1;
        }
        .prep-desc {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-align: center;
          font-weight: 500;
        }

        @media (max-width: 500px) {
          .card-buttons-wrap { grid-template-columns: repeat(2, 1fr); }
          .prep-label { font-size: 1.4rem; }
        }
      `}</style>
    </div>
  )
}
