export default function ControlsPanel({ isAnimatingMove, isAnyRollAnimationRunning, undoCount, onNewGame, onUndo }) {
  return (
    <section className="controls" aria-label="Game controls">
      <button type="button" className="button-primary" onClick={onNewGame} aria-label="New Game" disabled={isAnimatingMove || isAnyRollAnimationRunning}>New Game</button>
      <button type="button" className="button-secondary" onClick={onUndo} aria-label="Undo" disabled={isAnimatingMove || isAnyRollAnimationRunning || undoCount === 0}>Undo</button>
    </section>
  );
}
