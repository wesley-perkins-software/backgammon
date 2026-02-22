# Backgammon Local (Frontend Only)

A complete backgammon web app that runs fully in the browser, with Player B controlled by a computer AI.

## Tech
- React + Vite
- No backend
- No external services
- State persisted to `window.localStorage` under `backgammon.save.v1`

## Features
- Standard 24-point board with bar and bear-off trays
- Classic wood-style board visuals with triangular points and styled checker stacks
- Standard starting position
- Dice rolling with doubles handled as 4 moves
- Graphical dice faces with roll animation and remaining-move chips
- Legal move generation with:
  - blocked points (2+ opponent checkers)
  - hitting blots (single checker)
  - mandatory bar entry before other moves
  - bearing off rules including oversized die when no checker behind
  - forced higher die when only one die can be played
- Click-to-play interaction:
  - select source checker stack (or bar)
  - legal destinations highlighted
  - click destination to move
- Computer opponent:
  - Player A is human
  - Player B auto-rolls and auto-plays legal moves using a lightweight heuristic AI
- Turn progression and automatic pass when no legal moves exist after a roll
- Undo stack (serializable, persisted)
- Controls:
  - Roll Dice
  - New Game
  - Undo
  - Reset to Starting Position
  - Clear Saved Game
- Dev/debug panel to set deterministic dice rolls

## Run locally
1. Install dependencies:
```bash
npm install
```
2. Start dev server:
```bash
npm run dev
```
3. Build production bundle:
```bash
npm run build
```
4. Preview production build:
```bash
npm run preview
```

## Test on mobile
1. Start Vite on your LAN so your phone can reach it:
```bash
npm run dev -- --host
```
2. In the terminal output, open the `Network` URL on your phone (same Wi-Fi), for example `http://192.168.x.x:5173`.
3. For quick desktop simulation, open browser dev tools and toggle device emulation (responsive mode).

## Notes
- The app automatically saves after every state change.
- On load, it restores from localStorage when schema version matches; otherwise it safely starts a new game.
