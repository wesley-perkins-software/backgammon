import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import App from '../App.jsx';
import { PLAYER_A, SCHEMA_VERSION, STORAGE_KEY } from '../game.js';

function buildSingleClickScenario() {
  const points = Array(24).fill(0);
  // Point 2 and point 1 for player A.
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

describe('App move selection', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSingleClickScenario()));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({
        matches: true,
        media: '',
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      })
    });
  });

  it('uses one die per click and keeps the turn active when legal moves remain', async () => {
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
});
