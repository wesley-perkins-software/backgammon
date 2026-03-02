import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import App from '../App.jsx';
import * as gameModule from '../game.js';
import { PLAYER_A, SCHEMA_VERSION, STORAGE_KEY } from '../game.js';

function setMatchMedia(prefersReducedMotion) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: () => ({
      matches: prefersReducedMotion,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    })
  });
}

function buildSingleClickScenario() {
  const points = Array(24).fill(0);
  points[1] = 1;
  points[0] = 1;

  return {
    version: SCHEMA_VERSION,
    points,
    bar: { A: 0, B: 0 },
    bearOff: { A: 0, B: 0 },
    currentPlayer: PLAYER_A,
    phase: 'playing',
    dice: { values: [6, 1], remaining: [6, 1] },
    winner: null,
    openingRollPending: false,
    openingRoll: { player: 6, computer: 1, status: 'done' },
    undoStack: [],
    statusText: 'Player rolled 6 and 1.',
    dev: { debugOpen: false, dieA: 1, dieB: 1 }
  };
}

function buildChainClickScenario() {
  const points = Array(24).fill(0);
  // Source checker at point 13. Immediate moves: point 8 (+5), point 7 (+6). Chain destination: point 2 (+11).
  points[12] = 1;

  return {
    version: SCHEMA_VERSION,
    points,
    bar: { A: 0, B: 0 },
    bearOff: { A: 0, B: 0 },
    currentPlayer: PLAYER_A,
    phase: 'playing',
    dice: { values: [5, 6], remaining: [5, 6] },
    winner: null,
    openingRollPending: false,
    openingRoll: { player: 6, computer: 1, status: 'done' },
    undoStack: [],
    statusText: 'Player rolled 5 and 6.',
    dev: { debugOpen: false, dieA: 1, dieB: 1 }
  };
}

function seedState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

describe('App move selection', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setMatchMedia(true);
  });

  it('uses one die per click and keeps the turn active when legal moves remain', async () => {
    seedState(buildSingleClickScenario());
    const user = userEvent.setup();
    render(<App showSeo={false} showHeader={false} />);

    const pointTwo = screen.getByRole('button', { name: 'Point 2' });
    const playerBearOff = screen.getByRole('button', { name: 'Player bear off' });

    await user.click(pointTwo);
    await user.click(playerBearOff);

    await waitFor(() => {
      expect(playerBearOff).toHaveTextContent('1');
    });

    const pointOne = screen.getByRole('button', { name: 'Point 1' });
    expect(pointOne).toHaveClass('movable-source');
    expect(playerBearOff).not.toHaveTextContent('2');
    expect(screen.getByRole('button', { name: 'Roll Dice' })).toBeDisabled();
  });

  it('clicking immediate destination runs only the chosen single move', async () => {
    seedState(buildSingleClickScenario());
    const applyMoveSpy = vi.spyOn(gameModule, 'applyMove');
    const user = userEvent.setup();
    render(<App showSeo={false} showHeader={false} />);

    await user.click(screen.getByRole('button', { name: 'Point 2' }));
    await user.click(screen.getByRole('button', { name: 'Player bear off' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Player bear off' })).toHaveTextContent('1');
    });

    expect(applyMoveSpy).toHaveBeenCalledTimes(1);
    expect(applyMoveSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ from: 1, to: 'off', dieUsed: 6 })
    );

    applyMoveSpy.mockRestore();
  });

  it('highlights chained +11 destination and applies both dice in order on click', async () => {
    seedState(buildChainClickScenario());
    const applyMoveSpy = vi.spyOn(gameModule, 'applyMove');
    const user = userEvent.setup();
    render(<App showSeo={false} showHeader={false} />);

    const source = screen.getByRole('button', { name: 'Point 13' });
    const plusFive = screen.getByRole('button', { name: 'Point 8' });
    const plusSix = screen.getByRole('button', { name: 'Point 7' });
    const plusEleven = screen.getByRole('button', { name: 'Point 2' });

    await user.click(source);

    expect(plusFive).toHaveClass('legal');
    expect(plusSix).toHaveClass('legal');
    expect(plusEleven).toHaveClass('legal');

    await user.click(plusEleven);

    await waitFor(() => {
      expect(source.querySelectorAll('.checker-a')).toHaveLength(0);
      expect(plusEleven.querySelectorAll('.checker-a')).toHaveLength(1);
    });

    expect(applyMoveSpy).toHaveBeenCalledTimes(2);
    expect(applyMoveSpy.mock.calls[0][1]).toMatchObject({ from: 12, to: 7, dieUsed: 5 });
    expect(applyMoveSpy.mock.calls[1][1]).toMatchObject({ from: 7, to: 1, dieUsed: 6 });

    // Both dice are consumed for this chain click, so the player can no longer move this turn.
    expect(screen.getByRole('button', { name: 'Roll Dice' })).toBeDisabled();

    applyMoveSpy.mockRestore();
  });

  it('performMoveSequence animates chained moves in order (first move, then second move)', async () => {
    vi.useFakeTimers();
    setMatchMedia(false);
    seedState(buildChainClickScenario());
    const applyMoveSpy = vi.spyOn(gameModule, 'applyMove');
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App showSeo={false} showHeader={false} />);

    await user.click(screen.getByRole('button', { name: 'Point 13' }));
    await user.click(screen.getByRole('button', { name: 'Point 2' }));

    await vi.runAllTimersAsync();

    expect(applyMoveSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(applyMoveSpy.mock.calls[0][1]).toMatchObject({ from: 12, to: 7, dieUsed: 5 });
    expect(applyMoveSpy.mock.calls[1][1]).toMatchObject({ from: 7, to: 1, dieUsed: 6 });

    applyMoveSpy.mockRestore();
    vi.useRealTimers();
  });
});
