export default function ControlsPanel({ canPlayerRoll, isAnimatingMove, isAnyRollAnimationRunning, undoCount, onRoll, onNewGame, onUndo, onResetPosition, onClearSavedGame }) {
  return (
    <section className="controls" aria-label="Game controls">
      <button type="button" onClick={() => onRoll()} aria-label="Roll Dice" disabled={!canPlayerRoll}>Roll Dice</button>
      <button type="button" onClick={onNewGame} aria-label="New Game" disabled={isAnimatingMove || isAnyRollAnimationRunning}>New Game</button>
      <button type="button" onClick={onUndo} aria-label="Undo" disabled={isAnimatingMove || isAnyRollAnimationRunning || undoCount === 0}>Undo</button>
      <button type="button" onClick={onResetPosition} aria-label="Reset to Starting Position" disabled={isAnimatingMove || isAnyRollAnimationRunning}>Reset to Starting Position</button>
      <button type="button" onClick={onClearSavedGame} aria-label="Clear Saved Game" disabled={isAnimatingMove || isAnyRollAnimationRunning}>Clear Saved Game</button>
    </section>
  );
}
