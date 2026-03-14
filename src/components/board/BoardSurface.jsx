import { PLAYER_A, PLAYER_B } from '../../game.js';
import ControlsPanel from './ControlsPanel.jsx';

const TOP_LEFT = [12, 13, 14, 15, 16, 17];
const TOP_RIGHT = [18, 19, 20, 21, 22, 23];
const BOTTOM_LEFT = [11, 10, 9, 8, 7, 6];
const BOTTOM_RIGHT = [5, 4, 3, 2, 1, 0];

function pointOwner(value) {
  if (value > 0) return 'A';
  if (value < 0) return 'B';
  return null;
}

function checkerCount(value) {
  return Math.abs(value);
}

function getRolledDiceWithUsage(game, { expandDoubles = true } = {}) {
  if (game.dice.values.length !== 2) return [];
  const remainingCounts = {};
  for (const die of game.dice.remaining) {
    remainingCounts[die] = (remainingCounts[die] ?? 0) + 1;
  }

  const displayDiceValues =
    expandDoubles && game.dice.values[0] === game.dice.values[1]
      ? [game.dice.values[0], game.dice.values[0], game.dice.values[0], game.dice.values[0]]
      : game.dice.values;

  const diceWithUsage = Array.from({ length: displayDiceValues.length });
  for (let i = displayDiceValues.length - 1; i >= 0; i -= 1) {
    const die = displayDiceValues[i];
    const available = remainingCounts[die] ?? 0;
    if (available > 0) {
      remainingCounts[die] = available - 1;
      diceWithUsage[i] = { value: die, used: false };
      continue;
    }
    diceWithUsage[i] = { value: die, used: true };
  }

  return diceWithUsage;
}

function DieFace({ value, className = '', ariaHidden = false, used = false }) {
  const safeValue = Math.min(6, Math.max(1, Number(value) || 1));
  const pipsByValue = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  return (
    <div
      className={`die ${used ? 'die-used' : ''} ${className}`.trim()}
      role={ariaHidden ? undefined : 'img'}
      aria-label={ariaHidden ? undefined : `Die showing ${safeValue}${used ? ', used' : ''}`}
      aria-hidden={ariaHidden || undefined}
    >
      <div className="die-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => (
          <span key={cell} className={`pip ${pipsByValue[safeValue].includes(cell) ? 'on' : ''}`} />
        ))}
      </div>
    </div>
  );
}

function BoardDice({ game, diceAnimKey, isBoardDiceRolling, rollingDiceValues, rollingAnimatedMask, disableUsedStyling, side = 'right' }) {
  const isPendingRollAnimation = Array.isArray(rollingDiceValues) && rollingDiceValues.length > 0;
  const shouldIgnoreUsedStyling = disableUsedStyling || isPendingRollAnimation || isBoardDiceRolling;
  const rolledDiceWithUsage = (isPendingRollAnimation
    ? rollingDiceValues.map((value) => ({ value, used: false }))
    : getRolledDiceWithUsage(game, {
      expandDoubles: !isBoardDiceRolling
    }).map((die) => (shouldIgnoreUsedStyling ? { ...die, used: false } : die)));

  if (rolledDiceWithUsage.length === 0) return null;
  if (!isBoardDiceRolling) {
    return <div className={`board-dice-overlay board-dice-overlay-${side}`} aria-hidden="true">{rolledDiceWithUsage.map((die, idx) => <DieFace key={`board-static-die-${idx}-${die.value}`} value={die.value} used={die.used} ariaHidden />)}</div>;
  }

  const pipsByValue = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  const orientationByValue = { 1: { x: '0deg', y: '0deg' }, 2: { x: '90deg', y: '0deg' }, 3: { x: '0deg', y: '-90deg' }, 4: { x: '0deg', y: '90deg' }, 5: { x: '-90deg', y: '0deg' }, 6: { x: '0deg', y: '180deg' } };
  const renderFace = (value, faceClass) => {
    const safeValue = Math.min(6, Math.max(1, Number(value) || 1));
    return <span className={`board-die-face ${faceClass}`}><span className="board-face-grid">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => <span key={cell} className={`board-face-pip ${pipsByValue[safeValue].includes(cell) ? 'on' : ''}`} />)}</span></span>;
  };

  return (
    <div className={`board-dice-overlay board-dice-overlay-${side}`} aria-hidden="true">
      {rolledDiceWithUsage.map((die, idx) => {
        const shouldAnimateThisDie = !Array.isArray(rollingAnimatedMask) || rollingAnimatedMask[idx] !== false;
        if (!shouldAnimateThisDie) return <DieFace key={`board-static-opening-die-${idx}-${die.value}`} value={die.value} used={die.used} ariaHidden />;
        const finalValue = Math.min(6, Math.max(1, Number(die.value) || 1));
        const finalOrientation = orientationByValue[finalValue];
        return <div key={`board-die-wrap-${idx}`} className={`board-die-perspective ${die.used ? 'board-die-used' : ''}`.trim()}><div key={`board-die-${idx}-${finalValue}-${diceAnimKey + 2000 + idx}`} className="board-die-cube" style={{ '--end-rot-x': finalOrientation.x, '--end-rot-y': finalOrientation.y }}>{renderFace(1, 'board-die-front')}{renderFace(6, 'board-die-back')}{renderFace(3, 'board-die-right')}{renderFace(4, 'board-die-left')}{renderFace(5, 'board-die-top')}{renderFace(2, 'board-die-bottom')}</div></div>;
      })}
    </div>
  );
}

function Point({ index, value, selected, highlighted, pathChoiceIntermediate, movable, onClick, isTop, pointRef, hiddenCheckerOwner = null }) {
  const owner = pointOwner(value);
  const hiddenCount = hiddenCheckerOwner != null && owner === hiddenCheckerOwner ? 1 : 0;
  const count = Math.max(0, checkerCount(value) - hiddenCount);
  const stackDivisor = Math.max(4, count - 1);
  return <button ref={pointRef} className={`point ${isTop ? 'point-top' : 'point-bottom'} ${selected ? 'selected is-selected' : ''} ${highlighted ? 'legal is-legal' : ''} ${pathChoiceIntermediate ? 'path-choice-option' : ''} ${movable ? 'movable-source' : ''}`} onClick={onClick} aria-label={`Point ${index + 1}`} type="button"><div className={`checker-stack ${isTop ? 'stack-top' : 'stack-bottom'}`}>{Array.from({ length: count }).map((_, i) => <span key={i} className={`checker stack-checker checker-${owner === 'B' ? 'b' : 'a'} ${movable && i === count - 1 ? 'checker-movable' : ''}`} style={{ '--stack-index': i, '--stack-offset': i / stackDivisor, zIndex: count - i }} />)}</div></button>;
}

function Bar({ game, pendingBarHits, activeSelectedSource, showMovableSources, movableSourceSet, destinationSet, onSelectBar, barRef }) {
  const visibleTopBarCount = game.bar.B + (pendingBarHits?.B ?? 0);
  const visibleBottomBarCount = game.bar.A + (pendingBarHits?.A ?? 0);

  return <div className="bar-lane-wrap"><button ref={barRef} className={`bar-column ${destinationSet.has('bar') ? 'legal is-legal' : ''} ${showMovableSources && movableSourceSet.has('bar') ? 'movable-source' : ''}`} onClick={() => {}} type="button" aria-label="Bar"><div className="bar-seam" aria-hidden="true" /></button><div className="bar-checker-overlay" aria-hidden="true"><div className="barStackTop" aria-hidden="true">{Array.from({ length: visibleTopBarCount }).map((_, i) => <span key={`b-${i}`} className="checker checker-b bar-checker" style={{ zIndex: visibleTopBarCount - i }} />)}</div><div className={`barStackBottom ${activeSelectedSource === 'bar' ? 'barForcedSelected' : ''}`} aria-hidden="true">{Array.from({ length: visibleBottomBarCount }).map((_, i) => i === 0 ? <button key={`a-${i}`} type="button" className={`checker checker-a bar-checker ${activeSelectedSource === 'bar' ? 'barCheckerSelected' : ''} ${showMovableSources && movableSourceSet.has('bar') ? 'checker-movable' : ''} barCheckerInteractive bar-checker-button`} style={{ zIndex: visibleBottomBarCount - i }} onClick={onSelectBar} aria-label="Select checker on bar" /> : <span key={`a-${i}`} className={`checker checker-a bar-checker ${activeSelectedSource === 'bar' ? 'barCheckerSelected' : ''}`} style={{ zIndex: visibleBottomBarCount - i }} />)}</div></div></div>;
}

function BearOffTray({ label, title, checkerIcon, count, highlighted, pathChoiceIntermediate, onClick, trayRef, className = '' }) {
  return <button ref={trayRef} type="button" className={`bearoff-tray ${highlighted ? 'legal is-legal' : ''} ${pathChoiceIntermediate ? 'path-choice-option' : ''} ${className}`.trim()} onClick={onClick} aria-label={`${label} bear off`}>
    <span className="tray-label">{title}</span>
    <span className="tray-body" aria-hidden="true"><span className="tray-checker-icon">{checkerIcon}</span><span className="tray-count">{count}</span></span>
  </button>;
}

function BoardRollControl({ canPlayerRoll, onRoll }) {
  return <div className="board-roll-overlay"><button type="button" className="board-roll-button" onClick={() => onRoll()} aria-label="Roll Dice" disabled={!canPlayerRoll}>Roll Dice</button></div>;
}

export default function BoardSurface(props) {
  const {
    boardStageRef, pointRefs, bearOffRefs, barRef, game, gamePhase, openingMessage, playerPipCount, computerPipCount,
    isComputerTurn, activeSelectedSource, destinationSet, pendingIntermediateSet, movableSourceSet, showMovableSources,
    moveToDestination, handleSelectSource, isAnimatingMove, diceAnimKey, isAnyRollAnimationRunning,
    pendingRoll, disableUsedDiceStyling, movingChecker, moveStepMs,
    pendingPathChoices, chooseIntermediatePath, cancelPendingPathChoice,
    canPlayerRoll, handleRoll, handleNewGame, handleUndo,
    toastMessage, statusMessage, isEndGameOverlayOpen, closeEndGameOverlay,
    hiddenHitCheckers, pendingBarHits
  } = props;

  const hiddenCheckerByPoint = new Map(hiddenHitCheckers.map((entry) => [entry.point, entry.player]));

  const winnerCopy = game.winner === PLAYER_A
    ? {
      title: 'You win!',
      subtitle: 'You bore off all 15 checkers first.'
    }
    : {
      title: 'Computer wins',
      subtitle: 'The computer bore off all 15 checkers first.'
    };

  const renderPoint = (point, isTop) => <Point key={point} index={point} value={game.points[point]} isTop={isTop} pointRef={(node) => {
    if (node) pointRefs.current.set(point, node);
    else pointRefs.current.delete(point);
  }} selected={activeSelectedSource === point} highlighted={destinationSet.has(String(point))} pathChoiceIntermediate={pendingIntermediateSet.has(String(point))} movable={showMovableSources && movableSourceSet.has(String(point))} hiddenCheckerOwner={hiddenCheckerByPoint.get(point) ?? null} onClick={() => {
    if (isEndGameOverlayOpen || isAnimatingMove || isComputerTurn) return;
    if (pendingPathChoices) {
      if (destinationSet.has(String(point))) chooseIntermediatePath(point);
      else cancelPendingPathChoice();
      return;
    }
    if (activeSelectedSource != null && destinationSet.has(String(point))) moveToDestination(point);
    else handleSelectSource(point);
  }} />;

  return (
    <section ref={boardStageRef} className={`board-stage ${pendingPathChoices ? 'pending-path-choice' : ''}`.trim()} aria-label="Backgammon board" onClick={(event) => {
      if (isEndGameOverlayOpen || !pendingPathChoices) return;
      if (event.target.closest('.point.legal, .bearoff-tray.legal')) return;
      cancelPendingPathChoice();
    }}>
      <div className={`game-layout ${isEndGameOverlayOpen ? 'game-layout-overlay-open' : ''}`.trim()}>
        <div className="pip-row-wrap">
          <div className="pip-row" aria-label="Pip counts">
            <div className={`pip-box pip-box-computer ${!game.winner && isComputerTurn ? 'pip-box-active' : ''}`.trim()}>
              <span className="pip-box-label">Computer</span>
              <span className="pip-box-value">PIP: {computerPipCount}</span>
            </div>
            <div className={`pip-box pip-box-player ${!game.winner && !isComputerTurn ? 'pip-box-active' : ''}`.trim()}>
              <span className="pip-box-label">Player</span>
              <span className="pip-box-value">PIP: {playerPipCount}</span>
            </div>
          </div>
        </div>

        <div className="board-row">
          <div className="board-wrapper">
            <div className="board-surface">
              <div className="point-band top-band top-left-band">{TOP_LEFT.map((point) => renderPoint(point, true))}</div>
              <div className="point-band top-band top-right-band">{TOP_RIGHT.map((point) => renderPoint(point, true))}</div>
              <Bar game={game} pendingBarHits={pendingBarHits} activeSelectedSource={activeSelectedSource} showMovableSources={showMovableSources} movableSourceSet={movableSourceSet} destinationSet={destinationSet} onSelectBar={() => {
                if (pendingPathChoices) return cancelPendingPathChoice();
                if (!isEndGameOverlayOpen && !isAnimatingMove && !isComputerTurn) handleSelectSource('bar');
              }} barRef={barRef} />
              <div className="point-band bottom-band bottom-left-band">{BOTTOM_LEFT.map((point) => renderPoint(point, false))}</div>
              <div className="point-band bottom-band bottom-right-band">{BOTTOM_RIGHT.map((point) => renderPoint(point, false))}</div>
              <BoardRollControl canPlayerRoll={canPlayerRoll} onRoll={handleRoll} />
              <BoardDice game={game} side="right" diceAnimKey={diceAnimKey} isBoardDiceRolling={isAnyRollAnimationRunning} rollingDiceValues={pendingRoll?.values ?? null} rollingAnimatedMask={pendingRoll?.animatedMask ?? null} disableUsedStyling={isAnyRollAnimationRunning || disableUsedDiceStyling} />
            </div>
          </div>

          <aside className="home-rail" aria-label="Bear off area">
            <BearOffTray label="Computer" title="COMPUTER OFF" checkerIcon="⚫" className="home-top" trayRef={(node) => { bearOffRefs.current.B = node; }} count={game.bearOff.B} highlighted={destinationSet.has('off') && game.currentPlayer === PLAYER_B} pathChoiceIntermediate={pendingIntermediateSet.has('off')} onClick={() => {
              if (pendingPathChoices) return cancelPendingPathChoice();
              if (!isEndGameOverlayOpen && !isAnimatingMove && !isComputerTurn) moveToDestination('off');
            }} />
            <BearOffTray label="Player" title="PLAYER OFF" checkerIcon="⚪" className="home-bottom" trayRef={(node) => { bearOffRefs.current.A = node; }} count={game.bearOff.A} highlighted={destinationSet.has('off') && game.currentPlayer === PLAYER_A} pathChoiceIntermediate={pendingIntermediateSet.has('off')} onClick={() => {
              if (pendingPathChoices) return cancelPendingPathChoice();
              if (!isEndGameOverlayOpen && !isAnimatingMove && !isComputerTurn) moveToDestination('off');
            }} />
          </aside>
        </div>

        <div className={`board-ui-row ${isEndGameOverlayOpen ? 'board-centered-status-controls-hidden' : ''}`.trim()}>
          <div className="board-centered-status-controls">
            {toastMessage && <section className="roll-toast" aria-live="polite">{toastMessage}</section>}
            <div className="status-region">
              <section className="roll-toast status-message" aria-live="polite">{statusMessage}</section>
            </div>
            <ControlsPanel
              isAnimatingMove={isAnimatingMove}
              isAnyRollAnimationRunning={isAnyRollAnimationRunning}
              undoCount={game.undoStack.length}
              onNewGame={handleNewGame}
              onUndo={handleUndo}
            />
          </div>
        </div>
      </div>
      {isEndGameOverlayOpen && game.winner && (
        <div className="endgame-overlay" role="dialog" aria-modal="true" aria-label="Game over">
          <div className="endgame-overlay-card">
            <h2>{winnerCopy.title}</h2>
            <p>{winnerCopy.subtitle}</p>
            <div className="endgame-overlay-actions">
              <button type="button" className="button-primary" onClick={handleNewGame}>Play Again</button>
              <button type="button" className="button-secondary" onClick={closeEndGameOverlay}>Review Board</button>
            </div>
          </div>
        </div>
      )}
      {movingChecker && <span aria-hidden="true" className={`checker moving-checker checker-${movingChecker.player === 'B' ? 'b' : 'a'}`} style={{ left: `${movingChecker.x}px`, top: `${movingChecker.y}px`, '--move-step-ms': `${moveStepMs}ms` }} />}
    </section>
  );
}
