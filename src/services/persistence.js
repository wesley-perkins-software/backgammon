import { STORAGE_KEY, createInitialState, restoreState, serializeState } from '../game.js';

export function loadGameState() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();
  return restoreState(raw) ?? createInitialState();
}

export function saveGameState(game) {
  window.localStorage.setItem(STORAGE_KEY, serializeState(game));
}

export function clearSavedGameState() {
  window.localStorage.removeItem(STORAGE_KEY);
}
