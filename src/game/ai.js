import {
  applyMoveInternal,
  computeLegalMoves,
  countAt,
  isBlocked,
  maxPlayableMoves,
  moveDirection,
  opponent
} from './engine.js';

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

export function destinationIsVulnerableAfterMove(state, move, player) {
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

export function scoreMove(state, move) {
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

  if (move.to !== 'off' && beforeToCount >= 1) {
    score += 16;
  }
  if (move.from !== 'bar' && beforeFromCount === 2) {
    score -= 14;
  }
  if (destinationIsVulnerableAfterMove(state, move, player)) {
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
