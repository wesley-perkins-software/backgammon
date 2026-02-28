# Rules Implemented in This App

This document reflects the currently implemented behavior in `src/game.js`.

## Players and board model

- `PLAYER_A` is the human player (`Player` in UI).
- `PLAYER_B` is the computer opponent (`Computer` in UI).
- Board uses 24 points indexed `0..23` with signed checker counts:
  - positive = Player A,
  - negative = Player B.

## Opening roll

- Game starts in `openingRollPending` mode.
- Each side rolls one die.
- On tie: no move starts; opening roll repeats.
- Higher die becomes starting player; those two dice become the first turn's usable dice.

## Rolling and doubles

- Normal turn roll yields two dice.
- If dice are equal (doubles), `dice.remaining` becomes four entries of that value.
- Dice are consumed one move at a time by matching `dieUsed`.

## Legal move generation behavior

The app searches move paths over remaining dice and enforces “maximum playable moves” behavior:

- It computes all reachable move paths with the current dice.
- It allows only first moves that belong to longest achievable paths.
- Special case: with two different dice where only one checker move is possible, if each die is individually playable, the higher die must be used.

## Forced bar entry

- If current player has any checker on bar (`bar[player] > 0`), only bar-entry moves are generated.
- Entry point is determined by die and player direction.
- Entry is illegal if destination point is blocked by 2+ opponent checkers.

## Hitting

- Landing on an opponent blot (single checker) is allowed.
- Hit behavior:
  - destination point is cleared,
  - opponent bar count increments,
  - moving checker occupies that point.

## Bearing off

Bearing off is allowed only when:

1. Current player has no checkers on the bar.
2. All of that player's in-play checkers are inside their home board.

Exact bear-off logic:

- Exact die usage bears off from matching distance-to-exit.
- Oversized die can bear off from a lower point only when no checker exists on a point farther from the exit (i.e., “no checker behind” rule).

## Turn end and no-legal-move handling

- After each move, if no dice remain or no additional legal move exists, turn ends automatically.
- Immediately after a roll, if no legal moves exist, turn is passed automatically.

## Win condition

- First side to bear off 15 checkers wins.

## Not implemented

- Doubling cube / stakes.
- Match play (multi-game scoring, Crawford, gammon/backgammon scoring variants).
- Online multiplayer/network sync.
- Full legal-rules variants configuration.

## Assumptions / confirm-in-code pointers

If behavior ever looks inconsistent, verify these functions in `src/game.js`:

- `computeLegalMoves`
- `generateSingleDieMoves`
- `canBearOff`
- `canUseOversizedBearOff`
- `applyMove`
