import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PLAYER_A,
  PLAYER_B,
  STORAGE_KEY,
  applyMove,
  chooseComputerMove,
  chooseMoveForDestination,
  computeLegalMoves,
  createInitialState,
  playerLabel,
  pushUndoState,
  restoreState,
  rollDice,
  serializeState,
  undo
} from './game.js';

const TOP_LEFT = [12, 13, 14, 15, 16, 17];
const TOP_RIGHT = [18, 19, 20, 21, 22, 23];
const BOTTOM_LEFT = [11, 10, 9, 8, 7, 6];
const BOTTOM_RIGHT = [5, 4, 3, 2, 1, 0];
const MOVE_STEP_MS = 210;
const MOVE_START_DELAY_MS = 40;
const BOARD_DICE_ROLL_MS = 1000;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function moveMatches(a, b) {
  return a && b && a.from === b.from && a.to === b.to && a.dieUsed === b.dieUsed;
}

function pointOwner(value) {
  if (value > 0) return 'A';
  if (value < 0) return 'B';
  return null;
}

function checkerCount(value) {
  return Math.abs(value);
}

function destinationKey(to) {
  return to === 'off' ? 'off' : String(to);
}

function sourceKey(from) {
  return from === 'bar' ? 'bar' : String(from);
}

function loadInitial() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialState();
  }
  return restoreState(raw) ?? createInitialState();
}

function describeRequiredAction(state, legalMoves) {
  const computerTurn = state.currentPlayer === PLAYER_B;
  const turnName = computerTurn ? 'Computer' : playerLabel(state.currentPlayer);

  if (state.winner) {
    return `${playerLabel(state.winner)} wins.`;
  }
  if (state.dice.remaining.length === 0) {
    return computerTurn ? 'Computer is rolling...' : `${turnName}: roll dice.`;
  }
  if (state.bar[state.currentPlayer] > 0) {
    return `${turnName} must enter from the bar.`;
  }
  if (legalMoves.length === 0) {
    return `${turnName} has no legal moves.`;
  }
  if (computerTurn) {
    return 'Computer is choosing a move...';
  }
  return state.statusText;
}

function DieFace({ value, className = '', ariaHidden = false, used = false }) {
  const safeValue = Math.min(6, Math.max(1, Number(value) || 1));
  const pipsByValue = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9]
  };

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

function DicePanel({ game, isBoardDiceRolling }) {
  if (isBoardDiceRolling || game.dice.values.length !== 2) {
    return <div className="dice-panel" aria-label="Dice" />;
  }

  const remainingCounts = {};
  for (const die of game.dice.remaining) {
    remainingCounts[die] = (remainingCounts[die] ?? 0) + 1;
  }

  const displayDiceValues =
    game.dice.values.length === 2 && game.dice.values[0] === game.dice.values[1]
      ? [game.dice.values[0], game.dice.values[0], game.dice.values[0], game.dice.values[0]]
      : game.dice.values;

  const rolledDiceWithUsage = displayDiceValues.map((die) => {
    const available = remainingCounts[die] ?? 0;
    if (available > 0) {
      remainingCounts[die] = available - 1;
      return { value: die, used: false };
    }
    return { value: die, used: true };
  });

  return (
    <div className="dice-panel" aria-label="Dice">
      {rolledDiceWithUsage.map((die, i) => (
        <DieFace key={`status-die-${i}`} value={die.value} used={die.used} />
      ))}
    </div>
  );
}

function BoardDice({ game, diceAnimKey }) {
  if (game.dice.values.length !== 2) {
    return null;
  }

  const pipsByValue = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9]
  };

  const orientationByValue = {
    1: { x: '0deg', y: '0deg' },
    2: { x: '90deg', y: '0deg' },
    3: { x: '0deg', y: '-90deg' },
    4: { x: '0deg', y: '90deg' },
    5: { x: '-90deg', y: '0deg' },
    6: { x: '0deg', y: '180deg' }
  };

  function renderFace(value, faceClass) {
    const safeValue = Math.min(6, Math.max(1, Number(value) || 1));
    return (
      <span className={`board-die-face ${faceClass}`}>
        <span className="board-face-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => (
            <span key={cell} className={`board-face-pip ${pipsByValue[safeValue].includes(cell) ? 'on' : ''}`} />
          ))}
        </span>
      </span>
    );
  }

  return (
    <div className="board-dice-overlay" aria-hidden="true">
      {[game.dice.values[0], game.dice.values[1]].map((dieValue, idx) => {
        const finalValue = Math.min(6, Math.max(1, Number(dieValue) || 1));
        const finalOrientation = orientationByValue[finalValue];
        return (
          <div key={`board-die-wrap-${idx}`} className="board-die-perspective">
            <div
              key={`board-die-${idx}-${finalValue}-${diceAnimKey + 2000 + idx}`}
              className="board-die-cube"
              style={{
                '--end-rot-x': finalOrientation.x,
                '--end-rot-y': finalOrientation.y
              }}
            >
              {renderFace(1, 'board-die-front')}
              {renderFace(6, 'board-die-back')}
              {renderFace(3, 'board-die-right')}
              {renderFace(4, 'board-die-left')}
              {renderFace(5, 'board-die-top')}
              {renderFace(2, 'board-die-bottom')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Point({ index, value, selected, highlighted, onClick, isTop, pointRef }) {
  const owner = pointOwner(value);
  const count = checkerCount(value);
  const stackDivisor = Math.max(4, count - 1);

  return (
    <button
      ref={pointRef}
      className={`point ${isTop ? 'point-top' : 'point-bottom'} ${selected ? 'selected' : ''} ${highlighted ? 'highlighted' : ''}`}
      onClick={onClick}
      aria-label={`Point ${index + 1}`}
      type="button"
    >
      <div className={`checker-stack ${isTop ? 'stack-top' : 'stack-bottom'}`}>
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className={`checker stack-checker checker-${owner === 'B' ? 'b' : 'a'}`}
            style={{
              '--stack-index': i,
              '--stack-offset': i / stackDivisor,
              zIndex: count - i
            }}
          />
        ))}
      </div>
    </button>
  );
}

function Bar({ state, selected, highlighted, onClick, barRef }) {
  const aCount = state.bar.A;
  const bCount = state.bar.B;
  const visibleA = Math.min(aCount, 5);
  const visibleB = Math.min(bCount, 5);

  return (
    <button
      ref={barRef}
      className={`bar-column ${selected ? 'selected' : ''} ${highlighted ? 'highlighted' : ''}`}
      onClick={onClick}
      type="button"
      aria-label="Bar"
    >
      <span className="bar-title">BAR</span>
      <div className="bar-lanes" aria-hidden="true">
        <div className="bar-lane bar-lane-a">
          {Array.from({ length: visibleA }).map((_, i) => (
            <span key={`a-${i}`} className="checker checker-a bar-checker" />
          ))}
          {aCount > 5 && <span className="bar-stack-count">{aCount}</span>}
        </div>
        <div className="bar-lane bar-lane-b">
          {Array.from({ length: visibleB }).map((_, i) => (
            <span key={`b-${i}`} className="checker checker-b bar-checker" />
          ))}
          {bCount > 5 && <span className="bar-stack-count">{bCount}</span>}
        </div>
      </div>
      <div className="bar-counts">
        <span>A {aCount}</span>
        <span>B {bCount}</span>
      </div>
    </button>
  );
}

function BearOffTray({ label, count, highlighted, onClick, trayRef, className = '' }) {
  return (
    <button
      ref={trayRef}
      type="button"
      className={`bearoff-tray ${highlighted ? 'highlighted' : ''} ${className}`.trim()}
      onClick={onClick}
      aria-label={`${label} bear off`}
    >
      <span className="tray-label">{label} Off</span>
      <span className="tray-count">{count}</span>
    </button>
  );
}

export default function App() {
  const [game, setGame] = useState(loadInitial);
  const [selectedSource, setSelectedSource] = useState(null);
  const [diceAnimKey, setDiceAnimKey] = useState(0);
  const [isBoardDiceRolling, setIsBoardDiceRolling] = useState(false);
  const [isAnimatingMove, setIsAnimatingMove] = useState(false);
  const [movingChecker, setMovingChecker] = useState(null);
  const boardStageRef = useRef(null);
  const pointRefs = useRef(new Map());
  const barRef = useRef(null);
  const bearOffRefs = useRef({ A: null, B: null });
  const boardDiceRollTimerRef = useRef(null);
  const isComputerTurn = game.currentPlayer === PLAYER_B;

  const legalMoves = useMemo(() => computeLegalMoves(game), [game]);

  const movesBySource = useMemo(() => {
    const map = new Map();
    for (const move of legalMoves) {
      const key = sourceKey(move.from);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(move);
    }
    return map;
  }, [legalMoves]);

  const moveOptionsForSelected = useMemo(() => {
    if (selectedSource == null) {
      return [];
    }
    const sourceMoves = movesBySource.get(sourceKey(selectedSource)) ?? [];
    if (!sourceMoves.length) {
      return [];
    }

    const options = [];
    const seen = new Set();

    for (const first of sourceMoves) {
      const singleKey = `${destinationKey(first.to)}|${sourceKey(first.from)}>${destinationKey(first.to)}:${first.dieUsed}`;
      if (!seen.has(singleKey)) {
        options.push({ to: first.to, moves: [first] });
        seen.add(singleKey);
      }

      const afterFirst = applyMove(game, first);
      if (afterFirst.currentPlayer !== game.currentPlayer || afterFirst.winner) {
        continue;
      }

      const secondMoves = computeLegalMoves(afterFirst).filter((nextMove) => sourceKey(nextMove.from) === sourceKey(first.to));
      for (const second of secondMoves) {
        const chainKey = `${destinationKey(second.to)}|${sourceKey(first.from)}>${destinationKey(first.to)}:${first.dieUsed},${sourceKey(second.from)}>${destinationKey(second.to)}:${second.dieUsed}`;
        if (seen.has(chainKey)) {
          continue;
        }
        options.push({ to: second.to, moves: [first, second] });
        seen.add(chainKey);
      }
    }

    return options;
  }, [game, movesBySource, selectedSource]);

  const destinationSet = useMemo(() => {
    const set = new Set();
    for (const option of moveOptionsForSelected) {
      set.add(destinationKey(option.to));
    }
    return set;
  }, [moveOptionsForSelected]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, serializeState(game));
  }, [game]);

  useEffect(() => {
    if (selectedSource == null) {
      return;
    }
    const stillLegal = movesBySource.has(sourceKey(selectedSource));
    if (!stillLegal) {
      setSelectedSource(null);
    }
  }, [movesBySource, selectedSource]);

  const diceSignature = game.dice.values.join('-');
  useEffect(() => {
    if (boardDiceRollTimerRef.current) {
      window.clearTimeout(boardDiceRollTimerRef.current);
      boardDiceRollTimerRef.current = null;
    }

    if (game.dice.values.length === 2) {
      setIsBoardDiceRolling(true);
      setDiceAnimKey((k) => k + 2);
      boardDiceRollTimerRef.current = window.setTimeout(() => {
        setIsBoardDiceRolling(false);
        boardDiceRollTimerRef.current = null;
      }, BOARD_DICE_ROLL_MS);
      return undefined;
    }

    setIsBoardDiceRolling(false);
    return undefined;
  }, [diceSignature]);

  useEffect(() => {
    return () => {
      if (boardDiceRollTimerRef.current) {
        window.clearTimeout(boardDiceRollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (game.winner || !isComputerTurn) {
      return undefined;
    }
    if (isAnimatingMove) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (game.dice.remaining.length === 0) {
        setGame((prev) => {
          if (prev.winner || prev.currentPlayer !== PLAYER_B || prev.dice.remaining.length > 0) {
            return prev;
          }
          return pushUndoState(prev, rollDice(prev));
        });
        return;
      }

      const aiLegalMoves = computeLegalMoves(game);
      if (!aiLegalMoves.length) {
        return;
      }

      const aiMove = chooseComputerMove(game, aiLegalMoves);
      if (!aiMove) {
        return;
      }
      void performMoveSequence(game, [aiMove]);
    }, 420);

    return () => window.clearTimeout(timer);
  }, [game, isComputerTurn, isAnimatingMove]);

  function commit(next) {
    setGame(next);
  }

  function withUndo(nextState) {
    return pushUndoState(game, nextState);
  }

  function handleRoll(forced = null) {
    if (isAnimatingMove || (isComputerTurn && !forced)) {
      return;
    }
    const rolled = rollDice(game, forced);
    if (rolled === game) {
      return;
    }
    commit(withUndo(rolled));
    setSelectedSource(null);
  }

  function handleSelectSource(source) {
    if (isAnimatingMove || isComputerTurn || game.winner || game.dice.remaining.length === 0) {
      return;
    }

    const key = sourceKey(source);
    if (!movesBySource.has(key)) {
      return;
    }

    if (selectedSource === source) {
      setSelectedSource(null);
      return;
    }

    setSelectedSource(source);
  }

  function centerFromElement(element) {
    const stage = boardStageRef.current;
    if (!stage || !element) {
      return null;
    }
    const stageRect = stage.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left - stageRect.left + rect.width / 2,
      y: rect.top - stageRect.top + rect.height / 2
    };
  }

  function elementForLocation(location, playerForOff) {
    if (location === 'bar') {
      return barRef.current;
    }
    if (location === 'off') {
      return bearOffRefs.current[playerForOff] ?? null;
    }
    return pointRefs.current.get(location) ?? null;
  }

  function pathForMove(stateAtMove, move) {
    const path = [move.from];
    const player = stateAtMove.currentPlayer;

    if (typeof move.from === 'number' && typeof move.to === 'number') {
      const dir = move.to > move.from ? 1 : -1;
      for (let p = move.from + dir; p !== move.to + dir; p += dir) {
        path.push(p);
      }
      return path;
    }

    if (typeof move.from === 'number' && move.to === 'off') {
      const dir = player === PLAYER_A ? -1 : 1;
      for (let step = 1; step <= move.dieUsed; step += 1) {
        const point = move.from + dir * step;
        if (point < 0 || point > 23) {
          path.push('off');
          return path;
        }
        path.push(point);
      }
      path.push('off');
      return path;
    }

    path.push(move.to);
    return path;
  }

  async function animateSingleMove(stateAtMove, move) {
    const player = stateAtMove.currentPlayer;
    const path = pathForMove(stateAtMove, move);
    const centers = path
      .map((location) => {
        const element = elementForLocation(location, player);
        return centerFromElement(element);
      })
      .filter(Boolean);

    if (centers.length < 2) {
      return;
    }

    setMovingChecker({ player, x: centers[0].x, y: centers[0].y });
    await wait(MOVE_START_DELAY_MS);
    for (let i = 1; i < centers.length; i += 1) {
      setMovingChecker((prev) => (prev ? { ...prev, x: centers[i].x, y: centers[i].y } : prev));
      await wait(MOVE_STEP_MS);
    }
    await wait(30);
  }

  function applyMoveSequence(stateAtMove, moves) {
    let next = stateAtMove;
    for (const move of moves) {
      next = applyMove(next, move);
      if (next.currentPlayer !== stateAtMove.currentPlayer || next.winner) {
        break;
      }
    }
    return next;
  }

  function chooseMoveOptionForDestination(stateAtMove, candidates) {
    if (candidates.length <= 1) {
      return candidates[0] ?? null;
    }

    const maxSteps = Math.max(...candidates.map((c) => c.moves.length));
    const longest = candidates.filter((c) => c.moves.length === maxSteps);
    if (longest.length === 1) {
      return longest[0];
    }

    if (maxSteps === 1) {
      const bestSingle = chooseMoveForDestination(stateAtMove, longest.map((c) => c.moves[0]));
      return longest.find((c) => moveMatches(c.moves[0], bestSingle)) ?? longest[0];
    }

    return longest[0];
  }

  async function performMoveSequence(stateAtMove, moves) {
    if (isAnimatingMove) {
      return;
    }
    setSelectedSource(null);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsAnimatingMove(true);
    try {
      if (!prefersReducedMotion) {
        let animationState = stateAtMove;
        for (const move of moves) {
          await animateSingleMove(animationState, move);
          animationState = applyMove(animationState, move);
          if (animationState.currentPlayer !== stateAtMove.currentPlayer || animationState.winner) {
            break;
          }
        }
      }
    } finally {
      setMovingChecker(null);
      setIsAnimatingMove(false);
    }
    setGame((prev) => {
      if (prev !== stateAtMove) {
        return prev;
      }
      return pushUndoState(prev, applyMoveSequence(prev, moves));
    });
  }

  function moveToDestination(destination) {
    if (isAnimatingMove || isComputerTurn || selectedSource == null) {
      return;
    }

    const candidates = moveOptionsForSelected.filter((option) => destinationKey(option.to) === destinationKey(destination));
    if (!candidates.length) {
      return;
    }

    const chosenOption = chooseMoveOptionForDestination(game, candidates);
    if (!chosenOption) {
      return;
    }

    void performMoveSequence(game, chosenOption.moves);
  }

  function handleNewGame() {
    if (isAnimatingMove) {
      return;
    }
    const reset = createInitialState();
    commit(withUndo(reset));
    setSelectedSource(null);
  }

  function handleResetPosition() {
    if (isAnimatingMove) {
      return;
    }
    const reset = {
      ...createInitialState(),
      undoStack: game.undoStack,
      dev: game.dev
    };
    commit(withUndo(reset));
    setSelectedSource(null);
  }

  function handleUndo() {
    if (isAnimatingMove) {
      return;
    }
    const previous = undo(game);
    commit(previous);
    setSelectedSource(null);
  }

  function clearSavedGame() {
    if (isAnimatingMove) {
      return;
    }
    window.localStorage.removeItem(STORAGE_KEY);
    commit(createInitialState());
    setSelectedSource(null);
  }

  function updateDebugDie(key, value) {
    const n = Math.max(1, Math.min(6, Number(value) || 1));
    setGame((prev) => ({
      ...prev,
      dev: { ...prev.dev, [key]: n }
    }));
  }

  function toggleDebug() {
    setGame((prev) => ({
      ...prev,
      dev: { ...prev.dev, debugOpen: !prev.dev.debugOpen }
    }));
  }

  const statusText = isAnimatingMove ? `${playerLabel(game.currentPlayer)} moving...` : describeRequiredAction(game, legalMoves);

  function renderPoint(point, isTop) {
    return (
      <Point
        key={point}
        index={point}
        value={game.points[point]}
        isTop={isTop}
        pointRef={(node) => {
          if (node) {
            pointRefs.current.set(point, node);
          } else {
            pointRefs.current.delete(point);
          }
        }}
        selected={selectedSource === point}
        highlighted={destinationSet.has(String(point))}
        onClick={() => {
          if (isAnimatingMove || isComputerTurn) {
            return;
          }
          if (selectedSource != null && destinationSet.has(String(point))) {
            moveToDestination(point);
          } else {
            handleSelectSource(point);
          }
        }}
      />
    );
  }

  return (
    <main className="app">
      <header className="header">
        <h1>Backgammon Local</h1>
        <p className="subtitle">Play as Player against the computer, fully saved in your browser.</p>
      </header>

      <section className="status" aria-live="polite">
        <div><strong>Turn:</strong> {isComputerTurn ? 'Computer' : 'Player'}</div>
        <div><strong>Action:</strong> {statusText}</div>
        <DicePanel game={game} isBoardDiceRolling={isBoardDiceRolling} />
      </section>

      <section className="controls" aria-label="Game controls">
        <button type="button" onClick={() => handleRoll()} aria-label="Roll Dice" disabled={game.winner || isComputerTurn || isAnimatingMove || game.dice.remaining.length > 0}>
          Roll Dice
        </button>
        <button type="button" onClick={handleNewGame} aria-label="New Game" disabled={isAnimatingMove}>New Game</button>
        <button type="button" onClick={handleUndo} aria-label="Undo" disabled={isAnimatingMove || game.undoStack.length === 0}>Undo</button>
        <button type="button" onClick={handleResetPosition} aria-label="Reset to Starting Position" disabled={isAnimatingMove}>Reset to Starting Position</button>
        <button type="button" onClick={clearSavedGame} aria-label="Clear Saved Game" disabled={isAnimatingMove}>Clear Saved Game</button>
      </section>

      <section ref={boardStageRef} className="board-stage" aria-label="Backgammon board">
        <div className="board-shell">
          <div className="board-surface">
            <div className="point-band top-band top-left-band">{TOP_LEFT.map((point) => renderPoint(point, true))}</div>
            <div className="point-band top-band top-right-band">{TOP_RIGHT.map((point) => renderPoint(point, true))}</div>

            <Bar
              barRef={barRef}
              state={game}
              selected={selectedSource === 'bar'}
              highlighted={destinationSet.has('bar')}
              onClick={() => {
                if (isAnimatingMove || isComputerTurn) {
                  return;
                }
                if (selectedSource != null && destinationSet.has('bar')) {
                  moveToDestination('bar');
                } else {
                  handleSelectSource('bar');
                }
              }}
            />

            <div className="point-band bottom-band bottom-left-band">{BOTTOM_LEFT.map((point) => renderPoint(point, false))}</div>
            <div className="point-band bottom-band bottom-right-band">{BOTTOM_RIGHT.map((point) => renderPoint(point, false))}</div>
            <BoardDice game={game} diceAnimKey={diceAnimKey} />
          </div>

          <aside className="home-rail" aria-label="Bear off area">
            <BearOffTray
              label="Computer"
              className="home-top"
              trayRef={(node) => {
                bearOffRefs.current.B = node;
              }}
              count={game.bearOff.B}
              highlighted={destinationSet.has('off') && game.currentPlayer === PLAYER_B}
              onClick={() => {
                if (!isAnimatingMove && !isComputerTurn) {
                  moveToDestination('off');
                }
              }}
            />
            <BearOffTray
              label="Player"
              className="home-bottom"
              trayRef={(node) => {
                bearOffRefs.current.A = node;
              }}
              count={game.bearOff.A}
              highlighted={destinationSet.has('off') && game.currentPlayer === PLAYER_A}
              onClick={() => {
                if (!isAnimatingMove && !isComputerTurn) {
                  moveToDestination('off');
                }
              }}
            />
          </aside>
        </div>
        {movingChecker && (
          <span
            aria-hidden="true"
            className={`checker moving-checker checker-${movingChecker.player === 'B' ? 'b' : 'a'}`}
            style={{
              left: `${movingChecker.x}px`,
              top: `${movingChecker.y}px`,
              '--move-step-ms': `${MOVE_STEP_MS}ms`
            }}
          />
        )}
      </section>

      <section className="debug" aria-label="Debug panel">
        <button type="button" onClick={toggleDebug} aria-label="Toggle debug panel" className="debug-toggle">
          {game.dev.debugOpen ? 'Hide Dev Tools' : 'Show Dev Tools'}
        </button>

        {game.dev.debugOpen && (
          <div className="debug-panel">
            <div className="debug-fields">
              <label>
                Die 1
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={game.dev.dieA}
                  onChange={(e) => updateDebugDie('dieA', e.target.value)}
                />
              </label>
              <label>
                Die 2
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={game.dev.dieB}
                  onChange={(e) => updateDebugDie('dieB', e.target.value)}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => handleRoll([game.dev.dieA, game.dev.dieB])}
              disabled={game.winner || isComputerTurn || isAnimatingMove || game.dice.remaining.length > 0}
            >
              Set Dice + Roll
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
