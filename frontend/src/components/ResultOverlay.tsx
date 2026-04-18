import { RoundEndMsg } from '../types'

interface Props {
  result: RoundEndMsg
  onDismiss?: () => void
}

const PAWN_COLORS: Record<string, string> = {
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308', purple: '#a855f7',
}

const TRACK_NAMES = ['Main Path', 'Trail', 'The Well']

export default function ResultOverlay({ result, onDismiss }: Props) {
  return (
    <div className="overlay-backdrop" onClick={onDismiss}>
      <div className="overlay-card animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="correct-answer">
          <span className="answer-label">Correct Answer</span>
          <span className="answer-value">{result.correct_answer.toUpperCase()}</span>
        </div>
        <p className="explanation">{result.explanation}</p>

        <div className="results-list">
          {result.results.map((r) => (
            <div key={r.name} className={`result-row ${r.correct ? 'correct' : 'wrong'}`}>
              <div className="result-pawn" style={{ background: PAWN_COLORS[r.color] ?? '#888' }}>
                {r.name[0].toUpperCase()}
              </div>
              <span className="result-name">{r.name}</span>
              <span className={`result-answer-val ${r.correct ? 'green' : 'red'}`}>
                {r.answer ? r.answer.toUpperCase() : '—'}
              </span>
              <span className="result-verdict">{r.correct ? '✅' : '❌'}</span>
              <span className="result-pos">
                {TRACK_NAMES[r.track]} · sq {r.square}
              </span>
            </div>
          ))}
        </div>

        <div className="overlay-footer">
          <p className="next-hint">Next round starting soon…</p>
          {onDismiss && (
            <button className="btn btn-ghost dismiss-btn" onClick={onDismiss}>
              Close Window
            </button>
          )}
        </div>
      </div>

      <style>{`
        .overlay-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 24px;
        }
        .overlay-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 36px;
          width: 100%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: var(--shadow-lg);
        }
        .correct-answer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .answer-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .answer-value {
          font-size: 3.5rem;
          font-weight: 900;
          letter-spacing: 4px;
          background: linear-gradient(135deg, var(--green), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .explanation {
          text-align: center;
          font-size: 1rem;
          color: var(--text-secondary);
          background: var(--bg-raised);
          border-radius: var(--radius-md);
          padding: 14px 18px;
        }
        .results-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .result-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: var(--bg-raised);
          border: 1px solid transparent;
        }
        .result-row.correct { border-color: rgba(34,211,169,0.3); }
        .result-row.wrong   { border-color: rgba(247,95,79,0.2); }
        .result-pawn {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 900; color: #fff;
          border: 2px solid rgba(255,255,255,0.4);
          flex-shrink: 0;
        }
        .result-name { flex: 1; font-weight: 600; }
        .result-answer-val { font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; font-weight: 700; }
        .result-answer-val.green { color: var(--green); }
        .result-answer-val.red   { color: var(--red); }
        .result-verdict { font-size: 1rem; }
        .result-pos { font-size: 0.72rem; color: var(--text-muted); text-align: right; }

        .next-hint {
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
          animation: pulse 1.5s ease infinite;
        }
        .overlay-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
        }
        .dismiss-btn {
          font-size: 0.8rem;
          padding: 6px 16px;
        }
      `}</style>
    </div>
  )
}
