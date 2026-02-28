import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYER_A,
  PLAYER_B,
  createInitialState,
  getDefaultPreferences,
  getHigherDieRequirement,
  restoreState,
  rollDice
} from './game.js';

function makePoints(fill = 0) {
  return Array.from({ length: 24 }, () => fill);
}

test('restoreState migrates schema v1 saves to v2 with default preferences', () => {
  const v1State = {
    version: 1,
    points: makePoints(0),
    bar: { A: 0, B: 0 },
    bearOff: { A: 0, B: 0 },
    currentPlayer: PLAYER_A,
    dice: { values: [], remaining: [] },
    winner: null,
    openingRollPending: true,
    undoStack: [],
    statusText: 'Legacy save',
    dev: { debugOpen: false, dieA: 1, dieB: 1 }
  };

  const restored = restoreState(JSON.stringify(v1State));
  assert.ok(restored, 'expected v1 save to restore');
  assert.equal(restored.version, 2);
  assert.deepEqual(restored.preferences, getDefaultPreferences());
});

test('restoreState keeps valid v2 preferences', () => {
  const state = createInitialState();
  const withPreferences = {
    ...state,
    version: 2,
    preferences: {
      animationsEnabled: false,
      animationSpeed: 'fast',
      autoRollPlayer: true,
      showMoveHints: false
    }
  };

  const restored = restoreState(JSON.stringify(withPreferences));
  assert.ok(restored, 'expected v2 save to restore');
  assert.deepEqual(restored.preferences, withPreferences.preferences);
});

test('higher-die requirement is exposed when both dice are playable but only one checker move is allowed', () => {
  const points = makePoints(0);
  points[7] = 1;
  points[0] = -2;
  const state = {
    ...createInitialState(),
    openingRollPending: false,
    points,
    bar: { A: 0, B: 0 },
    currentPlayer: PLAYER_A,
    dice: { values: [2, 5], remaining: [2, 5] }
  };

  const requirement = getHigherDieRequirement(state);
  assert.deepEqual(requirement, { requiredDie: 5, blockedDie: 2 });
});

test('rollDice auto-passes when there are no legal moves after roll', () => {
  const points = makePoints(0);
  points[23] = -2;
  points[22] = -2;

  const state = {
    ...createInitialState(),
    openingRollPending: false,
    points,
    bar: { A: 1, B: 0 },
    currentPlayer: PLAYER_A,
    humanPlayer: PLAYER_A
  };

  const next = rollDice(state, [1, 2]);
  assert.equal(next.currentPlayer, PLAYER_B);
  assert.equal(next.dice.remaining.length, 0);
  assert.match(next.statusText, /Turn auto-passed\./);
});
