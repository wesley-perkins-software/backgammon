# Contributing

## Local setup

```bash
npm install
npm run dev
```

Build check before sharing changes:

```bash
npm run build
npm run preview
```

## Scope guardrails

This project separates **rules/state logic** and **UI behavior**:

- Rules/state transitions live in `src/game.js`.
- Rendering/interaction/animation lives in `src/App.jsx` + `src/styles.css`.

For UI-focused contributions, avoid changing rule logic unless explicitly requested. Prefer CSS/class/markup improvements and keep gameplay behavior identical.

## How to make UI changes without changing rules

- Do not modify `computeLegalMoves`, `applyMove`, `rollDice`, `canBearOff`, or related helpers in `src/game.js` for visual tasks.
- If you need new visual states, derive them from existing state fields in `App.jsx`.
- Preserve current interaction semantics:
  - selectable sources,
  - destination highlighting,
  - forced bar entry,
  - dice consumption indicators.

## Suggested manual test checklist

Run through this list in the browser after UI changes:

- **Rolling**: opening roll flow + normal roll flow behaves correctly.
- **Doubles**: doubles create four usable dice and consume correctly.
- **Bar entry**: if player has checker(s) on bar, only bar entry is allowed.
- **Hitting**: moving onto a single opposing checker sends it to bar.
- **Bearing off**: only allowed when all checkers are in home; oversized die behavior works as expected.
- **Undo**: undo restores prior state and can be applied repeatedly.
- **Persistence**: refresh page and confirm state resumes from localStorage.

## Code style notes

- Match existing code style and naming in each file.
- Keep functions small and explicit.
- Prefer existing helpers over introducing new abstractions unless necessary.
- Keep docs and UI text concise and user-facing.
