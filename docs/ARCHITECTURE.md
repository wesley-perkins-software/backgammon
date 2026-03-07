# Architecture

## Overview

The app is a client-only React application with one primary stateful component (`App`) and one game logic module (`game.js`). The architecture intentionally keeps deterministic rule logic outside the React component tree.

## Main modules

- `src/main.jsx`
  - Mounts `<App />` under `React.StrictMode`.
- `src/App.jsx`
  - Owns React state (`game`, selection, animation flags, debug panel values).
  - Computes legal moves via `computeLegalMoves(game)` and derives UI affordances (movable sources, destinations).
  - Handles user actions (roll, select source, select destination, undo, reset, clear save).
  - Orchestrates computer turns and move animations.
- `src/game.js`
  - Canonical game rules and state transition functions.
  - Move generation and legality filtering.
  - AI move choice helper.
  - Serialization + restoration and schema validation.

## Data flow and ownership

1. `App` stores the canonical `game` state in React (`useState(loadInitial)`).
2. Any user/computer action calls pure transition helpers in `game.js`.
3. Resulting state is committed with `setGame`, typically wrapped with `pushUndoState`.
4. `App` derives render-time views (`legalMoves`, source/destination maps, pip counts).
5. A `useEffect` writes serialized state to localStorage after each game change.

## Rules vs rendering boundaries

- **Rules/state** (`game.js`):
  - starting position,
  - move generation,
  - bar entry requirements,
  - blocked points/hits,
  - bearing off eligibility,
  - winner detection,
  - undo snapshots,
  - schema-checked restore.
- **UI/rendering** (`App.jsx`, `styles.css`):
  - board layout and checker visuals,
  - highlight classes and interactions,
  - dice display/animation,
  - async timing for opening/computer turns,
  - control buttons and debug panel.

## localStorage strategy

- Storage key: `backgammon.save.v1` (`STORAGE_KEY`).
- Save trigger: every `game` state change (`useEffect` in `App.jsx`).
- Hydration: `loadInitial()` reads localStorage and calls `restoreState(raw)`.
- Fallback: invalid/missing/incompatible saved data returns a fresh initial state.

## State versioning

- Version field is embedded in state (`version`).
- `SCHEMA_VERSION` is currently `1`.
- `restoreState` rejects saves with mismatched version or invalid shape.
- Current strategy is simple hard rejection + reset to default state (no migration layer yet).
