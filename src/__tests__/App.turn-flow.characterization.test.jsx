import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import App from '../App.jsx';
import { STORAGE_KEY } from '../game.js';

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

  it('clear saved game removes STORAGE_KEY from localStorage', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{"seeded":true}');
    const user = userEvent.setup();
    render(<App showSeo={false} showHeader={false} />);

    await user.click(screen.getByRole('button', { name: 'Clear Saved Game' }));

    expect(window.localStorage.getItem(STORAGE_KEY)).not.toEqual('{"seeded":true}');
  });

  it('set dice + roll follows forced dice values in status text', async () => {
    const user = userEvent.setup();
    render(<App showSeo={false} showHeader={false} />);

    await user.click(screen.getByRole('button', { name: 'Toggle debug panel' }));

    const die1Input = screen.getByLabelText('Die 1');
    const die2Input = screen.getByLabelText('Die 2');
    await user.clear(die1Input);
    await user.type(die1Input, '6');
    await user.clear(die2Input);
    await user.type(die2Input, '5');

    await user.click(screen.getByRole('button', { name: 'Set Dice + Roll' }));

    await waitFor(() => {
      expect(screen.getAllByText(/rolled 6 and 5/i).length).toBeGreaterThan(0);
    });
  });
});
