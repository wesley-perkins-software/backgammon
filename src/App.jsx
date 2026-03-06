import SEO from './components/SEO.jsx';
import BoardSurface from './components/board/BoardSurface.jsx';
import ControlsPanel from './components/board/ControlsPanel.jsx';
import DebugPanel from './components/board/DebugPanel.jsx';
import useGameController from './hooks/useGameController.js';
import * as defaultClock from './platform/clock.js';
import * as defaultMedia from './platform/media.js';
import * as defaultRandom from './platform/random.js';
import * as defaultStorage from './platform/storage.js';

export default function App({ showSeo = true, seoPath = '/play', seoTitle = 'Play Backgammon Online Locally', seoDescription = 'Play Backgammon Local against the computer with automatic local save and beginner-friendly controls.', showHeader = true, className = '', adapters = {} }) {
  const {
    clock = defaultClock,
    media = defaultMedia,
    random = defaultRandom,
    storage = defaultStorage
  } = adapters;
  const controller = useGameController({ clock, media, random, storage });

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
        isAnimatingMove={controller.isAnimatingMove}
        isAnyRollAnimationRunning={controller.isAnyRollAnimationRunning}
        undoCount={controller.game.undoStack.length}
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
