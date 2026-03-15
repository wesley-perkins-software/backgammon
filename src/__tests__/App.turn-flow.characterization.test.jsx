import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import App from '../App.jsx';
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

describe('App turn-flow characterization', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setMatchMedia(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function seedNoMovesOnRollScenario() {
    const points = Array(24).fill(0);
    points[18] = -2;
    points[19] = -2;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: SCHEMA_VERSION,
      points,
      bar: { A: 1, B: 0 },
      bearOff: { A: 0, B: 0 },
      currentPlayer: PLAYER_A,
      phase: 'playing',
      dice: { values: [], remaining: [] },
      winner: null,
      openingRollPending: false,
      openingRoll: { player: 6, computer: 1, status: 'done' },
      undoStack: [],
      statusText: 'Your turn. Roll the dice.',
      dev: { debugOpen: false, dieA: 6, dieB: 5 }
    }));
  }


  it('set dice + roll follows forced dice values in status text', async () => {
    const user = userEvent.setup();
    const random = {
      rollDie1to6: vi
        .fn()
        .mockReturnValueOnce(6)
        .mockReturnValueOnce(5)
    };

    render(<App showSeo={false} showHeader={false} adapters={{ random }} />);

    await user.click(screen.getByRole('button', { name: 'Roll Dice' }));

    await waitFor(() => {
      expect(screen.getAllByText(/rolled 6 and 5/i).length).toBeGreaterThan(0);
    });
  });

  it('shows a no-moves notice pause before passing turn to the computer', async () => {
    vi.useFakeTimers();
    seedNoMovesOnRollScenario();

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const random = {
      rollDie1to6: vi
        .fn()
        .mockReturnValueOnce(6)
        .mockReturnValueOnce(5)
    };

    render(<App showSeo={false} showHeader={false} adapters={{ random }} />);

    await user.click(screen.getByRole('button', { name: 'Roll Dice' }));

    await vi.advanceTimersByTimeAsync(1000);

    expect(screen.getAllByText(/You rolled 6 and 5\. You have no legal moves\. Turn passes to the computer\./i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Roll Dice' })).toBeDisabled();
    expect(screen.queryByText(/Computer rolled/i)).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(2400);
    expect(screen.getAllByText(/No legal moves\./i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Computer rolled/i)).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(99);
    expect(screen.getAllByText(/No legal moves\./i).length).toBeGreaterThan(0);

    await vi.advanceTimersByTimeAsync(1);
    expect(screen.getByText(/Computer's turn\. Rolling dice\.\.\./i)).toBeInTheDocument();
  });
});
