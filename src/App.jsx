import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PLAYER_A,
  PLAYER_B,
  STORAGE_KEY,
  applyMove,
  chooseComputerMove,
  chooseMoveForDestination,
  calculatePipCount,
  computeLegalMoves,
  createInitialState,
  endTurn,
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
const OPENING_ROLL_DIE_ANIM_MS = 550;
const OPENING_ROLL_RESULT_MS = 800;
const OPENING_ROLL_COMPUTER_START_BEAT_MS = 420;
const COMPUTER_TURN_DELAY_MS = 1000;
const DICE_USED_STYLE_DELAY_MS = 250;

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

function BoardDice({ game, diceAnimKey, isBoardDiceRolling, showAllDiceAsUnused = false, rollingDiceValues = null, disableUsedStyling = false }) {
  const isPendingRollAnimation = Array.isArray(rollingDiceValues) && rollingDiceValues.length > 0;
  // During roll animation we ignore used/remaining styling to prevent grey flicker.
  const shouldIgnoreUsedStyling = disableUsedStyling || isPendingRollAnimation || isBoardDiceRolling;
  const rolledDiceWithUsage = (isPendingRollAnimation
    ? rollingDiceValues.map((value) => ({ value, used: false }))
    : getRolledDiceWithUsage(game, {
        expandDoubles: !isBoardDiceRolling
      }).map((die) => ((showAllDiceAsUnused || shouldIgnoreUsedStyling) ? { ...die, used: false } : die)));

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

function Bar({ state, playerStackSelected, playerStackMovable, highlighted, movable, onClick, onPlayerCheckerClick, barRef }) {
  const aCount = state.bar.A;
  const bCount = state.bar.B;

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
        <div className="barStackTop" aria-hidden="true">
          {Array.from({ length: bCount }).map((_, i) => (
            <span
              key={`b-${i}`}
              className="checker checker-b bar-checker"
              style={{ zIndex: bCount - i }}
            />
          ))}
        </div>

        <div className={`barStackBottom ${playerStackSelected ? 'barForcedSelected' : ''}`} aria-hidden="true">
          {Array.from({ length: aCount }).map((_, i) => {
            const isInteractivePlayerChecker = i === 0 && !!onPlayerCheckerClick;
            const playerCheckerClassName = `checker checker-a bar-checker ${playerStackSelected ? 'barCheckerSelected' : ''} ${playerStackMovable && i === 0 ? 'checker-movable' : ''} ${isInteractivePlayerChecker ? 'barCheckerInteractive' : ''}`;

            if (!isInteractivePlayerChecker) {
              return <span key={`a-${i}`} className={playerCheckerClassName} style={{ zIndex: aCount - i }} />;
            }

            return (
              <button
                key={`a-${i}`}
                type="button"
                className={`${playerCheckerClassName} bar-checker-button`}
                style={{ zIndex: aCount - i }}
                onClick={onPlayerCheckerClick}
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

export default function App() {
  const [game, setGame] = useState(loadInitial);
  const [selectedSource, setSelectedSource] = useState(null);
  const [diceAnimKey, setDiceAnimKey] = useState(0);
  const [isBoardDiceRolling, setIsBoardDiceRolling] = useState(false);
  const [isAnimatingMove, setIsAnimatingMove] = useState(false);
  const [movingChecker, setMovingChecker] = useState(null);
  const [openingRoll, setOpeningRoll] = useState({
    step: 'idle',
    playerDie: null,
    computerDie: null,
    winner: null
  });
  const [pendingRoll, setPendingRoll] = useState(null);
  const [isAnimatingRoll, setIsAnimatingRoll] = useState(false);
  const [disableUsedDiceStyling, setDisableUsedDiceStyling] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const boardStageRef = useRef(null);
  const pointRefs = useRef(new Map());
  const barRef = useRef(null);
  const bearOffRefs = useRef({ A: null, B: null });
  const boardDiceRollTimerRef = useRef(null);
  const usedDiceStylingTimerRef = useRef(null);
  const hasInitializedDiceAnimationRef = useRef(false);
  const openingSequenceIdRef = useRef(0);
  const computerTurnSequenceIdRef = useRef(0);
  const computerTurnInFlightRef = useRef(false);
  const suppressNextCommittedRollAnimationRef = useRef(false);
  const openingComputerStartBeatUntilRef = useRef(0);
  const isComputerTurn = game.currentPlayer === PLAYER_B;
  const gamePhase = game.openingRollPending ? 'OPENING_ROLL' : 'TURN_PLAY';
  const isOpeningRollSequenceRunning = gamePhase === 'OPENING_ROLL' && openingRoll.step !== 'idle';
  const isAnyRollAnimationRunning = isBoardDiceRolling || isAnimatingRoll;
  const openingMessage = (() => {
    if (gamePhase !== 'OPENING_ROLL') {
      return game.statusText;
    }
    if (openingRoll.step === 'playerRolling') return 'Opening roll — highest die goes first. You roll…';
    if (openingRoll.step === 'computerRolling') return 'Opening roll — highest die goes first. Computer rolls…';
    if (openingRoll.step === 'result') {
      if (openingRoll.winner === 'player') return 'Opening roll — highest die goes first. You go first.';
      if (openingRoll.winner === 'computer') return 'Opening roll — highest die goes first. Computer goes first.';
      return 'Opening roll — highest die goes first. Tie — roll again.';
    }
    return 'Opening roll — highest die goes first.';
  })();

  const legalMoves = useMemo(() => computeLegalMoves(game), [game]);
  const playerPipCount = useMemo(() => calculatePipCount(game, PLAYER_A), [game]);
  const computerPipCount = useMemo(() => calculatePipCount(game, PLAYER_B), [game]);

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
    !isAnyRollAnimationRunning &&
    !isAnimatingMove &&
    game.currentPlayer === PLAYER_A &&
    game.dice.remaining.length > 0 &&
    game.bar.A > 0;

  const activeSelectedSource = selectedSource;

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
    if (isAnyRollAnimationRunning) {
      return new Set();
    }
    const set = new Set();
    for (const option of moveOptionsForSelected) {
      set.add(destinationKey(option.to));
    }
    return set;
  }, [isAnyRollAnimationRunning, moveOptionsForSelected]);

  const movableSourceSet = useMemo(() => {
    const set = new Set();
    for (const move of legalMoves) {
      set.add(sourceKey(move.from));
    }
    return set;
  }, [legalMoves]);

  const showMovableSources = !isAnyRollAnimationRunning && !isAnimatingMove && !isComputerTurn && !game.winner && game.dice.remaining.length > 0;

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
    if (!hasInitializedDiceAnimationRef.current) {
      hasInitializedDiceAnimationRef.current = true;
      setIsBoardDiceRolling(false);
      return undefined;
    }

    if (boardDiceRollTimerRef.current) {
      window.clearTimeout(boardDiceRollTimerRef.current);
      boardDiceRollTimerRef.current = null;
    }

    if (game.dice.values.length === 2) {
      if (suppressNextCommittedRollAnimationRef.current) {
        suppressNextCommittedRollAnimationRef.current = false;
        setIsBoardDiceRolling(false);
        return undefined;
      }

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
      if (usedDiceStylingTimerRef.current) {
        window.clearTimeout(usedDiceStylingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (usedDiceStylingTimerRef.current) {
      window.clearTimeout(usedDiceStylingTimerRef.current);
      usedDiceStylingTimerRef.current = null;
    }

    if (isAnyRollAnimationRunning) {
      setDisableUsedDiceStyling(true);
      return undefined;
    }

    usedDiceStylingTimerRef.current = window.setTimeout(() => {
      setDisableUsedDiceStyling(false);
      usedDiceStylingTimerRef.current = null;
    }, DICE_USED_STYLE_DELAY_MS);

    return () => {
      if (usedDiceStylingTimerRef.current) {
        window.clearTimeout(usedDiceStylingTimerRef.current);
        usedDiceStylingTimerRef.current = null;
      }
    };
  }, [isAnyRollAnimationRunning]);

  useEffect(() => {
    if (game.winner || game.openingRollPending || !isComputerTurn) {
      return undefined;
    }
    if (isAnimatingMove || isAnyRollAnimationRunning || computerTurnInFlightRef.current) {
      return undefined;
    }

    let computerDelay = COMPUTER_TURN_DELAY_MS;
    const now = Date.now();
    if (openingComputerStartBeatUntilRef.current > now) {
      computerDelay = openingComputerStartBeatUntilRef.current - now;
    }

    const timer = window.setTimeout(() => {
      if (computerTurnInFlightRef.current) {
        return;
      }

      // Safety net for StrictMode/re-render races: if the computer already has a committed
      // no-move roll (values present but none remaining), pass that exact roll instead of rerolling.
      if (game.dice.values.length === 2 && game.dice.remaining.length === 0 && computeLegalMoves(game).length === 0) {
        const [rolledA, rolledB] = game.dice.values;
        setGame((prev) => {
          if (prev.currentPlayer !== PLAYER_B || prev.dice.values.length !== 2 || prev.dice.remaining.length !== 0) {
            return prev;
          }
          return pushUndoState(prev, endTurn(prev, `Computer rolled ${rolledA} and ${rolledB} but has no legal moves. Turn passed.`));
        });
        setToastMessage(null);
        return;
      }

      if (game.dice.remaining.length === 0) {
        computerTurnInFlightRef.current = true;
        const sequenceId = computerTurnSequenceIdRef.current + 1;
        computerTurnSequenceIdRef.current = sequenceId;

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;

        const runRollSequence = async () => {
          const rollId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          setPendingRoll({ d1, d2, owner: 'computer', id: rollId });
          setIsAnimatingRoll(true);
          setDiceAnimKey((k) => k + 2);
          await wait(BOARD_DICE_ROLL_MS);

          if (computerTurnSequenceIdRef.current !== sequenceId) {
            return;
          }

          // Keep commit logic on the current state snapshot (inside setGame callback).
          // A stale closure here previously caused one path to skip commit and another effect to roll again.
          let committed = null;
          setGame((prev) => {
            if (prev.winner || prev.currentPlayer !== PLAYER_B || prev.dice.remaining.length > 0) {
              return prev;
            }

            const rolled = rollDice(prev, [d1, d2], { autoPassNoMoves: false });
            committed = pushUndoState(prev, rolled);
            suppressNextCommittedRollAnimationRef.current = true;
            return committed;
          });

          setPendingRoll((prev) => (prev?.id === rollId ? null : prev));
          setIsAnimatingRoll(false);

          if (computerTurnSequenceIdRef.current !== sequenceId || !committed) {
            return;
          }

          if (computeLegalMoves(committed).length === 0) {
            const noMovesText = `Computer rolled ${d1} and ${d2} — no legal moves.`;
            setToastMessage(noMovesText);
            await wait(700);

            if (computerTurnSequenceIdRef.current !== sequenceId) {
              return;
            }

            setGame((prev) => {
              if (prev.winner || prev.currentPlayer !== PLAYER_B) {
                return prev;
              }
              return pushUndoState(prev, endTurn(prev, `Computer rolled ${d1} and ${d2} but has no legal moves. Turn passed.`));
            });
            setToastMessage(null);
          }
        };

        void runRollSequence().finally(() => {
          if (computerTurnSequenceIdRef.current === sequenceId) {
            computerTurnInFlightRef.current = false;
          }
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
    }, computerDelay);

    return () => window.clearTimeout(timer);
  }, [game, isComputerTurn, isAnimatingMove, isAnyRollAnimationRunning]);

  function commit(next) {
    setGame(next);
  }

  function withUndo(nextState) {
    return pushUndoState(game, nextState);
  }

  function startBoardDiceRollVisibilityWindow() {
    if (boardDiceRollTimerRef.current) {
      window.clearTimeout(boardDiceRollTimerRef.current);
    }
    setIsBoardDiceRolling(true);
    boardDiceRollTimerRef.current = window.setTimeout(() => {
      setIsBoardDiceRolling(false);
      boardDiceRollTimerRef.current = null;
    }, BOARD_DICE_ROLL_MS);
  }

  async function runOpeningRollSequence(forced = null) {
    const sequenceId = openingSequenceIdRef.current + 1;
    openingSequenceIdRef.current = sequenceId;

    const playerDie = forced?.[0] ?? (Math.floor(Math.random() * 6) + 1);
    const computerDie = forced?.[1] ?? (Math.floor(Math.random() * 6) + 1);

    setOpeningRoll({ step: 'playerRolling', playerDie, computerDie: null, winner: null });
    await wait(OPENING_ROLL_DIE_ANIM_MS);
    if (openingSequenceIdRef.current !== sequenceId) return;

    setOpeningRoll({ step: 'computerRolling', playerDie, computerDie, winner: null });
    await wait(OPENING_ROLL_DIE_ANIM_MS);
    if (openingSequenceIdRef.current !== sequenceId) return;

    const winner = playerDie === computerDie ? 'tie' : playerDie > computerDie ? 'player' : 'computer';
    setOpeningRoll({ step: 'result', playerDie, computerDie, winner });
    await wait(OPENING_ROLL_RESULT_MS);
    if (openingSequenceIdRef.current !== sequenceId) return;

    if (winner === 'tie') {
      setOpeningRoll({ step: 'idle', playerDie: null, computerDie: null, winner: null });
      return;
    }

    setOpeningRoll({ step: 'idle', playerDie, computerDie, winner });
    setGame((prev) => {
      if (prev.winner || !prev.openingRollPending || prev.dice.remaining.length > 0) {
        return prev;
      }
      return pushUndoState(prev, rollDice(prev, [playerDie, computerDie]));
    });

    if (winner === 'computer') {
      openingComputerStartBeatUntilRef.current = Date.now() + OPENING_ROLL_COMPUTER_START_BEAT_MS;
    }
    setSelectedSource(null);
  }

  function handleRoll(forced = null) {
    if (isAnimatingMove || isAnyRollAnimationRunning || isOpeningRollSequenceRunning || (isComputerTurn && !forced)) {
      return;
    }

    if (gamePhase === 'OPENING_ROLL') {
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
    if (isAnyRollAnimationRunning || isAnimatingMove || isComputerTurn || game.winner || game.dice.remaining.length === 0) {
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
    if (isAnyRollAnimationRunning || isAnimatingMove || isComputerTurn || activeSelectedSource == null) {
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
    computerTurnSequenceIdRef.current += 1;
    computerTurnInFlightRef.current = false;
    openingComputerStartBeatUntilRef.current = 0;
    setPendingRoll(null);
    setIsAnimatingRoll(false);
    setToastMessage(null);
    setOpeningRoll({ step: 'idle', playerDie: null, computerDie: null, winner: null });
    const reset = createInitialState();
    commit(withUndo(reset));
    setSelectedSource(null);
  }

  function handleResetPosition() {
    if (isAnimatingMove) {
      return;
    }
    openingSequenceIdRef.current += 1;
    computerTurnSequenceIdRef.current += 1;
    computerTurnInFlightRef.current = false;
    openingComputerStartBeatUntilRef.current = 0;
    setPendingRoll(null);
    setIsAnimatingRoll(false);
    setToastMessage(null);
    setOpeningRoll({ step: 'idle', playerDie: null, computerDie: null, winner: null });
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
    openingSequenceIdRef.current += 1;
    computerTurnSequenceIdRef.current += 1;
    computerTurnInFlightRef.current = false;
    openingComputerStartBeatUntilRef.current = 0;
    setPendingRoll(null);
    setIsAnimatingRoll(false);
    setToastMessage(null);
    setOpeningRoll({ step: 'idle', playerDie: null, computerDie: null, winner: null });
    const previous = undo(game);
    commit(previous);
    setSelectedSource(null);
  }

  function clearSavedGame() {
    if (isAnimatingMove) {
      return;
    }
    openingSequenceIdRef.current += 1;
    computerTurnSequenceIdRef.current += 1;
    computerTurnInFlightRef.current = false;
    openingComputerStartBeatUntilRef.current = 0;
    setPendingRoll(null);
    setIsAnimatingRoll(false);
    setToastMessage(null);
    setOpeningRoll({ step: 'idle', playerDie: null, computerDie: null, winner: null });
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
        highlighted={destinationSet.has(String(point))}
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

      <section ref={boardStageRef} className="board-stage" aria-label="Backgammon board">
        {gamePhase === 'OPENING_ROLL' && (
          <section className="opening-roll-panel" aria-live="polite">
            <p className="opening-roll-message">{openingMessage}</p>
            <div className="opening-roll-dice-row" aria-label="Opening roll dice">
              <div className="opening-roll-die-slot">
                <span className="opening-roll-label">Computer</span>
                {openingRoll.computerDie ? (
                  <DieFace value={openingRoll.computerDie} className={openingRoll.step === 'computerRolling' ? 'opening-die-rolling' : ''} />
                ) : (
                  <div className="die opening-die-empty" aria-hidden="true" />
                )}
              </div>
              <div className="opening-roll-die-slot opening-roll-die-slot-player">
                <span className="opening-roll-label">You</span>
                {openingRoll.playerDie ? (
                  <DieFace value={openingRoll.playerDie} className={openingRoll.step === 'playerRolling' ? 'opening-die-rolling' : ''} />
                ) : (
                  <div className="die opening-die-empty" aria-hidden="true" />
                )}
              </div>
            </div>
          </section>
        )}

        <div className="game-layout">
          <div className="pip-row" aria-label="Pip counts">
            <div className={`pip-box pip-box-computer ${!game.winner && isComputerTurn ? 'pip-box-active' : ''}`.trim()}>
              <span className="pip-box-label">Computer</span>
              <span className="pip-box-value">PIP: {computerPipCount}</span>
              <span className="pip-box-meta">Bar: {game.bar.B}</span>
            </div>
            <div className={`pip-box pip-box-player ${!game.winner && !isComputerTurn ? 'pip-box-active' : ''}`.trim()}>
              <span className="pip-box-label">Player</span>
              <span className="pip-box-value">PIP: {playerPipCount}</span>
              <span className="pip-box-meta">Bar: {game.bar.A}</span>
            </div>
          </div>

          <div className="board-surface">
            <div className="point-band top-band top-left-band">{TOP_LEFT.map((point) => renderPoint(point, true))}</div>
            <div className="point-band top-band top-right-band">{TOP_RIGHT.map((point) => renderPoint(point, true))}</div>

            <Bar
              barRef={barRef}
              state={game}
              playerStackSelected={activeSelectedSource === 'bar'}
              playerStackMovable={showMovableSources && movableSourceSet.has('bar')}
              highlighted={destinationSet.has('bar')}
              movable={showMovableSources && movableSourceSet.has('bar')}
              onClick={() => {}}
              onPlayerCheckerClick={() => {
                if (isAnimatingMove || isComputerTurn) {
                  return;
                }
                handleSelectSource('bar');
              }}
            />

            <div className="point-band bottom-band bottom-left-band">{BOTTOM_LEFT.map((point) => renderPoint(point, false))}</div>
            <div className="point-band bottom-band bottom-right-band">{BOTTOM_RIGHT.map((point) => renderPoint(point, false))}</div>
            <BoardDice
              game={game}
              diceAnimKey={diceAnimKey}
              isBoardDiceRolling={isAnyRollAnimationRunning}
              showAllDiceAsUnused={false}
              rollingDiceValues={pendingRoll ? [pendingRoll.d1, pendingRoll.d2] : null}
              disableUsedStyling={isAnyRollAnimationRunning || disableUsedDiceStyling}
            />
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

      {toastMessage && (
        <section className="roll-toast" aria-live="polite">
          {toastMessage}
        </section>
      )}

      {gamePhase !== 'OPENING_ROLL' && (
        <section className="roll-toast" aria-live="polite">
          {game.statusText}
        </section>
      )}

      <section className="controls" aria-label="Game controls">
        <button type="button" onClick={() => handleRoll()} aria-label="Roll Dice" disabled={game.winner || isComputerTurn || isAnimatingMove || isAnyRollAnimationRunning || isOpeningRollSequenceRunning || (gamePhase !== 'OPENING_ROLL' && game.dice.remaining.length > 0)}>
          Roll Dice
        </button>
        <button type="button" onClick={handleNewGame} aria-label="New Game" disabled={isAnimatingMove || isAnyRollAnimationRunning}>New Game</button>
        <button type="button" onClick={handleUndo} aria-label="Undo" disabled={isAnimatingMove || isAnyRollAnimationRunning || game.undoStack.length === 0}>Undo</button>
        <button type="button" onClick={handleResetPosition} aria-label="Reset to Starting Position" disabled={isAnimatingMove || isAnyRollAnimationRunning}>Reset to Starting Position</button>
        <button type="button" onClick={clearSavedGame} aria-label="Clear Saved Game" disabled={isAnimatingMove || isAnyRollAnimationRunning}>Clear Saved Game</button>
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
              disabled={game.winner || isComputerTurn || isAnimatingMove || isAnyRollAnimationRunning || isOpeningRollSequenceRunning || (gamePhase !== 'OPENING_ROLL' && game.dice.remaining.length > 0)}
            >
              Set Dice + Roll
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
