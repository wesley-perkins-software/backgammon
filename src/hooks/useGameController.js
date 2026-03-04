import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PLAYER_A,
  PLAYER_B,
  applyMove,
  chooseComputerMove,
  calculatePipCount,
  computeLegalMoves,
  createInitialState,
  endTurn,
  pushUndoState,
  rollDice,
  undo
} from '../game.js';
import * as defaultClock from '../platform/clock.js';
import * as defaultMedia from '../platform/media.js';
import * as defaultRandom from '../platform/random.js';
import * as defaultStorage from '../platform/storage.js';
import { clearSavedGameState, loadGameState, saveGameState } from '../services/persistence.js';
import {
  analyzePathChoices,
  buildMoveSequenceOption,
  findDeterministicChoice
} from './movePathChoice.js';

const MOVE_STEP_MS = 210;
const MOVE_START_DELAY_MS = 40;
const BOARD_DICE_ROLL_MS = 1000;
const OPENING_ROLL_DIE_ANIM_MS = BOARD_DICE_ROLL_MS;
const OPENING_ROLL_DIE_HOLD_MS = 220;
const OPENING_ROLL_RESULT_MS = 800;
const OPENING_ROLL_COMPUTER_START_BEAT_MS = 420;
const COMPUTER_TURN_DELAY_MS = 1000;
const DICE_USED_STYLE_DELAY_MS = 250;

const destinationKey = (to) => (to === 'off' ? 'off' : String(to));
const sourceKey = (from) => (from === 'bar' ? 'bar' : String(from));

export default function useGameController({ clock = defaultClock, media = defaultMedia, random = defaultRandom, storage = defaultStorage } = {}) {
  const [game, setGame] = useState(() => loadGameState(storage));
  const [selectedSource, setSelectedSource] = useState(null);
  const [diceAnimKey, setDiceAnimKey] = useState(0);
  const [isBoardDiceRolling, setIsBoardDiceRolling] = useState(false);
  const [isAnimatingMove, setIsAnimatingMove] = useState(false);
  const [movingChecker, setMovingChecker] = useState(null);
  const [pendingRoll, setPendingRoll] = useState(null);
  const [isAnimatingRoll, setIsAnimatingRoll] = useState(false);
  const [disableUsedDiceStyling, setDisableUsedDiceStyling] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [playerTurnPhase, setPlayerTurnPhase] = useState('NEED_ROLL');
  const [pendingPathChoices, setPendingPathChoices] = useState(null);

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
  const gamePhase = game.phase === 'opening' ? 'OPENING_ROLL' : 'TURN_PLAY';
  const isOpeningRollSequenceRunning = gamePhase === 'OPENING_ROLL' && game.openingRoll.status === 'rolling';
  const isAnyRollAnimationRunning = isBoardDiceRolling || isAnimatingRoll;
  const openingMessage = gamePhase !== 'OPENING_ROLL' ? game.statusText : game.openingRoll.status === 'rolling'
    ? game.openingRoll.computer == null
      ? 'Opening roll — highest die goes first. You roll…'
      : 'Opening roll — highest die goes first. Computer rolls…'
    : game.openingRoll.status === 'tie'
      ? 'Opening roll — highest die goes first. Tie — roll again.'
      : 'Opening roll — highest die goes first.';

  const legalMoves = useMemo(() => computeLegalMoves(game), [game]);
  const playerPipCount = useMemo(() => calculatePipCount(game, PLAYER_A), [game]);
  const computerPipCount = useMemo(() => calculatePipCount(game, PLAYER_B), [game]);

  const movesBySource = useMemo(() => {
    const map = new Map();
    for (const move of legalMoves) {
      const key = sourceKey(move.from);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(move);
    }
    return map;
  }, [legalMoves]);

  const activeSelectedSource = selectedSource;
  const moveOptionsForSelected = useMemo(() => activeSelectedSource == null ? [] : movesBySource.get(sourceKey(activeSelectedSource)) ?? [], [activeSelectedSource, movesBySource]);

  const chainOptionsForSelected = useMemo(() => {
    if (activeSelectedSource == null) return [];
    const options = [];
    const canContinueTurn = (nextState) => nextState.currentPlayer === game.currentPlayer && !nextState.winner;

    for (const firstMove of moveOptionsForSelected) {
      const afterFirst = applyMove(game, firstMove);
      if (!canContinueTurn(afterFirst)) continue;
      const stack = [{ state: afterFirst, sequence: [firstMove] }];
      while (stack.length > 0) {
        const current = stack.pop();
        const lastMove = current.sequence[current.sequence.length - 1];
        const nextMoves = computeLegalMoves(current.state).filter((nextMove) => destinationKey(nextMove.from) === destinationKey(lastMove.to));
        for (const nextMove of nextMoves) {
          const nextSequence = [...current.sequence, nextMove];
          const nextState = applyMove(current.state, nextMove);
          options.push({ to: nextMove.to, moves: nextSequence, kind: 'chain' });
          if (canContinueTurn(nextState)) stack.push({ state: nextState, sequence: nextSequence });
        }
      }
    }
    return options;
  }, [activeSelectedSource, game, moveOptionsForSelected]);

  const destinationOptionsForSelected = useMemo(() => {
    const singleOptions = moveOptionsForSelected.map((move) => buildMoveSequenceOption({
      from: move.from,
      to: move.to,
      kind: 'single',
      steps: [move],
      resultingGame: applyMoveSequence(game, [move])
    }));
    const chainOptions = chainOptionsForSelected.map((option) => buildMoveSequenceOption({
      from: option.moves[0].from,
      to: option.to,
      kind: 'chain',
      steps: option.moves,
      resultingGame: applyMoveSequence(game, option.moves)
    }));
    return [...singleOptions, ...chainOptions];
  }, [game, moveOptionsForSelected, chainOptionsForSelected]);
  const destinationSet = useMemo(() => {
    if (isAnyRollAnimationRunning) return new Set();
    if (pendingPathChoices) return new Set(pendingPathChoices.intermediateMap.keys());
    return new Set(destinationOptionsForSelected.map((option) => destinationKey(option.to)));
  }, [destinationOptionsForSelected, isAnyRollAnimationRunning, pendingPathChoices]);

  const movableSourceSet = useMemo(() => new Set(legalMoves.map((move) => sourceKey(move.from))), [legalMoves]);
  const showMovableSources = !isAnyRollAnimationRunning && !isAnimatingMove && !isComputerTurn && !game.winner && game.dice.remaining.length > 0;
  const canPlayerRoll = !game.winner && !isAnyRollAnimationRunning && ((gamePhase === 'OPENING_ROLL' && ['idle', 'tie'].includes(game.openingRoll.status)) || (gamePhase === 'TURN_PLAY' && game.currentPlayer === PLAYER_A && playerTurnPhase === 'NEED_ROLL'));

  useEffect(() => { saveGameState(game, storage); }, [game, storage]);
  useEffect(() => { if (selectedSource != null && !movesBySource.has(sourceKey(selectedSource))) setSelectedSource(null); }, [movesBySource, selectedSource]);
  useEffect(() => { setPendingPathChoices(null); }, [selectedSource, game]);
  useEffect(() => {
    if (!pendingPathChoices) return undefined;
    const onEscape = (event) => {
      if (event.key !== 'Escape') return;
      setPendingPathChoices(null);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [pendingPathChoices]);

  const diceSignature = game.dice.values.join('-');
  useEffect(() => {
    if (!hasInitializedDiceAnimationRef.current) {
      hasInitializedDiceAnimationRef.current = true;
      setIsBoardDiceRolling(false);
      return;
    }
    if (boardDiceRollTimerRef.current) clock.clearTimeout(boardDiceRollTimerRef.current);
    if (game.dice.values.length === 2) {
      if (suppressNextCommittedRollAnimationRef.current) {
        suppressNextCommittedRollAnimationRef.current = false;
        setIsBoardDiceRolling(false);
        return;
      }
      setIsBoardDiceRolling(true);
      setDiceAnimKey((k) => k + 2);
      boardDiceRollTimerRef.current = clock.setTimeout(() => { setIsBoardDiceRolling(false); boardDiceRollTimerRef.current = null; }, BOARD_DICE_ROLL_MS);
      return;
    }
    setIsBoardDiceRolling(false);
  }, [diceSignature, game.dice.values.length]);

  useEffect(() => () => {
    if (boardDiceRollTimerRef.current) clock.clearTimeout(boardDiceRollTimerRef.current);
    if (usedDiceStylingTimerRef.current) clock.clearTimeout(usedDiceStylingTimerRef.current);
  }, []);

  useEffect(() => {
    if (usedDiceStylingTimerRef.current) clock.clearTimeout(usedDiceStylingTimerRef.current);
    if (isAnyRollAnimationRunning) {
      setDisableUsedDiceStyling(true);
      return;
    }
    usedDiceStylingTimerRef.current = clock.setTimeout(() => { setDisableUsedDiceStyling(false); usedDiceStylingTimerRef.current = null; }, DICE_USED_STYLE_DELAY_MS);
  }, [isAnyRollAnimationRunning]);

  useEffect(() => {
    if (gamePhase === 'OPENING_ROLL' || game.winner) return;
    if (game.currentPlayer !== PLAYER_A) return setPlayerTurnPhase('NEED_ROLL');
    if (isAnimatingRoll) return setPlayerTurnPhase('ROLLING');
    if (game.dice.values.length === 0) return setPlayerTurnPhase('NEED_ROLL');
    if (game.dice.remaining.length > 0 && computeLegalMoves(game).length > 0) return setPlayerTurnPhase('MOVE');
    if (game.dice.values.length === 2 && game.dice.remaining.length === 0 && computeLegalMoves(game).length === 0) setPlayerTurnPhase('NO_MOVES');
  }, [game, gamePhase, isAnimatingRoll]);

  useEffect(() => {
    if (gamePhase === 'OPENING_ROLL' || game.winner || game.currentPlayer !== PLAYER_A || playerTurnPhase !== 'NO_MOVES') return;
    setToastMessage('No legal moves — passing turn.');
    const timer = clock.setTimeout(() => {
      setGame((prev) => prev.winner || prev.currentPlayer !== PLAYER_A || prev.dice.values.length !== 2 || prev.dice.remaining.length !== 0 || computeLegalMoves(prev).length !== 0 ? prev : pushUndoState(prev, endTurn(prev, `Player rolled ${prev.dice.values[0]} and ${prev.dice.values[1]} but has no legal moves. Turn passed.`)));
      setToastMessage(null);
      setPlayerTurnPhase('NEED_ROLL');
    }, 900);
    return () => clock.clearTimeout(timer);
  }, [game, gamePhase, playerTurnPhase]);

  useEffect(() => {
    if (gamePhase !== 'TURN_PLAY' || game.currentPlayer !== PLAYER_A || playerTurnPhase !== 'NEED_ROLL') return;
    if (game.dice.values.length === 0 && game.dice.remaining.length === 0) return;
    if (game.dice.remaining.length > 0) return;
    setGame((prev) => prev.currentPlayer !== PLAYER_A || prev.phase === 'opening' || (prev.dice.values.length === 0 && prev.dice.remaining.length === 0) || prev.dice.remaining.length > 0 ? prev : { ...prev, dice: { values: [], remaining: [] } });
  }, [game, gamePhase, playerTurnPhase]);

  function applyMoveSequence(stateAtMove, moves) {
    let next = stateAtMove;
    for (const move of moves) {
      next = applyMove(next, move);
      if (next.currentPlayer !== stateAtMove.currentPlayer || next.winner) break;
    }
    return next;
  }
  function centerFromElement(element) {
    const stage = boardStageRef.current;
    if (!stage || !element) return null;
    const stageRect = stage.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return { x: rect.left - stageRect.left + rect.width / 2, y: rect.top - stageRect.top + rect.height / 2 };
  }
  function elementForLocation(location, playerForOff) {
    if (location === 'bar') return barRef.current;
    if (location === 'off') return bearOffRefs.current[playerForOff] ?? null;
    return pointRefs.current.get(location) ?? null;
  }
  function pathForMove(stateAtMove, move) {
    const path = [move.from];
    const player = stateAtMove.currentPlayer;
    if (typeof move.from === 'number' && typeof move.to === 'number') {
      const dir = move.to > move.from ? 1 : -1;
      for (let p = move.from + dir; p !== move.to + dir; p += dir) path.push(p);
      return path;
    }
    if (typeof move.from === 'number' && move.to === 'off') {
      const dir = player === PLAYER_A ? -1 : 1;
      for (let step = 1; step <= move.dieUsed; step += 1) {
        const point = move.from + dir * step;
        if (point < 0 || point > 23) return [...path, 'off'];
        path.push(point);
      }
      return [...path, 'off'];
    }
    return [...path, move.to];
  }
  async function animateSingleMove(stateAtMove, move) {
    const player = stateAtMove.currentPlayer;
    const centers = pathForMove(stateAtMove, move).map((loc) => centerFromElement(elementForLocation(loc, player))).filter(Boolean);
    if (centers.length < 2) return;
    setMovingChecker({ player, x: centers[0].x, y: centers[0].y });
    await clock.wait(MOVE_START_DELAY_MS);
    for (let i = 1; i < centers.length; i += 1) {
      setMovingChecker((prev) => (prev ? { ...prev, x: centers[i].x, y: centers[i].y } : prev));
      await clock.wait(MOVE_STEP_MS);
    }
    await clock.wait(30);
  }
  async function performMoveSequence(stateAtMove, moves) {
    if (isAnimatingMove) return;
    setSelectedSource(null);
    const prefersReducedMotion = media.prefersReducedMotion();
    setIsAnimatingMove(true);
    try {
      if (!prefersReducedMotion) {
        let animationState = stateAtMove;
        for (const move of moves) {
          await animateSingleMove(animationState, move);
          animationState = applyMove(animationState, move);
          if (animationState.currentPlayer !== stateAtMove.currentPlayer || animationState.winner) break;
        }
      }
    } finally {
      setMovingChecker(null);
      setIsAnimatingMove(false);
    }
    setGame((prev) => (prev !== stateAtMove ? prev : pushUndoState(prev, applyMoveSequence(prev, moves))));
  }

  function moveToDestination(destination) {
    if (isAnyRollAnimationRunning || isAnimatingMove || isComputerTurn || activeSelectedSource == null) return;
    if (pendingPathChoices) return;
    const destinationId = destinationKey(destination);
    const candidates = destinationOptionsForSelected.filter((option) => destinationKey(option.to) === destinationId);
    if (!candidates.length) return;
    const isTwoStepChoice = candidates.every((option) => option.steps.length === 2);
    if (!isTwoStepChoice) {
      const chosenOption = candidates.length > 1
        ? findDeterministicChoice(candidates)
        : candidates[0];
      if (chosenOption) void performMoveSequence(game, chosenOption.steps);
      return;
    }

    const analysis = analyzePathChoices(candidates);
    if (game.dev.debugOpen) console.debug('[path-choice]', {
      legalSequenceCount: analysis.legalSequenceCount,
      uniqueOutcomeCount: analysis.uniqueOutcomeCount,
      promptShown: analysis.shouldPrompt
    });

    if (analysis.shouldPrompt) {
      setPendingPathChoices({
        from: activeSelectedSource,
        finalTo: destination,
        options: analysis.promptOptions,
        intermediateMap: analysis.intermediateMap
      });
      return;
    }

    if (analysis.chosenOption) void performMoveSequence(game, analysis.chosenOption.steps);
  }

  function chooseIntermediatePath(intermediate) {
    if (!pendingPathChoices) return;
    const key = destinationKey(intermediate);
    const options = pendingPathChoices.intermediateMap.get(key) ?? [];
    const chosenOption = findDeterministicChoice(options);
    if (!chosenOption) return;
    setPendingPathChoices(null);
    void performMoveSequence(game, chosenOption.steps);
  }



  function cancelPendingPathChoice() {
    setPendingPathChoices(null);
  }

  function resetFlowState() {
    openingSequenceIdRef.current += 1;
    computerTurnSequenceIdRef.current += 1;
    computerTurnInFlightRef.current = false;
    openingComputerStartBeatUntilRef.current = 0;
    setPendingRoll(null);
    setIsAnimatingRoll(false);
    setToastMessage(null);
    setSelectedSource(null);
    setPendingPathChoices(null);
  }

  function handleNewGame() {
    if (isAnimatingMove) return;
    resetFlowState();
    setGame((prev) => pushUndoState(prev, createInitialState()));
  }
  function handleResetPosition() {
    if (isAnimatingMove) return;
    resetFlowState();
    setGame((prev) => pushUndoState(prev, { ...createInitialState(), undoStack: prev.undoStack, dev: prev.dev }));
  }
  function handleUndo() {
    if (isAnimatingMove) return;
    resetFlowState();
    setGame((prev) => undo(prev));
  }
  function clearSavedGame() {
    if (isAnimatingMove) return;
    resetFlowState();
    clearSavedGameState(storage);
    setGame(createInitialState());
  }
  function updateDebugDie(key, value) {
    const n = Math.max(1, Math.min(6, Number(value) || 1));
    setGame((prev) => ({ ...prev, dev: { ...prev.dev, [key]: n } }));
  }
  function toggleDebug() { setGame((prev) => ({ ...prev, dev: { ...prev.dev, debugOpen: !prev.dev.debugOpen } })); }
  function handleSelectSource(source) {
    if (isAnyRollAnimationRunning || isAnimatingMove || isComputerTurn || game.winner || game.dice.remaining.length === 0) return;
    if (pendingPathChoices) return;
    const key = sourceKey(source);
    if (!movesBySource.has(key)) return;
    if (selectedSource === source) return setSelectedSource(null);
    setSelectedSource(source);
  }

  async function runOpeningRollSequence(forced = null) {
    const sequenceId = openingSequenceIdRef.current + 1;
    openingSequenceIdRef.current = sequenceId;
    const openingRollId = globalThis.crypto?.randomUUID?.() ?? `opening-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const didCancel = () => {
      if (openingSequenceIdRef.current === sequenceId) return false;
      setIsAnimatingRoll(false);
      setPendingRoll((prev) => (prev?.id === openingRollId ? null : prev));
      return true;
    };
    const playerDie = forced?.[0] ?? random.rollDie1to6();
    const computerDie = forced?.[1] ?? random.rollDie1to6();

    setGame((prev) => ({ ...prev, openingRoll: { player: playerDie, computer: null, status: 'rolling' } }));
    setPendingRoll({ values: [playerDie], animatedMask: [true], owner: 'opening', id: openingRollId });
    setIsAnimatingRoll(true); setDiceAnimKey((k) => k + 2); await clock.wait(OPENING_ROLL_DIE_ANIM_MS); if (didCancel()) return; setIsAnimatingRoll(false);
    await clock.wait(OPENING_ROLL_DIE_HOLD_MS); if (didCancel()) return;
    setGame((prev) => ({ ...prev, openingRoll: { player: playerDie, computer: computerDie, status: 'rolling' } }));
    setPendingRoll({ values: [playerDie, computerDie], animatedMask: [false, true], owner: 'opening', id: openingRollId });
    setIsAnimatingRoll(true); setDiceAnimKey((k) => k + 2); await clock.wait(OPENING_ROLL_DIE_ANIM_MS); if (didCancel()) return; setIsAnimatingRoll(false);
    await clock.wait(OPENING_ROLL_RESULT_MS); if (didCancel()) return;
    setPendingRoll((prev) => (prev?.id === openingRollId ? null : prev));
    setGame((prev) => {
      if (prev.winner || prev.phase !== 'opening' || prev.dice.remaining.length > 0) return prev;
      suppressNextCommittedRollAnimationRef.current = true;
      const rolled = rollDice(prev, [playerDie, computerDie]);
      if (rolled.phase === 'playing' && rolled.currentPlayer === PLAYER_B) openingComputerStartBeatUntilRef.current = Date.now() + OPENING_ROLL_COMPUTER_START_BEAT_MS;
      return pushUndoState(prev, rolled);
    });
    setSelectedSource(null);
  }

  function handleRoll(forced = null) {
    if ((!forced && !canPlayerRoll) || isAnimatingMove || isAnyRollAnimationRunning || isOpeningRollSequenceRunning || (isComputerTurn && !forced)) return;
    if (gamePhase === 'OPENING_ROLL') return void runOpeningRollSequence(forced);
    const d1 = forced?.[0] ?? random.rollDie1to6();
    const d2 = forced?.[1] ?? random.rollDie1to6();
    const rollId = globalThis.crypto?.randomUUID?.() ?? `player-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    void (async () => {
      setPlayerTurnPhase('ROLLING');
      setPendingRoll({ values: [d1, d2], animatedMask: [true, true], owner: 'player', id: rollId });
      setIsAnimatingRoll(true); setDiceAnimKey((k) => k + 2); setSelectedSource(null);
      await clock.wait(BOARD_DICE_ROLL_MS);
      setGame((prev) => prev.winner || prev.currentPlayer !== PLAYER_A || prev.phase === 'opening' || prev.dice.remaining.length > 0 ? prev : pushUndoState(prev, rollDice(prev, [d1, d2], { autoPassNoMoves: false })));
      suppressNextCommittedRollAnimationRef.current = true;
      setPendingRoll((prev) => (prev?.id === rollId ? null : prev));
      setIsAnimatingRoll(false);
    })();
  }

  useEffect(() => {
    if (game.winner || game.phase === 'opening' || !isComputerTurn || isAnimatingMove || isAnyRollAnimationRunning || computerTurnInFlightRef.current) return;
    let computerDelay = COMPUTER_TURN_DELAY_MS;
    const now = Date.now();
    if (openingComputerStartBeatUntilRef.current > now) computerDelay = openingComputerStartBeatUntilRef.current - now;
    const timer = clock.setTimeout(() => {
      if (computerTurnInFlightRef.current) return;
      if (game.dice.values.length === 2 && game.dice.remaining.length === 0 && computeLegalMoves(game).length === 0) {
        const [rolledA, rolledB] = game.dice.values;
        setGame((prev) => prev.currentPlayer !== PLAYER_B || prev.dice.values.length !== 2 || prev.dice.remaining.length !== 0 ? prev : pushUndoState(prev, endTurn(prev, `Computer rolled ${rolledA} and ${rolledB} but has no legal moves. Turn passed.`)));
        setToastMessage(null); return;
      }
      if (game.dice.remaining.length === 0) {
        computerTurnInFlightRef.current = true;
        const sequenceId = computerTurnSequenceIdRef.current + 1;
        computerTurnSequenceIdRef.current = sequenceId;
        const d1 = random.rollDie1to6(); const d2 = random.rollDie1to6();
        void (async () => {
          const rollId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          setPendingRoll({ values: [d1, d2], animatedMask: [true, true], owner: 'computer', id: rollId });
          setIsAnimatingRoll(true); setDiceAnimKey((k) => k + 2); await clock.wait(BOARD_DICE_ROLL_MS);
          if (computerTurnSequenceIdRef.current !== sequenceId) return;
          let committed = null;
          setGame((prev) => {
            if (prev.winner || prev.currentPlayer !== PLAYER_B || prev.dice.remaining.length > 0) return prev;
            committed = pushUndoState(prev, rollDice(prev, [d1, d2], { autoPassNoMoves: false }));
            suppressNextCommittedRollAnimationRef.current = true;
            return committed;
          });
          setPendingRoll((prev) => (prev?.id === rollId ? null : prev)); setIsAnimatingRoll(false);
          if (computerTurnSequenceIdRef.current !== sequenceId || !committed) return;
          if (computeLegalMoves(committed).length === 0) {
            setToastMessage(`Computer rolled ${d1} and ${d2} — no legal moves.`); await clock.wait(700);
            if (computerTurnSequenceIdRef.current !== sequenceId) return;
            setGame((prev) => prev.winner || prev.currentPlayer !== PLAYER_B ? prev : pushUndoState(prev, endTurn(prev, `Computer rolled ${d1} and ${d2} but has no legal moves. Turn passed.`)));
            setToastMessage(null);
          }
        })().finally(() => {
          if (computerTurnSequenceIdRef.current === sequenceId) computerTurnInFlightRef.current = false;
        });
        return;
      }
      const aiLegalMoves = computeLegalMoves(game);
      const aiMove = aiLegalMoves.length ? chooseComputerMove(game, aiLegalMoves) : null;
      if (aiMove) void performMoveSequence(game, [aiMove]);
    }, computerDelay);
    return () => clock.clearTimeout(timer);
  }, [game, isComputerTurn, isAnimatingMove, isAnyRollAnimationRunning]);

  return {
    game, gamePhase, openingMessage, playerPipCount, computerPipCount, canPlayerRoll, isComputerTurn, isAnimatingMove,
    isAnyRollAnimationRunning, diceAnimKey, pendingRoll, disableUsedDiceStyling, toastMessage, movingChecker,
    activeSelectedSource, destinationSet, movableSourceSet, showMovableSources, moveStepMs: MOVE_STEP_MS,
    pendingPathChoices,
    boardStageRef, pointRefs, barRef, bearOffRefs,
    handleRoll, handleSelectSource, moveToDestination, chooseIntermediatePath, cancelPendingPathChoice, handleUndo, handleNewGame, handleResetPosition, clearSavedGame,
    toggleDebug, updateDebugDie
  };
}
