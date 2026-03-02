import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PLAYER_A,
  applyMove,
  computeLegalMoves,
  createInitialState,
  hasLegalMoves
} from '../src/game.js';

function createBearOffScenario() {
  const state = createInitialState();
  state.phase = 'playing';
  state.openingRollPending = false;
  state.currentPlayer = PLAYER_A;
  state.points = Array(24).fill(0);
  state.points[0] = 3;
  state.points[1] = 1;
  state.bar = { A: 0, B: 0 };
  state.bearOff = { A: 11, B: 0 };
  state.dice = { values: [1, 6], remaining: [1, 6] };
  return state;
}

test('higher die bear-off keeps lower die playable when legal', () => {
  const state = createBearOffScenario();

  const openingMoves = computeLegalMoves(state);
  const useSixFromTwoPoint = openingMoves.find((move) => move.from === 1 && move.to === 'off' && move.dieUsed === 6);
  assert.ok(useSixFromTwoPoint, 'expected 6 to bear off from the 2-point');

  const afterSix = applyMove(state, useSixFromTwoPoint);

  assert.deepEqual(afterSix.dice.remaining, [1], 'only the used die should be consumed');
  assert.equal(afterSix.currentPlayer, PLAYER_A, 'turn should continue while a legal die remains');

  const followUpMoves = computeLegalMoves(afterSix);
  assert.ok(
    followUpMoves.some((move) => move.from === 0 && move.to === 'off' && move.dieUsed === 1),
    'die 1 should still bear off from the 1-point'
  );

  assert.equal(hasLegalMoves(afterSix.dice.remaining, afterSix), true, 'hasLegalMoves should detect remaining bear-off move');
});
