# Turn State Machine

This is a conceptual state machine mapped to current app behavior.

## Core flow

```text
OpeningRoll
  -> TurnStart
  -> Roll
  -> SelectFrom
  -> SelectTo/Move
  -> DiceConsumed
  -> TurnEnd
  -> TurnStart (next player)
```

## Phase notes

- **OpeningRoll**
  - Triggered by initial game state (`openingRollPending = true`).
  - Tie loops back to OpeningRoll.
  - Non-tie sets `currentPlayer`, seeds first `dice.remaining`, exits opening phase.

- **TurnStart**
  - Active player has no remaining dice yet.
  - Waiting for roll (human click) or auto-roll (computer timer).

- **Roll**
  - Dice values + remaining dice populated.
  - If no legal moves exist, transition directly to TurnEnd (pass).

- **SelectFrom** (human) / **ChooseMove** (computer)
  - Source options are constrained to legal moves.
  - If checker(s) on bar, source is forced to bar entry only.

- **SelectTo/Move**
  - Destination chosen and one move applied.
  - App may chain move animation for selected path option.

- **DiceConsumed**
  - Used die removed from `dice.remaining`.
  - Recompute legal moves for same player.
  - If dice remain and legal moves exist, loop back to SelectFrom.

- **TurnEnd**
  - Triggered when dice exhausted or no legal continuation.
  - `currentPlayer` toggles, dice reset to empty, status updated.

## Special cases

- **No legal moves after roll**: automatic pass to next player.
- **Forced bar entry**: blocks all non-bar sources until bar is empty.
- **Winner reached**: state machine effectively halts normal turn progression.
