import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LEGACY_STORAGE_KEYS,
  PLAYER_A,
  PLAYER_B,
  STORAGE_KEY,
  applyMove,
  chooseComputerMove,
  chooseMoveForDestination,
  calculatePipCount,
  computeLegalMoves,
  createInitialState,
  getHigherDieRequirement,
  playerLabel,
  pushUndoState,
  restoreState,
  rollDice,
  serializeState,
  undo
} from './game.js';

const BOARD_LAYOUT_BY_HUMAN = {
  A: {
    topLeft: [12, 13, 14, 15, 16, 17],
    topRight: [18, 19, 20, 21, 22, 23],
    bottomLeft: [11, 10, 9, 8, 7, 6],
    bottomRight: [5, 4, 3, 2, 1, 0]
  },
  B: {
    topLeft: [11, 10, 9, 8, 7, 6],
    topRight: [5, 4, 3, 2, 1, 0],
    bottomLeft: [12, 13, 14, 15, 16, 17],
    bottomRight: [18, 19, 20, 21, 22, 23]
  }
};

const BASE_MOVE_STEP_MS = 210;
const BASE_MOVE_START_DELAY_MS = 40;
const BASE_BOARD_DICE_ROLL_MS = 1000;
const BASE_OPENING_ROLL_STEP_DELAY_MS = 1000;
const BASE_COMPUTER_TURN_DELAY_MS = 1000;

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
  const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }
    const restored = restoreState(raw);
    if (restored) {
      return restored;
    }
  }
  return createInitialState();
}

function getRolledDiceWithUsage(game, { expandDoubles = true } = {}) {
  if (game.dice.values.length !== 2) {
    return [];
  }

  const remainingCounts = {};
  for (const die of game.dice.remaining) {
    remainingCounts[die] = (remainingCounts[die] ?? 0) + 1;
  }

  const displayDiceValues =
    expandDoubles && game.dice.values[0] === game.dice.values[1]
      ? [game.dice.values[0], game.dice.values[0], game.dice.values[0], game.dice.values[0]]
      : game.dice.values;

  return displayDiceValues.map((die) => {
    const available = remainingCounts[die] ?? 0;
    if (available > 0) {
      remainingCounts[die] = available - 1;
      return { value: die, used: false };
    }
    return { value: die, used: true };
  });
}

function describeRequiredAction(state, legalMoves, higherDieRequirement) {
  const computerTurn = state.currentPlayer !== state.humanPlayer;
  const turnName = computerTurn ? 'Computer' : playerLabel(state.currentPlayer, state.humanPlayer);

  if (state.winner) {
    return `${playerLabel(state.winner, state.humanPlayer)} wins.`;
  }
  if (state.openingRollPending) {
    return state.statusText;
  }
  if (state.dice.remaining.length === 0) {
    if (state.statusText.includes('Turn auto-passed.')) {
      return state.statusText;
    }
    return computerTurn ? 'Computer is rolling...' : `${turnName}: roll dice.`;
  }
  if (state.bar[state.currentPlayer] > 0) {
    return `${turnName} must enter from bar.`;
  }
  if (legalMoves.length === 0) {
    return `${turnName} has no legal moves with rolled dice.`;
  }
  if (!computerTurn && higherDieRequirement) {
    return `Higher die required: use ${higherDieRequirement.requiredDie} before ${higherDieRequirement.blockedDie}.`;
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

function DicePanel({ game, isBoardDiceRolling, openingRollDisplay }) {
  if (game.openingRollPending) {
    return (
      <div className="dice-panel" aria-label="Dice">
        {openingRollDisplay?.playerDie ? <DieFace value={openingRollDisplay.playerDie} /> : null}
        {openingRollDisplay?.computerDie ? <DieFace value={openingRollDisplay.computerDie} /> : null}
      </div>
    );
  }

  if (isBoardDiceRolling || game.dice.values.length !== 2) {
    return <div className="dice-panel" aria-label="Dice" />;
  }

  const rolledDiceWithUsage = getRolledDiceWithUsage(game);

  return (
    <div className="dice-panel" aria-label="Dice">
      {rolledDiceWithUsage.map((die, i) => (
        <DieFace key={`status-die-${i}`} value={die.value} used={die.used} />
      ))}
    </div>
  );
}

function BoardDice({ game, diceAnimKey, isBoardDiceRolling }) {
  const rolledDiceWithUsage = getRolledDiceWithUsage(game, {
    expandDoubles: !isBoardDiceRolling
  });
  if (rolledDiceWithUsage.length === 0) {
    return null;
  }

  if (!isBoardDiceRolling) {
    return (
      <div className="board-dice-overlay" aria-hidden="true">
        {rolledDiceWithUsage.map((die, idx) => (
          <DieFace key={`board-static-die-${idx}-${die.value}`} value={die.value} used={die.used} ariaHidden />
        ))}
      </div>
    );
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
      {rolledDiceWithUsage.map((die, idx) => {
        const dieValue = die.value;
        const finalValue = Math.min(6, Math.max(1, Number(dieValue) || 1));
        const finalOrientation = orientationByValue[finalValue];
        return (
          <div key={`board-die-wrap-${idx}`} className={`board-die-perspective ${die.used ? 'board-die-used' : ''}`.trim()}>
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

function Point({ index, value, selected, highlighted, movable, onClick, isTop, pointRef }) {
  const owner = pointOwner(value);
  const count = checkerCount(value);
  const stackDivisor = Math.max(4, count - 1);

  return (
    <button
      ref={pointRef}
      className={`point ${isTop ? 'point-top' : 'point-bottom'} ${selected ? 'selected is-selected' : ''} ${highlighted ? 'legal is-legal' : ''} ${movable ? 'movable-source' : ''}`}
      onClick={onClick}
      aria-label={`Point ${index + 1}`}
      type="button"
    >
      <div className={`checker-stack ${isTop ? 'stack-top' : 'stack-bottom'}`}>
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className={`checker stack-checker checker-${owner === 'B' ? 'b' : 'a'} ${movable && i === count - 1 ? 'checker-movable' : ''}`}
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

function Bar({
  state,
  humanPlayer,
  playerStackSelected,
  playerStackMovable,
  highlighted,
  movable,
  onClick,
  onHumanCheckerClick,
  barRef
}) {
  const aCount = state.bar.A;
  const bCount = state.bar.B;
  const interactiveOnTop = humanPlayer === PLAYER_B;
  const topCount = bCount;
  const bottomCount = aCount;

  return (
    <div className="bar-lane-wrap">
      <button
        ref={barRef}
        className={`bar-column ${highlighted ? 'legal is-legal' : ''} ${movable ? 'movable-source' : ''}`}
        onClick={onClick}
        type="button"
        aria-label="Bar"
      >
        <div className="bar-seam" aria-hidden="true" />
      </button>

      <div className="bar-checker-overlay" aria-hidden="true">
        <div className={`barStackTop ${playerStackSelected && interactiveOnTop ? 'barForcedSelected' : ''}`} aria-hidden="true">
          {Array.from({ length: topCount }).map((_, i) => {
            const isInteractive = interactiveOnTop && i === 0 && !!onHumanCheckerClick;
            const className = `checker checker-b bar-checker ${playerStackSelected && interactiveOnTop ? 'barCheckerSelected' : ''} ${playerStackMovable && interactiveOnTop && i === 0 ? 'checker-movable' : ''} ${isInteractive ? 'barCheckerInteractive' : ''}`;
            if (!isInteractive) {
              return <span key={`b-${i}`} className={className} style={{ zIndex: topCount - i }} />;
            }
            return (
              <button
                key={`b-${i}`}
                type="button"
                className={`${className} bar-checker-button`}
                style={{ zIndex: topCount - i }}
                onClick={onHumanCheckerClick}
                aria-label="Select checker on bar"
              />
            );
          })}
        </div>

        <div className={`barStackBottom ${playerStackSelected && !interactiveOnTop ? 'barForcedSelected' : ''}`} aria-hidden="true">
          {Array.from({ length: bottomCount }).map((_, i) => {
            const isInteractive = !interactiveOnTop && i === 0 && !!onHumanCheckerClick;
            const className = `checker checker-a bar-checker ${playerStackSelected && !interactiveOnTop ? 'barCheckerSelected' : ''} ${playerStackMovable && !interactiveOnTop && i === 0 ? 'checker-movable' : ''} ${isInteractive ? 'barCheckerInteractive' : ''}`;

            if (!isInteractive) {
              return <span key={`a-${i}`} className={className} style={{ zIndex: bottomCount - i }} />;
            }

            return (
              <button
                key={`a-${i}`}
                type="button"
                className={`${className} bar-checker-button`}
                style={{ zIndex: bottomCount - i }}
                onClick={onHumanCheckerClick}
                aria-label="Select checker on bar"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BearOffTray({ label, count, highlighted, onClick, trayRef, className = '' }) {
  return (
    <button
      ref={trayRef}
      type="button"
      className={`bearoff-tray ${highlighted ? 'legal is-legal' : ''} ${className}`.trim()}
      onClick={onClick}
      aria-label={`${label} bear off`}
    >
      <span className="tray-label">{label} Off</span>
      <span className="tray-count">{count}</span>
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`}>Close</button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState(loadInitial);
  const [selectedSource, setSelectedSource] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [diceAnimKey, setDiceAnimKey] = useState(0);
  const [isBoardDiceRolling, setIsBoardDiceRolling] = useState(false);
  const [isAnimatingMove, setIsAnimatingMove] = useState(false);
  const [movingChecker, setMovingChecker] = useState(null);
  const [openingRollDisplay, setOpeningRollDisplay] = useState(null);
  const boardStageRef = useRef(null);
  const pointRefs = useRef(new Map());
  const barRef = useRef(null);
  const bearOffRefs = useRef({ A: null, B: null });
  const boardDiceRollTimerRef = useRef(null);
  const hasInitializedDiceAnimationRef = useRef(false);
  const openingSequenceIdRef = useRef(0);
  const isComputerTurn = game.currentPlayer !== game.humanPlayer;
  const isOpeningRollSequenceRunning = game.openingRollPending && Boolean(openingRollDisplay);
  const speedMultiplier = game.preferences.animationSpeed === 'fast' ? 0.55 : 1;
  const boardDiceRollMs = game.preferences.animationsEnabled ? Math.round(BASE_BOARD_DICE_ROLL_MS * speedMultiplier) : 0;
  const openingRollStepDelayMs = game.preferences.animationsEnabled ? Math.round(BASE_OPENING_ROLL_STEP_DELAY_MS * speedMultiplier) : 0;
  const computerTurnDelayMs = game.preferences.animationsEnabled ? Math.round(BASE_COMPUTER_TURN_DELAY_MS * speedMultiplier) : 180;
  const moveStepMs = game.preferences.animationsEnabled ? Math.round(BASE_MOVE_STEP_MS * speedMultiplier) : 0;
  const moveStartDelayMs = game.preferences.animationsEnabled ? Math.round(BASE_MOVE_START_DELAY_MS * speedMultiplier) : 0;
  const boardLayout = BOARD_LAYOUT_BY_HUMAN[game.humanPlayer] ?? BOARD_LAYOUT_BY_HUMAN.A;
  const higherDieRequirement = useMemo(() => getHigherDieRequirement(game), [game]);

  const legalMoves = useMemo(() => computeLegalMoves(game), [game]);
  const playerPipCount = useMemo(() => calculatePipCount(game, game.humanPlayer), [game]);
  const computerPlayer = game.humanPlayer === PLAYER_A ? PLAYER_B : PLAYER_A;
  const computerPipCount = useMemo(() => calculatePipCount(game, computerPlayer), [game, computerPlayer]);

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

  const forcedBarSelection =
    !game.winner &&
    !isBoardDiceRolling &&
    !isAnimatingMove &&
    game.currentPlayer === game.humanPlayer &&
    game.dice.remaining.length > 0 &&
    game.bar[game.humanPlayer] > 0;

  const activeSelectedSource = forcedBarSelection ? 'bar' : selectedSource;

  const moveOptionsForSelected = useMemo(() => {
    if (activeSelectedSource == null) {
      return [];
    }
    const sourceMoves = movesBySource.get(sourceKey(activeSelectedSource)) ?? [];
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
  }, [activeSelectedSource, game, movesBySource]);

  const destinationSet = useMemo(() => {
    if (isBoardDiceRolling) {
      return new Set();
    }
    const set = new Set();
    for (const option of moveOptionsForSelected) {
      set.add(destinationKey(option.to));
    }
    return set;
  }, [isBoardDiceRolling, moveOptionsForSelected]);

  const movableSourceSet = useMemo(() => {
    const set = new Set();
    for (const move of legalMoves) {
      set.add(sourceKey(move.from));
    }
    return set;
  }, [legalMoves]);

  const showMovableSources =
    game.preferences.showMoveHints &&
    !isBoardDiceRolling &&
    !isAnimatingMove &&
    !isComputerTurn &&
    !game.winner &&
    game.dice.remaining.length > 0;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, serializeState(game));
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }
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
    if (!hasInitializedDiceAnimationRef.current) {
      hasInitializedDiceAnimationRef.current = true;
      setIsBoardDiceRolling(false);
      return undefined;
    }

    if (boardDiceRollTimerRef.current) {
      window.clearTimeout(boardDiceRollTimerRef.current);
      boardDiceRollTimerRef.current = null;
    }

    if (game.dice.values.length === 2 && boardDiceRollMs > 0) {
      setIsBoardDiceRolling(true);
      setDiceAnimKey((k) => k + 2);
      boardDiceRollTimerRef.current = window.setTimeout(() => {
        setIsBoardDiceRolling(false);
        boardDiceRollTimerRef.current = null;
      }, boardDiceRollMs);
      return undefined;
    }

    setIsBoardDiceRolling(false);
    return undefined;
  }, [boardDiceRollMs, diceSignature, game.dice.values.length]);

  useEffect(() => {
    return () => {
      if (boardDiceRollTimerRef.current) {
        window.clearTimeout(boardDiceRollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (game.winner || game.openingRollPending || !isComputerTurn) {
      return undefined;
    }
    if (isAnimatingMove || isBoardDiceRolling) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      if (game.dice.remaining.length === 0) {
        setGame((prev) => {
          if (prev.winner || prev.currentPlayer === prev.humanPlayer || prev.dice.remaining.length > 0) {
            return prev;
          }
          startBoardDiceRollVisibilityWindow();
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
    }, computerTurnDelayMs);

    return () => window.clearTimeout(timer);
  }, [computerTurnDelayMs, game, isComputerTurn, isAnimatingMove, isBoardDiceRolling]);

  useEffect(() => {
    if (
      game.winner ||
      game.openingRollPending ||
      isComputerTurn ||
      isAnimatingMove ||
      isBoardDiceRolling ||
      isOpeningRollSequenceRunning ||
      game.dice.remaining.length > 0 ||
      !game.preferences.autoRollPlayer
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      handleRoll();
    }, 260);
    return () => window.clearTimeout(timer);
  }, [
    game.dice.remaining.length,
    game.openingRollPending,
    game.preferences.autoRollPlayer,
    game.winner,
    isAnimatingMove,
    isBoardDiceRolling,
    isComputerTurn,
    isOpeningRollSequenceRunning
  ]);

  function commit(next) {
    setGame(next);
  }

  function withUndo(nextState) {
    return pushUndoState(game, nextState);
  }

  function startBoardDiceRollVisibilityWindow() {
    if (boardDiceRollMs <= 0) {
      setIsBoardDiceRolling(false);
      return;
    }
    if (boardDiceRollTimerRef.current) {
      window.clearTimeout(boardDiceRollTimerRef.current);
    }
    setIsBoardDiceRolling(true);
    boardDiceRollTimerRef.current = window.setTimeout(() => {
      setIsBoardDiceRolling(false);
      boardDiceRollTimerRef.current = null;
    }, boardDiceRollMs);
  }

  async function runOpeningRollSequence(forced = null) {
    const sequenceId = openingSequenceIdRef.current + 1;
    openingSequenceIdRef.current = sequenceId;

    const humanDie = forced?.[0] ?? (Math.floor(Math.random() * 6) + 1);
    const computerDie = forced?.[1] ?? (Math.floor(Math.random() * 6) + 1);

    setOpeningRollDisplay({ playerDie: humanDie, computerDie: null, message: `You rolled ${humanDie}.` });
    await wait(openingRollStepDelayMs);
    if (openingSequenceIdRef.current !== sequenceId) return;

    setOpeningRollDisplay({ playerDie: humanDie, computerDie, message: `Computer rolled ${computerDie}.` });
    await wait(openingRollStepDelayMs);
    if (openingSequenceIdRef.current !== sequenceId) return;

    const tied = humanDie === computerDie;
    const openerMessage = tied
      ? `Tie at ${humanDie}-${computerDie}. Roll again.`
      : humanDie > computerDie
        ? 'You go first.'
        : 'The computer goes first.';

    setOpeningRollDisplay({ playerDie: humanDie, computerDie, message: openerMessage });
    await wait(openingRollStepDelayMs);
    if (openingSequenceIdRef.current !== sequenceId) return;

    setOpeningRollDisplay(null);
    setGame((prev) => {
      if (prev.winner || !prev.openingRollPending || prev.dice.remaining.length > 0) {
        return prev;
      }
      const forcedBySide = prev.humanPlayer === PLAYER_A ? [humanDie, computerDie] : [computerDie, humanDie];
      return pushUndoState(prev, rollDice(prev, forcedBySide));
    });
    setSelectedSource(null);
  }

  function handleRoll(forced = null) {
    if (isAnimatingMove || isOpeningRollSequenceRunning || (isComputerTurn && !forced)) {
      return;
    }

    if (game.openingRollPending) {
      void runOpeningRollSequence(forced);
      return;
    }

    const rolled = rollDice(game, forced);
    if (rolled === game) {
      return;
    }
    startBoardDiceRollVisibilityWindow();
    commit(withUndo(rolled));
    setSelectedSource(null);
  }

  function handleSelectSource(source) {
    if (isBoardDiceRolling || isAnimatingMove || isComputerTurn || game.winner || game.dice.remaining.length === 0) {
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
    await wait(moveStartDelayMs);
    for (let i = 1; i < centers.length; i += 1) {
      setMovingChecker((prev) => (prev ? { ...prev, x: centers[i].x, y: centers[i].y } : prev));
      await wait(moveStepMs);
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
    const shouldAnimate = game.preferences.animationsEnabled && !prefersReducedMotion;
    setIsAnimatingMove(true);
    try {
      if (shouldAnimate) {
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
    if (isBoardDiceRolling || isAnimatingMove || isComputerTurn || activeSelectedSource == null) {
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
    openingSequenceIdRef.current += 1;
    setOpeningRollDisplay(null);
    const reset = {
      ...createInitialState(),
      humanPlayer: game.humanPlayer,
      preferences: { ...game.preferences }
    };
    commit(withUndo(reset));
    setSelectedSource(null);
  }

  function handleResetPosition() {
    if (isAnimatingMove) {
      return;
    }
    openingSequenceIdRef.current += 1;
    setOpeningRollDisplay(null);
    const reset = {
      ...createInitialState(),
      humanPlayer: game.humanPlayer,
      preferences: { ...game.preferences },
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
    openingSequenceIdRef.current += 1;
    setOpeningRollDisplay(null);
    const previous = undo(game);
    commit(previous);
    setSelectedSource(null);
  }

  function clearSavedGame() {
    if (isAnimatingMove) {
      return;
    }
    openingSequenceIdRef.current += 1;
    setOpeningRollDisplay(null);
    window.localStorage.removeItem(STORAGE_KEY);
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(legacyKey);
    }
    commit(createInitialState());
    setSelectedSource(null);
  }

  function applyRematch({ swapSides }) {
    if (isAnimatingMove) {
      return;
    }
    openingSequenceIdRef.current += 1;
    setOpeningRollDisplay(null);
    const nextHumanPlayer = swapSides ? (game.humanPlayer === PLAYER_A ? PLAYER_B : PLAYER_A) : game.humanPlayer;
    const reset = {
      ...createInitialState(),
      humanPlayer: nextHumanPlayer,
      preferences: { ...game.preferences },
      dev: game.dev
    };
    commit(withUndo(reset));
    setSelectedSource(null);
  }

  function updatePreferences(nextPreferences) {
    setGame((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...nextPreferences
      }
    }));
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

  useEffect(() => {
    function onKeyDown(event) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const active = document.activeElement;
      if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'r') {
        event.preventDefault();
        handleRoll();
      } else if (key === 'u') {
        event.preventDefault();
        handleUndo();
      } else if (key === 'h') {
        event.preventDefault();
        setShowHelp((prev) => !prev);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const statusText =
    openingRollDisplay?.message ??
    (isAnimatingMove
      ? `${playerLabel(game.currentPlayer, game.humanPlayer)} moving...`
      : describeRequiredAction(game, legalMoves, higherDieRequirement));

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
        selected={activeSelectedSource === point}
        highlighted={game.preferences.showMoveHints && destinationSet.has(String(point))}
        movable={showMovableSources && movableSourceSet.has(String(point))}
        onClick={() => {
          if (isAnimatingMove || isComputerTurn) {
            return;
          }
          if (activeSelectedSource != null && destinationSet.has(String(point))) {
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
        <DicePanel game={game} isBoardDiceRolling={isBoardDiceRolling} openingRollDisplay={openingRollDisplay} />
      </section>

      <section className="controls" aria-label="Game controls">
        <button type="button" onClick={() => handleRoll()} aria-label="Roll Dice" disabled={game.winner || isComputerTurn || isAnimatingMove || isOpeningRollSequenceRunning || game.dice.remaining.length > 0}>
          Roll Dice
        </button>
        <button type="button" onClick={handleNewGame} aria-label="New Game" disabled={isAnimatingMove}>New Game</button>
        <button type="button" onClick={handleUndo} aria-label="Undo" disabled={isAnimatingMove || game.undoStack.length === 0}>Undo</button>
        <button type="button" onClick={handleResetPosition} aria-label="Reset to Starting Position" disabled={isAnimatingMove}>Reset to Starting Position</button>
        <button type="button" onClick={clearSavedGame} aria-label="Clear Saved Game" disabled={isAnimatingMove}>Clear Saved Game</button>
        <button type="button" onClick={() => setShowSettings(true)} aria-label="Open settings" disabled={isAnimatingMove}>Settings</button>
        <button type="button" onClick={() => setShowHelp(true)} aria-label="Open help">Help</button>
      </section>
      <p className="shortcut-hint">Shortcuts: <strong>R</strong> Roll, <strong>U</strong> Undo, <strong>H</strong> Help.</p>

      <section ref={boardStageRef} className="board-stage" aria-label="Backgammon board">
        <div className="board-shell">
          <div className="board-surface">
            <div className="pip-board-row" aria-label="Pip counts">
              <div className="pip-box pip-box-computer">
                <span className="pip-box-label">Computer</span>
                <span className="pip-box-value">PIP: {computerPipCount}</span>
              </div>
              <div className="pip-box pip-box-player">
                <span className="pip-box-label">Player</span>
                <span className="pip-box-value">PIP: {playerPipCount}</span>
              </div>
            </div>
            <div className="point-band top-band top-left-band">{boardLayout.topLeft.map((point) => renderPoint(point, true))}</div>
            <div className="point-band top-band top-right-band">{boardLayout.topRight.map((point) => renderPoint(point, true))}</div>

            <Bar
              barRef={barRef}
              state={game}
              humanPlayer={game.humanPlayer}
              playerStackSelected={activeSelectedSource === 'bar'}
              playerStackMovable={showMovableSources && movableSourceSet.has('bar')}
              highlighted={game.preferences.showMoveHints && destinationSet.has('bar')}
              movable={showMovableSources && movableSourceSet.has('bar')}
              onClick={() => {}}
              onHumanCheckerClick={() => {
                if (isAnimatingMove || isComputerTurn) {
                  return;
                }
                handleSelectSource('bar');
              }}
            />

            <div className="point-band bottom-band bottom-left-band">{boardLayout.bottomLeft.map((point) => renderPoint(point, false))}</div>
            <div className="point-band bottom-band bottom-right-band">{boardLayout.bottomRight.map((point) => renderPoint(point, false))}</div>
            <BoardDice game={game} diceAnimKey={diceAnimKey} isBoardDiceRolling={isBoardDiceRolling} />
          </div>

          <aside className="home-rail" aria-label="Bear off area">
            <BearOffTray
              label={game.humanPlayer === PLAYER_B ? 'Player' : 'Computer'}
              className="home-top"
              trayRef={(node) => {
                bearOffRefs.current.B = node;
              }}
              count={game.bearOff.B}
              highlighted={game.preferences.showMoveHints && destinationSet.has('off') && game.currentPlayer === PLAYER_B}
              onClick={() => {
                if (!isAnimatingMove && !isComputerTurn) {
                  moveToDestination('off');
                }
              }}
            />
            <BearOffTray
              label={game.humanPlayer === PLAYER_A ? 'Player' : 'Computer'}
              className="home-bottom"
              trayRef={(node) => {
                bearOffRefs.current.A = node;
              }}
              count={game.bearOff.A}
              highlighted={game.preferences.showMoveHints && destinationSet.has('off') && game.currentPlayer === PLAYER_A}
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
              '--move-step-ms': `${Math.max(1, moveStepMs)}ms`
            }}
          />
        )}
      </section>

      {game.winner && (
        <section className="winner-banner" aria-label="Game result">
          <strong>{playerLabel(game.winner, game.humanPlayer)} wins.</strong>
          <div className="winner-actions">
            <button type="button" onClick={() => applyRematch({ swapSides: false })} disabled={isAnimatingMove}>Rematch</button>
            <button type="button" onClick={() => applyRematch({ swapSides: true })} disabled={isAnimatingMove}>Swap Sides + Rematch</button>
            <button type="button" onClick={handleResetPosition} disabled={isAnimatingMove}>Reset Board</button>
          </div>
        </section>
      )}

      {showHelp && (
        <Modal title="How to Play" onClose={() => setShowHelp(false)}>
          <div className="modal-copy">
            <h3>Goal</h3>
            <p>Bear off all 15 of your checkers before the computer does.</p>
            <h3>Turn Flow</h3>
            <p>Roll dice, select a legal source checker, then choose a highlighted destination.</p>
            <h3>Bar Entry</h3>
            <p>If you have checkers on the bar, you must enter them first before other moves.</p>
            <h3>Bearing Off</h3>
            <p>You can bear off only when all of your checkers are in your home board and none are on the bar.</p>
            <h3>Controls</h3>
            <p>Use Roll Dice, Undo, and Reset controls, or keyboard shortcuts R, U, and H.</p>
            <p><a href="/docs/RULES.md" target="_blank" rel="noreferrer">View full rules reference</a></p>
          </div>
        </Modal>
      )}

      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div className="settings-list">
            <label>
              <span>Animations</span>
              <select
                value={game.preferences.animationsEnabled ? 'on' : 'off'}
                onChange={(event) => updatePreferences({ animationsEnabled: event.target.value === 'on' })}
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>
            <label>
              <span>Animation speed</span>
              <select
                value={game.preferences.animationSpeed}
                onChange={(event) => updatePreferences({ animationSpeed: event.target.value === 'fast' ? 'fast' : 'normal' })}
                disabled={!game.preferences.animationsEnabled}
              >
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </label>
            <label>
              <span>Auto-roll for player</span>
              <select
                value={game.preferences.autoRollPlayer ? 'on' : 'off'}
                onChange={(event) => updatePreferences({ autoRollPlayer: event.target.value === 'on' })}
              >
                <option value="off">Off</option>
                <option value="on">On</option>
              </select>
            </label>
            <label>
              <span>Show move hints</span>
              <select
                value={game.preferences.showMoveHints ? 'on' : 'off'}
                onChange={(event) => updatePreferences({ showMoveHints: event.target.value === 'on' })}
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>
          </div>
        </Modal>
      )}

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
              disabled={game.winner || isComputerTurn || isAnimatingMove || isOpeningRollSequenceRunning || game.dice.remaining.length > 0}
            >
              Set Dice + Roll
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
