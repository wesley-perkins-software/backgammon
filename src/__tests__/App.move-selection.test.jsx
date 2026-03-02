import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { PLAYER_A, STORAGE_KEY, createInitialState, serializeState } from '../game.js';
import { buildPathForMove, performMoveSequence } from '../moveSequence.js';

function seedGame(partial) {
  const state = {
    ...createInitialState(),
    phase: 'playing',
    openingRollPending: false,
    openingRoll: { player: 6, computer: 1, status: 'done' },
    currentPlayer: PLAYER_A,
    dice: { values: [5, 6], remaining: [5, 6] },
    points: Array(24).fill(0),
    bar: { A: 0, B: 0 },
    bearOff: { A: 0, B: 0 },
    undoStack: [],
    statusText: 'Player to move.',
    ...partial
  };
  window.localStorage.setItem(STORAGE_KEY, serializeState(state));
  return state;
}

describe('App move selection', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }));
  });

  it('single-step destination consumes one die and leaves remainder for player choice', async () => {
    seedGame({ points: Object.assign(Array(24).fill(0), { 20: 2, 15: -2 }) });
    render(<App showSeo={false} showHeader={false} />);

    await userEvent.click(screen.getByRole('button', { name: 'Point 21' }));
    const fiveDest = screen.getByRole('button', { name: 'Point 16' });
    const sixDest = screen.getByRole('button', { name: 'Point 15' });
    expect(fiveDest.className).toContain('is-legal');
    expect(sixDest.className).toContain('is-legal');

    await userEvent.click(sixDest);

    await userEvent.click(screen.getByRole('button', { name: 'Point 15' }));
    expect(screen.getByRole('button', { name: 'Point 10' }).className).toContain('is-legal');
  });

  it('supports chain-click destination (+11) and consumes both dice in sequence', async () => {
    seedGame({ points: Object.assign(Array(24).fill(0), { 20: 1, 15: 1, 14: 1, 9: -2, 0: -2 }) });
    render(<App showSeo={false} showHeader={false} />);

    await userEvent.click(screen.getByRole('button', { name: 'Point 21' }));

    const chainedDestination = screen.getByRole('button', { name: 'Point 10' });
    expect(chainedDestination.className).toContain('is-legal');

    await userEvent.click(chainedDestination);

    await waitFor(() => {
      const point10 = screen.getByRole('button', { name: 'Point 10' });
      expect(point10.querySelector('.checker-a')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Point 21' }).querySelector('.checker-a')).toBeFalsy();
    });

    expect(screen.getByText('Computer to move. Roll dice.')).toBeTruthy();
  });
});

describe('move sequence helpers', () => {
  it('buildPathForMove + performMoveSequence run firstMove then secondMove in order', async () => {
    const start = seedGame({ points: Object.assign(Array(24).fill(0), { 20: 1, 15: 1, 14: 1, 9: -2 }), dice: { values: [5, 6], remaining: [5, 6] } });
    const firstMove = { from: 20, to: 15, dieUsed: 5, hit: false };
    const secondMove = { from: 15, to: 9, dieUsed: 6, hit: false };
    const animateSpy = vi.fn(async () => {});
    const applySpy = vi.fn((state, move) => ({ ...state, applied: [...(state.applied ?? []), move], dice: { ...state.dice, remaining: state.dice.remaining.slice(1) } }));

    expect(buildPathForMove(start, firstMove)).toEqual([20, 19, 18, 17, 16, 15]);

    const end = await performMoveSequence(start, [firstMove, secondMove], {
      prefersReducedMotion: false,
      animateSingleMove: animateSpy,
      applyMoveFn: applySpy
    });

    expect(animateSpy.mock.calls.map((call) => call[1])).toEqual([firstMove, secondMove]);
    expect(applySpy.mock.calls.map((call) => call[1])).toEqual([firstMove, secondMove, firstMove, secondMove]);
    expect(end.applied).toEqual([firstMove, secondMove]);
  });

  it('immediate destination click executes only chosenMove and never implicit second move', async () => {
    const start = seedGame({ points: Object.assign(Array(24).fill(0), { 20: 1, 14: 1, 9: -2 }), dice: { values: [5, 6], remaining: [5, 6] } });
    const chosenMove = { from: 20, to: 14, dieUsed: 6, hit: false };
    const applySpy = vi.fn((state, move) => ({ ...state, applied: [...(state.applied ?? []), move], currentPlayer: PLAYER_A }));

    const result = await performMoveSequence(start, [chosenMove], {
      prefersReducedMotion: true,
      applyMoveFn: applySpy
    });

    expect(applySpy).toHaveBeenCalledTimes(1);
    expect(applySpy).toHaveBeenCalledWith(start, chosenMove);
    expect(result.applied).toEqual([chosenMove]);
  });
});
