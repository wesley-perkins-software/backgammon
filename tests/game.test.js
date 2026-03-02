import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PLAYER_A,
  applyMove,
  applyMoveToState,
  computeLegalMoves,
  createInitialState,
  hasLegalMoves
} from '../src/game.js';

function createBearOffScenario(dice = [6, 1]) {
  const state = createInitialState();
  state.phase = 'playing';
  state.openingRollPending = false;
  state.currentPlayer = PLAYER_A;
  state.points = Array(24).fill(0);
  state.points[0] = 3;
  state.points[1] = 1;
  state.bar = { A: 0, B: 0 };
  state.bearOff = { A: 11, B: 0 };
  state.dice = { values: [...dice], remaining: [...dice] };
  return state;
}

for (const diceOrder of [[6, 1], [1, 6]]) {
  test(`oversize bear-off from 2-point with ${diceOrder.join('-')} keeps die 1 playable`, () => {
    const state = createBearOffScenario(diceOrder);

    const openingMoves = computeLegalMoves(state);
    const useSixFromTwoPoint = openingMoves.find((move) => move.from === 1 && move.to === 'off' && move.dieUsed === 6);
    assert.ok(useSixFromTwoPoint, 'expected 6 to bear off from the 2-point');

    const resolution = applyMove(state, useSixFromTwoPoint);
    assert.equal(resolution.didEndTurn, false, 'turn must stay active while a legal die remains');
    assert.deepEqual(resolution.nextRemainingDice, [1], 'only the used die should be consumed');

    const afterSix = resolution.nextState;
    assert.equal(afterSix.currentPlayer, PLAYER_A, 'turn should continue for same player');
    assert.deepEqual(afterSix.dice.remaining, [1], 'state should retain remaining die 1');

    const followUpMoves = computeLegalMoves(afterSix);
    assert.ok(
      followUpMoves.some((move) => move.from === 0 && move.to === 'off' && move.dieUsed === 1),
      'die 1 should still bear off from the 1-point'
    );
    assert.equal(hasLegalMoves(afterSix.dice.remaining, afterSix, PLAYER_A), true, 'hasLegalMoves should detect remaining legal move');
  });
}

test('applyMoveToState keeps compatibility for full-state consumers', () => {
  const state = createBearOffScenario([6, 1]);
  const useSixFromTwoPoint = computeLegalMoves(state).find((move) => move.from === 1 && move.to === 'off' && move.dieUsed === 6);
  const next = applyMoveToState(state, useSixFromTwoPoint);
  assert.equal(next.currentPlayer, PLAYER_A);
  assert.deepEqual(next.dice.remaining, [1]);
});
