import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import App from '../App.jsx';
import { PLAYER_A, PLAYER_B, SCHEMA_VERSION, STORAGE_KEY } from '../game.js';

function seedFinishedGame(winner) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: SCHEMA_VERSION,
    points: Array(24).fill(0),
    bar: { A: 0, B: 0 },
    bearOff: winner === PLAYER_A ? { A: 15, B: 8 } : { A: 9, B: 15 },
    currentPlayer: PLAYER_A,
    phase: 'playing',
    dice: { values: [3, 2], remaining: [] },
    winner,
    openingRollPending: false,
    openingRoll: { player: 6, computer: 1, status: 'done' },
    undoStack: [],
    statusText: winner === PLAYER_A ? 'Player wins.' : 'Computer wins.',
    dev: { debugOpen: false, dieA: 6, dieB: 5 }
  }));
}

describe('App end-of-game overlay', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows winner overlay and lets players review the final board', async () => {
    seedFinishedGame(PLAYER_A);
    const user = userEvent.setup();

    render(<App showSeo={false} showHeader={false} />);

    expect(screen.getByRole('heading', { name: 'You win!' })).toBeInTheDocument();
    expect(screen.getByText('You bore off all 15 checkers first.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Review Board' }));

    expect(screen.queryByRole('heading', { name: 'You win!' })).not.toBeInTheDocument();
    expect(screen.getByText('Player wins.')).toBeInTheDocument();
  });

  it('starts a fresh game from the overlay primary action', async () => {
    seedFinishedGame(PLAYER_B);
    const user = userEvent.setup();

    render(<App showSeo={false} showHeader={false} />);

    expect(screen.getByRole('heading', { name: 'Computer wins' })).toBeInTheDocument();
    expect(screen.getByText('The computer bore off all 15 checkers first.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play Again' }));

    expect(screen.queryByRole('heading', { name: 'Computer wins' })).not.toBeInTheDocument();
    expect(screen.getByText('Opening roll — highest die goes first.')).toBeInTheDocument();
  });
});
