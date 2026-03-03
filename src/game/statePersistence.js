import { PLAYER_A, PLAYER_B, SCHEMA_VERSION, STORAGE_KEY } from './constants.js';

export { STORAGE_KEY, SCHEMA_VERSION };
import { createInitialState } from './engine.js';

export function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validPointArray(points) {
  return (
    Array.isArray(points) &&
    points.length === 24 &&
    points.every((n) => Number.isInteger(n) && n >= -15 && n <= 15)
  );
}

export function serializeState(state) {
  return JSON.stringify(state);
}

export function restoreState(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      return null;
    }
    if (parsed.version !== SCHEMA_VERSION) {
      return null;
    }
    if (!validPointArray(parsed.points)) {
      return null;
    }
    if (!isPlainObject(parsed.bar) || !Number.isInteger(parsed.bar.A) || !Number.isInteger(parsed.bar.B)) {
      return null;
    }
    if (!isPlainObject(parsed.bearOff) || !Number.isInteger(parsed.bearOff.A) || !Number.isInteger(parsed.bearOff.B)) {
      return null;
    }
    if (![PLAYER_A, PLAYER_B].includes(parsed.currentPlayer)) {
      return null;
    }
    if (!isPlainObject(parsed.dice) || !Array.isArray(parsed.dice.values) || !Array.isArray(parsed.dice.remaining)) {
      return null;
    }
    if (!Array.isArray(parsed.undoStack)) {
      return null;
    }

    const base = createInitialState();
    const normalizedPhase = parsed.phase === 'playing' || parsed.phase === 'opening'
      ? parsed.phase
      : (parsed.openingRollPending === false ? 'playing' : 'opening');
    const parsedOpeningRoll = isPlainObject(parsed.openingRoll) ? parsed.openingRoll : {};
    return {
      ...base,
      ...parsed,
      phase: normalizedPhase,
      openingRollPending: normalizedPhase === 'opening',
      openingRoll: {
        player: Number.isInteger(parsedOpeningRoll.player) ? Math.min(6, Math.max(1, parsedOpeningRoll.player)) : null,
        computer: Number.isInteger(parsedOpeningRoll.computer) ? Math.min(6, Math.max(1, parsedOpeningRoll.computer)) : null,
        status: ['idle', 'rolling', 'tie', 'done'].includes(parsedOpeningRoll.status) ? parsedOpeningRoll.status : base.openingRoll.status
      },
      statusText: typeof parsed.statusText === 'string' ? parsed.statusText : base.statusText,
      dev: isPlainObject(parsed.dev)
        ? {
            debugOpen: Boolean(parsed.dev.debugOpen),
            dieA: Number.isInteger(parsed.dev.dieA) ? Math.min(6, Math.max(1, parsed.dev.dieA)) : 1,
            dieB: Number.isInteger(parsed.dev.dieB) ? Math.min(6, Math.max(1, parsed.dev.dieB)) : 1
          }
        : base.dev
    };
  } catch {
    return null;
  }
}
