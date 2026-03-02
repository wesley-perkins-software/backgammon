import { rollDie1to6 } from './random.js';

export const STORAGE_KEY = 'backgammon.save.v1';
export const SCHEMA_VERSION = 1;

export const PLAYER_A = 'A';
export const PLAYER_B = 'B';

const HOME_BOARD = {
  A: [0, 5],
  B: [18, 23]
};

const STARTING_POINTS = [
  -2, 0, 0, 0, 0, 5,
  0, 3, 0, 0, 0, -5,
  5, 0, 0, 0, -3, 0,
  -5, 0, 0, 0, 0, 2
];

const MAX_UNDO = 300;

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function opponent(player) {
  return player === PLAYER_A ? PLAYER_B : PLAYER_A;
}

function isPointOwnedBy(points, index, player) {
  const value = points[index];
  return player === PLAYER_A ? value > 0 : value < 0;
}

function isPlayerChecker(value, player) {
  return player === PLAYER_A ? value > 0 : value < 0;
}

function countAt(points, index, player) {
  const value = points[index];
  if (!isPlayerChecker(value, player)) {
    return 0;
  }
  return Math.abs(value);
}

function moveDirection(player) {
  return player === PLAYER_A ? -1 : 1;
}

function entryIndexFromBar(player, die) {
  return player === PLAYER_A ? 24 - die : die - 1;
}

function removeDie(remaining, die) {
  const next = [...remaining];
  const idx = next.indexOf(die);
  if (idx >= 0) {
    next.splice(idx, 1);
  }
  return next;
}

function uniqueDice(remaining) {
  return [...new Set(remaining)];
}

function withStatus(state, statusText) {
  return { ...state, statusText };
}

export function createInitialState() {
  return {
    version: SCHEMA_VERSION,
    points: [...STARTING_POINTS],
    bar: { A: 0, B: 0 },
    bearOff: { A: 0, B: 0 },
    currentPlayer: PLAYER_A,
    dice: { values: [], remaining: [] },
    winner: null,
    openingRollPending: true,
    undoStack: [],
    statusText: 'Roll to determine who goes first.',
    dev: { debugOpen: false, dieA: 1, dieB: 1 }
  };
}

export function isBlocked(points, pointIndex, player) {
  const pointValue = points[pointIndex];
  if (pointValue === 0) {
    return false;
  }
  const opponentHas = player === PLAYER_A ? pointValue < 0 : pointValue > 0;
  return opponentHas && Math.abs(pointValue) >= 2;
}

export function canBearOff(state, player) {
  if (state.bar[player] > 0) {
    return false;
  }
  const [start, end] = HOME_BOARD[player];
  for (let i = 0; i < state.points.length; i += 1) {
    const inHome = i >= start && i <= end;
    if (!inHome && countAt(state.points, i, player) > 0) {
      return false;
    }
  }
  return true;
}

function canUseOversizedBearOff(state, from, die, player) {
  if (player === PLAYER_A) {
    if (die <= from + 1) {
      return false;
    }
    for (let i = from + 1; i <= 5; i += 1) {
      if (countAt(state.points, i, PLAYER_A) > 0) {
        return false;
      }
    }
    return true;
  }

  const exactNeeded = 24 - from;
  if (die <= exactNeeded) {
    return false;
  }
  for (let i = 18; i < from; i += 1) {
    if (countAt(state.points, i, PLAYER_B) > 0) {
      return false;
    }
  }
  return true;
}

function generateBarMoves(state, die, player) {
  if (state.bar[player] <= 0) {
    return [];
  }
  const entry = entryIndexFromBar(player, die);
  if (entry < 0 || entry > 23 || isBlocked(state.points, entry, player)) {
    return [];
  }
  const target = state.points[entry];
  const hit = target !== 0 && !isPointOwnedBy(state.points, entry, player) && Math.abs(target) === 1;
  return [{ from: 'bar', to: entry, dieUsed: die, hit }];
}

function generatePointMoves(state, die, player, fromIndex) {
  const dir = moveDirection(player);
  const targetIndex = fromIndex + dir * die;
  const moves = [];

  if (targetIndex >= 0 && targetIndex <= 23) {
    if (!isBlocked(state.points, targetIndex, player)) {
      const target = state.points[targetIndex];
      const hit = target !== 0 && !isPointOwnedBy(state.points, targetIndex, player) && Math.abs(target) === 1;
      moves.push({ from: fromIndex, to: targetIndex, dieUsed: die, hit });
    }
    return moves;
  }

  if (!canBearOff(state, player)) {
    return moves;
  }

  const [homeStart, homeEnd] = HOME_BOARD[player];
  const inHome = fromIndex >= homeStart && fromIndex <= homeEnd;
  if (!inHome) {
    return moves;
  }

  const exactForA = fromIndex + 1;
  const exactForB = 24 - fromIndex;
  const exactNeeded = player === PLAYER_A ? exactForA : exactForB;

  if (die === exactNeeded || canUseOversizedBearOff(state, fromIndex, die, player)) {
    moves.push({ from: fromIndex, to: 'off', dieUsed: die, hit: false });
  }

  return moves;
}

function generateSingleDieMoves(state, die) {
  const player = state.currentPlayer;

  if (state.bar[player] > 0) {
    return generateBarMoves(state, die, player);
  }

  const moves = [];
  for (let i = 0; i < 24; i += 1) {
    if (countAt(state.points, i, player) > 0) {
      moves.push(...generatePointMoves(state, die, player, i));
    }
  }
  return moves;
}

function applyMoveInternal(state, move) {
  const next = cloneState(state);
  const player = next.currentPlayer;
  const other = opponent(player);

  if (move.from === 'bar') {
    next.bar[player] -= 1;
  } else {
    if (player === PLAYER_A) {
      next.points[move.from] -= 1;
    } else {
      next.points[move.from] += 1;
    }
  }

  if (move.to === 'off') {
    next.bearOff[player] += 1;
  } else {
    const existing = next.points[move.to];
    if (existing !== 0 && !isPointOwnedBy(next.points, move.to, player) && Math.abs(existing) === 1) {
      next.points[move.to] = 0;
      next.bar[other] += 1;
    }
    if (player === PLAYER_A) {
      next.points[move.to] += 1;
    } else {
      next.points[move.to] -= 1;
    }
  }

  next.dice.remaining = removeDie(next.dice.remaining, move.dieUsed);
  next.winner = checkWin(next);

  return next;
}

function exploreMovePaths(state, remainingDice, path = []) {
  if (remainingDice.length === 0) {
    return [path];
  }

  let progressed = false;
  const paths = [];

  for (const die of uniqueDice(remainingDice)) {
    const moves = generateSingleDieMoves({ ...state, dice: { ...state.dice, remaining: remainingDice } }, die);
    if (moves.length === 0) {
      continue;
    }
    progressed = true;

    for (const move of moves) {
      const nextState = applyMoveInternal({ ...state, dice: { ...state.dice, remaining: remainingDice } }, move);
      const nextRemaining = removeDie(remainingDice, die);
      paths.push(...exploreMovePaths(nextState, nextRemaining, [...path, move]));
    }
  }

  if (!progressed) {
    return [path];
  }
  return paths;
}

function dedupeMoves(moves) {
  const seen = new Set();
  const out = [];
  for (const move of moves) {
    const key = `${move.from}->${move.to}|${move.dieUsed}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(move);
    }
  }
  return out;
}

export function computeLegalMoves(state) {
  if (state.winner || state.dice.remaining.length === 0) {
    return [];
  }

  const allPaths = exploreMovePaths(state, state.dice.remaining);
  let maxLen = 0;
  for (const path of allPaths) {
    if (path.length > maxLen) {
      maxLen = path.length;
    }
  }

  if (maxLen === 0) {
    return [];
  }

  let firstMoves = dedupeMoves(
    allPaths
      .filter((path) => path.length === maxLen)
      .map((path) => path[0])
      .filter(Boolean)
  );

  // If both dice are individually playable but only one move can be made, play the higher die.
  const [d1, d2] = state.dice.remaining;
  if (state.dice.remaining.length === 2 && d1 !== d2 && maxLen === 1) {
    const d1Playable = generateSingleDieMoves(state, d1).length > 0;
    const d2Playable = generateSingleDieMoves(state, d2).length > 0;
    if (d1Playable && d2Playable) {
      const higher = Math.max(d1, d2);
      firstMoves = firstMoves.filter((move) => move.dieUsed === higher);
    }
  }

  return firstMoves;
}

function maxPlayableMoves(state) {
  if (state.dice.remaining.length === 0 || state.winner) {
    return 0;
  }
  const paths = exploreMovePaths(state, state.dice.remaining);
  let best = 0;
  for (const path of paths) {
    best = Math.max(best, path.length);
  }
  return best;
}

export function chooseMoveForDestination(state, candidateMoves) {
  if (candidateMoves.length <= 1) {
    return candidateMoves[0] ?? null;
  }

  let best = null;
  let bestFuture = -1;

  for (const move of candidateMoves) {
    const next = applyMoveInternal(state, move);
    const future = maxPlayableMoves(next);
    if (future > bestFuture) {
      bestFuture = future;
      best = move;
      continue;
    }
    if (future === bestFuture && best && move.dieUsed > best.dieUsed) {
      best = move;
    }
  }

  return best;
}

function pointIsVulnerableAfterMove(state, move, player) {
  if (move.to === 'off') {
    return false;
  }

  const dir = moveDirection(player);
  const opponentPlayer = opponent(player);
  const target = move.to;
  const landingCount = countAt(state.points, target, player);
  const landingWillBeSingle = landingCount === 0;
  if (!landingWillBeSingle) {
    return false;
  }

  for (let die = 1; die <= 6; die += 1) {
    const from = target - dir * die;
    if (from < 0 || from > 23) {
      continue;
    }
    if (countAt(state.points, from, opponentPlayer) > 0 && !isBlocked(state.points, target, opponentPlayer)) {
      return true;
    }
  }

  return false;
}

function scoreMove(state, move) {
  const player = state.currentPlayer;
  let score = 0;

  if (move.hit) {
    score += 35;
  }
  if (move.to === 'off') {
    score += 60;
  }

  const beforeToCount = move.to === 'off' ? 0 : countAt(state.points, move.to, player);
  const beforeFromCount = move.from === 'bar' ? 0 : countAt(state.points, move.from, player);

  // Prefer building points over exposing blots.
  if (move.to !== 'off' && beforeToCount >= 1) {
    score += 16;
  }
  if (move.from !== 'bar' && beforeFromCount === 2) {
    score -= 14;
  }
  if (pointIsVulnerableAfterMove(state, move, player)) {
    score -= 10;
  }

  score += move.dieUsed;
  return score;
}

export function chooseComputerMove(state, legalMoves = null) {
  const moves = legalMoves ?? computeLegalMoves(state);
  if (!moves.length) {
    return null;
  }

  let best = moves[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestFuture = -1;

  for (const move of moves) {
    const localScore = scoreMove(state, move);
    const nextState = applyMoveInternal(state, move);
    const future = maxPlayableMoves(nextState);
    const total = localScore + future * 2;

    if (total > bestScore) {
      best = move;
      bestScore = total;
      bestFuture = future;
      continue;
    }

    if (total === bestScore && future > bestFuture) {
      best = move;
      bestFuture = future;
    }
  }

  return best;
}

export function applyMove(state, move) {
  let next = applyMoveInternal(state, move);

  if (next.winner) {
    return withStatus(next, `${playerLabel(next.currentPlayer)} wins.`);
  }

  const remainingLegal = computeLegalMoves(next);
  if (next.dice.remaining.length === 0 || remainingLegal.length === 0) {
    next = endTurn(next);
  }

  return next;
}

export function rollDice(state, forcedValues = null, options = {}) {
  const { autoPassNoMoves = true } = options;
  if (state.winner || state.dice.remaining.length > 0) {
    return state;
  }

  if (state.openingRollPending) {
    const openingRoll = {
      player: forcedValues?.[0] ?? rollDie1to6(),
      computer: forcedValues?.[1] ?? rollDie1to6()
    };

    if (openingRoll.player === openingRoll.computer) {
      return {
        ...cloneState(state),
        dice: { values: [], remaining: [] },
        statusText: `Opening roll tied at ${openingRoll.player}-${openingRoll.computer}. Roll again.`
      };
    }

    const firstTurnDice = [openingRoll.player, openingRoll.computer];
    const [d1, d2] = firstTurnDice;
    const startingPlayer = openingRoll.player > openingRoll.computer ? PLAYER_A : PLAYER_B;
    const startText =
      startingPlayer === PLAYER_A
        ? `You go first with ${openingRoll.player} and ${openingRoll.computer}.`
        : `Computer goes first with ${openingRoll.player} and ${openingRoll.computer}.`;

    const remaining = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];

    return {
      ...cloneState(state),
      currentPlayer: startingPlayer,
      openingRollPending: false,
      dice: {
        values: firstTurnDice,
        remaining
      },
      statusText: startText
    };
  }

  const d1 = forcedValues?.[0] ?? rollDie1to6();
  const d2 = forcedValues?.[1] ?? rollDie1to6();
  const remaining = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];

  let next = {
    ...cloneState(state),
    dice: {
      values: [d1, d2],
      remaining
    },
    statusText: `${playerLabel(state.currentPlayer)} rolled ${d1} and ${d2}.`
  };

  if (computeLegalMoves(next).length === 0) {
    if (autoPassNoMoves) {
      next = endTurn(next, `${playerLabel(state.currentPlayer)} rolled ${d1} and ${d2} but has no legal moves. Turn passed.`);
    } else {
      next = {
        ...next,
        dice: {
          values: [d1, d2],
          remaining: []
        },
        statusText: `${playerLabel(state.currentPlayer)} rolled ${d1} and ${d2} but has no legal moves.`
      };
    }
  }

  return next;
}

export function endTurn(state, statusTextOverride = null) {
  const nextPlayer = opponent(state.currentPlayer);
  return {
    ...cloneState(state),
    currentPlayer: nextPlayer,
    dice: { values: [], remaining: [] },
    statusText: statusTextOverride ?? `${playerLabel(nextPlayer)} to move. Roll dice.`
  };
}

export function checkWin(state) {
  if (state.bearOff.A >= 15) {
    return PLAYER_A;
  }
  if (state.bearOff.B >= 15) {
    return PLAYER_B;
  }
  return null;
}

export function playerLabel(player) {
  return player === PLAYER_A ? 'Player' : 'Computer';
}

export function calculatePipCount(state, player) {
  const pointDistance = state.points.reduce((total, value, index) => {
    if (player === PLAYER_A && value > 0) {
      return total + value * (index + 1);
    }
    if (player === PLAYER_B && value < 0) {
      return total + Math.abs(value) * (24 - index);
    }
    return total;
  }, 0);

  const barDistance = state.bar[player] * 25;
  return pointDistance + barDistance;
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validPointArray(points) {
  return (
    Array.isArray(points) &&
    points.length === 24 &&
    points.every((n) => Number.isInteger(n) && n >= -15 && n <= 15)
  );
}

function stripForUndo(state) {
  const cloned = cloneState(state);
  cloned.undoStack = [];
  return cloned;
}

export function pushUndoState(previousState, nextState) {
  const snapshot = stripForUndo(previousState);
  const stack = [...previousState.undoStack, snapshot].slice(-MAX_UNDO);
  return { ...nextState, undoStack: stack };
}

export function undo(state) {
  if (!state.undoStack.length) {
    return state;
  }
  const prev = state.undoStack[state.undoStack.length - 1];
  return {
    ...cloneState(prev),
    undoStack: state.undoStack.slice(0, -1)
  };
}

export function serializeState(state) {
  return JSON.stringify(state);
}

export function restoreState(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      return null;
    }
    if (parsed.version !== SCHEMA_VERSION) {
      return null;
    }
    if (!validPointArray(parsed.points)) {
      return null;
    }
    if (!isPlainObject(parsed.bar) || !Number.isInteger(parsed.bar.A) || !Number.isInteger(parsed.bar.B)) {
      return null;
    }
    if (!isPlainObject(parsed.bearOff) || !Number.isInteger(parsed.bearOff.A) || !Number.isInteger(parsed.bearOff.B)) {
      return null;
    }
    if (![PLAYER_A, PLAYER_B].includes(parsed.currentPlayer)) {
      return null;
    }
    if (!isPlainObject(parsed.dice) || !Array.isArray(parsed.dice.values) || !Array.isArray(parsed.dice.remaining)) {
      return null;
    }
    if (!Array.isArray(parsed.undoStack)) {
      return null;
    }

    const base = createInitialState();
    return {
      ...base,
      ...parsed,
      openingRollPending: typeof parsed.openingRollPending === 'boolean' ? parsed.openingRollPending : base.openingRollPending,
      statusText: typeof parsed.statusText === 'string' ? parsed.statusText : base.statusText,
      dev: isPlainObject(parsed.dev)
        ? {
            debugOpen: Boolean(parsed.dev.debugOpen),
            dieA: Number.isInteger(parsed.dev.dieA) ? Math.min(6, Math.max(1, parsed.dev.dieA)) : 1,
            dieB: Number.isInteger(parsed.dev.dieB) ? Math.min(6, Math.max(1, parsed.dev.dieB)) : 1
          }
        : base.dev
    };
  } catch {
    return null;
  }
}
