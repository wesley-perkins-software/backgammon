export default function ControlsPanel({ isAnimatingMove, isAnyRollAnimationRunning, undoCount, onNewGame, onUndo, onResetPosition, onClearSavedGame }) {
  return (
    <section className="controls" aria-label="Game controls">
      <button type="button" onClick={onNewGame} aria-label="New Game" disabled={isAnimatingMove || isAnyRollAnimationRunning}>New Game</button>
      <button type="button" onClick={onUndo} aria-label="Undo" disabled={isAnimatingMove || isAnyRollAnimationRunning || undoCount === 0}>Undo</button>
      <button type="button" onClick={onResetPosition} aria-label="Reset to Starting Position" disabled={isAnimatingMove || isAnyRollAnimationRunning}>Reset to Starting Position</button>
      <button type="button" onClick={onClearSavedGame} aria-label="Clear Saved Game" disabled={isAnimatingMove || isAnyRollAnimationRunning}>Clear Saved Game</button>
    </section>
  );
}
