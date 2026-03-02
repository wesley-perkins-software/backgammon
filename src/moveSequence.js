import { applyMove, PLAYER_A } from './game.js';

export function buildPathForMove(stateAtMove, move) {
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

export function applyMoveSequence(stateAtMove, moves, applyMoveFn = applyMove) {
  let next = stateAtMove;
  for (const move of moves) {
    next = applyMoveFn(next, move);
    if (next.currentPlayer !== stateAtMove.currentPlayer || next.winner) {
      break;
    }
  }
  return next;
}

export async function performMoveSequence(stateAtMove, moves, options = {}) {
  const {
    prefersReducedMotion = false,
    animateSingleMove = async () => {},
    applyMoveFn = applyMove
  } = options;

  if (!prefersReducedMotion) {
    let animationState = stateAtMove;
    for (const move of moves) {
      await animateSingleMove(animationState, move);
      animationState = applyMoveFn(animationState, move);
      if (animationState.currentPlayer !== stateAtMove.currentPlayer || animationState.winner) {
        break;
      }
    }
  }

  return applyMoveSequence(stateAtMove, moves, applyMoveFn);
}
