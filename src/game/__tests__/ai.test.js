import { describe, expect, it } from 'vitest';
import { AI_STRATEGY_PROFILES, chooseComputerMove } from '../ai.js';
import { PLAYER_A, SCHEMA_VERSION } from '../constants.js';

function createBaseState(remainingDice = [3, 1]) {
  return {
    version: SCHEMA_VERSION,
    points: Array(24).fill(0),
    bar: { A: 0, B: 0 },
    bearOff: { A: 0, B: 0 },
    currentPlayer: PLAYER_A,
    phase: 'playing',
    dice: { values: [...remainingDice], remaining: [...remainingDice] },
    winner: null,
    openingRollPending: false,
    openingRoll: { player: 6, computer: 1, status: 'done' },
    undoStack: [],
    statusText: 'fixture',
    dev: { debugOpen: false, dieA: 1, dieB: 1 }
  };
}

function moveKey(move) {
  return `${move.from}->${move.to}|${move.dieUsed}|${move.hit}`;
}

describe('chooseComputerMove strategy profiles', () => {
  it('keeps the balanced profile as the default strategy', () => {
    const state = createBaseState();
    state.points[5] = 1;
    state.points[4] = 1;
    state.points[2] = -1;

    const legalMoves = [
      { from: 5, to: 2, dieUsed: 3, hit: true },
      { from: 4, to: 1, dieUsed: 3, hit: false },
      { from: 5, to: 4, dieUsed: 1, hit: false }
    ];

    const defaultMove = chooseComputerMove(state, legalMoves);
    const balancedMove = chooseComputerMove(state, legalMoves, 'balanced');

    expect(moveKey(defaultMove)).toBe(moveKey(balancedMove));
  });

  it('matches pre-refactor move choices when using default strategy profile', () => {
    const fixtures = [
      {
        state: (() => {
          const state = createBaseState([3, 1]);
          state.points[5] = 1;
          state.points[4] = 1;
          state.points[2] = -1;
          return state;
        })(),
        legalMoves: [
          { from: 5, to: 2, dieUsed: 3, hit: true },
          { from: 4, to: 1, dieUsed: 3, hit: false },
          { from: 5, to: 4, dieUsed: 1, hit: false }
        ],
        expectedMoveKey: '5->2|3|true'
      },
      {
        state: (() => {
          const state = createBaseState([6, 1]);
          state.points[1] = 1;
          state.points[0] = 1;
          return state;
        })(),
        legalMoves: [
          { from: 1, to: 'off', dieUsed: 6, hit: false },
          { from: 1, to: 0, dieUsed: 1, hit: false },
          { from: 0, to: 'off', dieUsed: 1, hit: false }
        ],
        expectedMoveKey: '1->off|6|false'
      },
      {
        state: (() => {
          const state = createBaseState([4, 2]);
          state.points[10] = 2;
          state.points[6] = 1;
          state.points[8] = -1;
          return state;
        })(),
        legalMoves: [
          { from: 10, to: 8, dieUsed: 2, hit: true },
          { from: 10, to: 6, dieUsed: 4, hit: false },
          { from: 6, to: 2, dieUsed: 4, hit: false }
        ],
        expectedMoveKey: '10->8|2|true'
      }
    ];

    for (const fixture of fixtures) {
      const selected = chooseComputerMove(fixture.state, fixture.legalMoves);
      expect(moveKey(selected)).toBe(fixture.expectedMoveKey);
    }
  });

  it('supports selecting the aggressive profile explicitly', () => {
    expect(AI_STRATEGY_PROFILES.aggressive).toBeDefined();
  });
});
