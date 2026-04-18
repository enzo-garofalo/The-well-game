interface Props {
  roundActive: boolean
  onDrawCard: () => void
  onEndGame: () => void
}

export default function TeacherControls({ roundActive, onDrawCard, onEndGame }: Props) {
  return (
    <div className="teacher-controls">
      <button
        id="btn-draw-card"
        className="btn btn-primary btn-lg"
        disabled={roundActive}
        onClick={onDrawCard}
      >
        🃏 Draw Card
      </button>
      <button
        id="btn-end-game"
        className="btn btn-danger"
        onClick={onEndGame}
      >
        🔴 End Game
      </button>

      <style>{`
        .teacher-controls {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  )
}
