export default function DebugPanel({ debugOpen, dieA, dieB, canPlayerRoll, onToggle, onUpdateDie, onRollWithDice }) {
  return (
    <section className="debug" aria-label="Debug panel">
      <button type="button" onClick={onToggle} aria-label="Toggle debug panel" className="debug-toggle">
        {debugOpen ? 'Hide Dev Tools' : 'Show Dev Tools'}
      </button>

      {debugOpen && (
        <div className="debug-panel">
          <div className="debug-fields">
            <label>
              Die 1
              <input type="number" min="1" max="6" value={dieA} onChange={(e) => onUpdateDie('dieA', e.target.value)} />
            </label>
            <label>
              Die 2
              <input type="number" min="1" max="6" value={dieB} onChange={(e) => onUpdateDie('dieB', e.target.value)} />
            </label>
          </div>
          <button type="button" onClick={onRollWithDice} disabled={!canPlayerRoll}>Set Dice + Roll</button>
        </div>
      )}
    </section>
  );
}
