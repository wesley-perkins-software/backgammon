import {
  applyMoveInternal,
  computeLegalMoves,
  countAt,
  isBlocked,
  maxPlayableMoves,
  moveDirection,
  opponent
} from './engine.js';

export const DEFAULT_AI_WEIGHTS = {
  hitBonus: 35,
  bearOffBonus: 60,
  madePointBonus: 16,
  breakMadePointPenalty: 14,
  vulnerableBlotPenalty: 10,
  dieUsedBonus: 1,
  futureMoveMultiplier: 2
};

export const AI_STRATEGY_PROFILES = {
  balanced: DEFAULT_AI_WEIGHTS,
  aggressive: {
    ...DEFAULT_AI_WEIGHTS,
    hitBonus: 45,
    vulnerableBlotPenalty: 8
  }
};

function resolveAiWeights(strategyConfig = null) {
  if (typeof strategyConfig === 'string') {
    return AI_STRATEGY_PROFILES[strategyConfig] ?? DEFAULT_AI_WEIGHTS;
  }

  if (strategyConfig?.profile && AI_STRATEGY_PROFILES[strategyConfig.profile]) {
    return AI_STRATEGY_PROFILES[strategyConfig.profile];
  }

  if (strategyConfig?.weights) {
    return { ...DEFAULT_AI_WEIGHTS, ...strategyConfig.weights };
  }

  if (strategyConfig) {
    return { ...DEFAULT_AI_WEIGHTS, ...strategyConfig };
  }

  return AI_STRATEGY_PROFILES.balanced;
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

export function scoreMove(state, move, weights = DEFAULT_AI_WEIGHTS) {
  const player = state.currentPlayer;
  let score = 0;

  if (move.hit) {
    score += weights.hitBonus;
  }
  if (move.to === 'off') {
    score += weights.bearOffBonus;
  }

  const beforeToCount = move.to === 'off' ? 0 : countAt(state.points, move.to, player);
  const beforeFromCount = move.from === 'bar' ? 0 : countAt(state.points, move.from, player);

  if (move.to !== 'off' && beforeToCount >= 1) {
    score += weights.madePointBonus;
  }
  if (move.from !== 'bar' && beforeFromCount === 2) {
    score -= weights.breakMadePointPenalty;
  }
  if (destinationIsVulnerableAfterMove(state, move, player)) {
    score -= weights.vulnerableBlotPenalty;
  }

  score += move.dieUsed * weights.dieUsedBonus;
  return score;
}

export function chooseComputerMove(state, legalMoves = null, strategyConfig = null) {
  const moves = legalMoves ?? computeLegalMoves(state);
  if (!moves.length) {
    return null;
  }

  const weights = resolveAiWeights(strategyConfig);

  let best = moves[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestFuture = -1;

  for (const move of moves) {
    const localScore = scoreMove(state, move, weights);
    const nextState = applyMoveInternal(state, move);
    const future = maxPlayableMoves(nextState);
    const total = localScore + future * weights.futureMoveMultiplier;

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
