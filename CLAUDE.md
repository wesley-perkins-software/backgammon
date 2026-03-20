# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

Tests use [Vitest](https://vitest.dev/) but it is **not currently in `package.json`**. To run tests, first add it:

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
# Then run:
npx vitest run                        # all tests
npx vitest run src/game/__tests__/    # single directory
npx vitest run src/game/__tests__/ai.test.js  # single file
```

## Architecture

This is a **frontend-only** React + Vite SPA. No backend, no API, no database.

### Core separation

| Layer | Files | Responsibility |
|---|---|---|
| Game logic | `src/game/` (barrel: `src/game.js`) | Pure state transitions, move generation, AI, serialization |
| UI | `src/App.jsx`, `src/components/` | React state, user interaction, animation timing, computer-turn orchestration |
| Persistence | `src/platform/storage.js` | localStorage wrapper; key `backgammon.save.v1` |
| Platform | `src/platform/` | Abstraction layer for clock, RNG, media, storage — enables testing |

### Data flow

1. `App.jsx` holds canonical `game` state via `useState(loadInitial)`.
2. User/computer actions call pure helpers in `src/game/` — never mutate state directly.
3. New state is committed via `setGame`, usually wrapped in `pushUndoState`.
4. A `useEffect` serializes and writes state to localStorage after every change.
5. `App.jsx` derives all render-time values (`legalMoves`, source/destination maps, pip counts) from game state — nothing is stored redundantly.

### Game state shape (key fields)

```js
{
  version: 1,           // schema version — restoreState rejects mismatches
  points: number[24],   // signed counts: >0 = Player A, <0 = Player B
  bar: { A, B },        // captured checkers
  bearOff: { A, B },    // borne-off checkers
  currentPlayer: 'A' | 'B',
  dice: { values, remaining },  // values = display; remaining = action budget
  winner: null | 'A' | 'B',
  openingRollPending: boolean,
  undoStack: GameState[],       // stripped via stripForUndo before save
  statusText: string,
  dev: { debugOpen, dieA, dieB }
}
```

**Critical pitfall**: `dice.values` is for display only. `dice.remaining` is the authoritative move budget — always use `remaining` when computing moves.

### Turn state machine

```
OpeningRoll → TurnStart → Roll → SelectFrom → SelectTo/Move → DiceConsumed → TurnEnd → TurnStart
```

- If no legal moves after roll: automatic pass.
- If `bar[player] > 0`: bar entry is the only legal source.
- Computer turns are triggered by `useEffect` in `App.jsx` after state transitions.

## Key constraints

- **Rules stay in `src/game/`** — UI code (`App.jsx`, components) must not encode game rules.
- **No doubling cube, no online multiplayer, no advanced AI search** — intentionally out of scope.
- `react-router-dom` and `react-helmet-async` are **vendored locally** in `vendor/` — do not replace with npm versions.
- State schema version is `1`. Adding fields to game state requires updating `restoreState` validation in `src/game/statePersistence.js`.

## Docs

`docs/` contains authoritative references:
- `ARCHITECTURE.md` — module responsibilities and data flow
- `DATA_MODEL.md` — full state shape and invariants
- `STATE_MACHINE.md` — turn progression details
- `RULES.md` — backgammon rule implementation notes
- `DECISIONS.md` — design decisions and intentional non-goals
- `ROADMAP.md` — planned future work
