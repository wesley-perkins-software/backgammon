import SEO from './components/SEO.jsx';
import BoardSurface from './components/board/BoardSurface.jsx';
import ControlsPanel from './components/board/ControlsPanel.jsx';
import DebugPanel from './components/board/DebugPanel.jsx';
import useGameController from './hooks/useGameController.js';

export default function App({ showSeo = true, seoPath = '/play', seoTitle = 'Play Backgammon Online Locally', seoDescription = 'Play Backgammon Local against the computer with automatic local save and beginner-friendly controls.', showHeader = true, className = '' }) {
  const controller = useGameController();

  return (
    <section className={`app ${className}`.trim()} aria-label="Backgammon game">
      {showSeo && <SEO title={seoTitle} description={seoDescription} path={seoPath} />}
      {showHeader && (
        <header className="header">
          <h1>Backgammon Local</h1>
          <p className="subtitle">Play as Player against the computer, fully saved in your browser.</p>
        </header>
      )}

      <BoardSurface {...controller} />

      {controller.toastMessage && <section className="roll-toast" aria-live="polite">{controller.toastMessage}</section>}
      {controller.gamePhase !== 'OPENING_ROLL' && <section className="roll-toast" aria-live="polite">{controller.game.statusText}</section>}

      <ControlsPanel
        canPlayerRoll={controller.canPlayerRoll}
        isAnimatingMove={controller.isAnimatingMove}
        isAnyRollAnimationRunning={controller.isAnyRollAnimationRunning}
        undoCount={controller.game.undoStack.length}
        onRoll={controller.handleRoll}
        onNewGame={controller.handleNewGame}
        onUndo={controller.handleUndo}
        onResetPosition={controller.handleResetPosition}
        onClearSavedGame={controller.clearSavedGame}
      />

      <DebugPanel
        debugOpen={controller.game.dev.debugOpen}
        dieA={controller.game.dev.dieA}
        dieB={controller.game.dev.dieB}
        canPlayerRoll={controller.canPlayerRoll}
        onToggle={controller.toggleDebug}
        onUpdateDie={controller.updateDebugDie}
        onRollWithDice={() => controller.handleRoll([controller.game.dev.dieA, controller.game.dev.dieB])}
      />
    </section>
  );
}
