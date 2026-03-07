# Backgammon Local

Backgammon Local is a single-page React + Vite application for playing backgammon in the browser against a built-in computer opponent. The app keeps all rules, turn progression, move generation, and AI move selection on the client, with no API calls or backend services.

The codebase is intentionally compact: `src/game.js` contains core game/state logic, while `src/App.jsx` owns UI composition, user interaction flow, animation timing, and persistence wiring. The app is designed to be easy to hand off and extend safely, especially for UI and UX improvements that should not alter core rules.

## Key constraints

- **Frontend-only**: no server-side code, network API, or database.
- **Persistence uses only `localStorage`** via `STORAGE_KEY = backgammon.save.v1`.
- **No backend contract**: all validation and state transitions happen in browser code.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL (default `http://localhost:5173`).

## Build and preview

```bash
npm run build
npm run preview
```

## High-level folder structure

- `src/main.jsx` — React entry point and app mount.
- `src/App.jsx` — UI layout, interaction handling, animation flow, and computer-turn orchestration.
- `src/game.js` — game rules, legal move computation, turn transitions, undo snapshots, serialization/hydration.
- `src/styles.css` — board visuals, checker/dice styling, highlight system, and responsive/mobile layout rules.
- `docs/` — handoff documentation for architecture, rules, state machine, and roadmap.

## How to play (app summary)

1. Start a new game and use **Roll Dice** to resolve opening roll and normal turns.
2. On your turn, click a highlighted source checker (or your checker on the bar) to select it.
3. Click a highlighted destination to move. If only one legal move path exists, the app resolves it automatically.
4. If you have checkers on the bar, you must re-enter from the bar before moving other checkers.
5. Bear off once all your checkers are in your home board.
6. Use **Undo** to step back one snapshot, or **Reset to Starting Position / Clear Saved Game** for resets.

For rule-level details, see [`docs/RULES.md`](docs/RULES.md).
