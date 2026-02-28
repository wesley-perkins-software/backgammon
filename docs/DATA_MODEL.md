# Data Model

This app uses a single serializable game object (see `createInitialState` in `src/game.js`).

## Primary fields

- `version: number`
  - Schema version for save/restore validation.
- `points: number[24]`
  - Signed checker counts per point.
  - `> 0` = Player A count, `< 0` = Player B count, `0` = empty.
- `bar: { A: number, B: number }`
  - Captured checkers waiting to re-enter.
- `bearOff: { A: number, B: number }`
  - Checkers removed from board.
- `currentPlayer: 'A' | 'B'`
  - Side to act.
- `dice: { values: number[], remaining: number[] }`
  - `values` = rolled pair display.
  - `remaining` = consumable die list (including expanded doubles).
- `winner: null | 'A' | 'B'`
- `openingRollPending: boolean`
- `undoStack: GameState[]` (snapshots with nested undo removed before storage)
- `statusText: string`
- `dev: { debugOpen: boolean, dieA: number, dieB: number }`

## Invariants

- `points.length === 24`.
- Point values are integers and bounded by checker totals.
- A side’s active checkers are represented by sign, never mixed ownership on one point.
- If `bar[player] > 0`, legal moves for that player must originate from `bar`.
- `winner` is set when `bearOff.A >= 15` or `bearOff.B >= 15`.
- `dice.remaining` is source of truth for remaining move resources.

## Common pitfalls

- Confusing `dice.values` (display roll) with `dice.remaining` (action budget).
- Editing `points` directly in UI code instead of using transition helpers.
- Forgetting that oversized bear-off is conditional (“no checker behind”).
- Treating undo snapshots as fully recursive (they are intentionally stripped via `stripForUndo`).

## Save/restore validation

`restoreState` rejects malformed or mismatched saves and falls back to default initial state. This keeps persistence robust while using a simple schema gate.
