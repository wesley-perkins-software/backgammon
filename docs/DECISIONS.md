# Decisions (ADR-lite)

- **Frontend-only implementation**
  - Keep deployment simple and offline-friendly.
  - Avoid backend complexity for a single-device game experience.

- **localStorage-only persistence**
  - Save complete state on each change for instant resume.
  - Use schema version guard to reject incompatible saves safely.

- **Thin bar seam + overlay stacks**
  - Preserve clear board centerline while still showing bar checkers.
  - Improves readability versus a wide opaque bar lane.

- **Dice + move UI strategy**
  - Source-first interaction (pick checker, then destination).
  - Distinct highlight hierarchy for movable/selected/destination.
  - Used dice are visually greyed to reinforce remaining move budget.

- **Intentional non-goals (current scope)**
  - No doubling cube or match-scoring system.
  - No online multiplayer.
  - No advanced analysis engine or exhaustive AI search.
