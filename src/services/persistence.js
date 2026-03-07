import { STORAGE_KEY, createInitialState, restoreState, serializeState } from '../game.js';
import * as defaultStorage from '../platform/storage.js';

export function loadGameState(storage = defaultStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();
  return restoreState(raw) ?? createInitialState();
}

export function saveGameState(game, storage = defaultStorage) {
  storage.setItem(STORAGE_KEY, serializeState(game));
}

export function clearSavedGameState(storage = defaultStorage) {
  storage.removeItem(STORAGE_KEY);
}
