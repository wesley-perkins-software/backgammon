# UI Interaction Guide

## Interaction model

The board interaction is source-first:

1. User rolls.
2. User selects a legal source checker stack (or bar checker).
3. App highlights legal destinations.
4. User clicks destination to execute move (with animation unless reduced-motion preference is set).

## Highlight hierarchy

Current visual priority is:

1. **Selected source** (dominant blue)
   - `.selected` / `.is-selected`
   - Strong blue inset outline + glow.
2. **Movable sources** (subtle gold)
   - `.checker-movable`
   - Gold ring/glow on top checker.
3. **Legal destinations** (thin gold)
   - `.legal` / `.is-legal`
   - Thin gold inset outline + soft glow.

If a target is both selected and legal, selected styling dominates.

## Dice indicators

- Rolled dice are shown in status and board overlay.
- Used dice are visually dimmed via `.die-used` / `.board-die-used`.
- Doubles are expanded to four visible dice when appropriate, matching remaining usage.

## Bar presentation

- The center bar uses a deliberately thin seam (`.bar-seam`) rather than a wide lane.
- Captured checkers are rendered in an overlay (`.bar-checker-overlay`) on top of that seam.
- Computer stack is anchored from the top (`.barStackTop`), player stack from the bottom (`.barStackBottom`).
- Player’s topmost bar checker is interactive when bar entry is required.

## Mobile-first and controls philosophy

- Layout compresses progressively through media queries (`1080px`, `760px`, `560px`, `420px`).
- Controls remain large tap targets on narrow screens.
- Board geometry, checker sizes, pip boxes, and dice scale down while preserving gameplay clarity.
- Primary actions (roll, source select, destination select) remain the same across viewport sizes.
