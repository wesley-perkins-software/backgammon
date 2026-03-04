import { describe, expect, it } from 'vitest';
import { shouldPromptForPathChoice } from '../movePathChoice.js';

function buildOption({ steps, resultingGameHash }) {
  return {
    from: 10,
    to: 7,
    kind: 'chain',
    steps,
    resultingGameHash
  };
}

describe('move path ambiguity detection', () => {
  it('requires prompt when sequences to the same final destination have different hit paths', () => {
    const optionA = buildOption({
      steps: [
        { from: 10, to: 9, dieUsed: 1, hit: true },
        { from: 9, to: 7, dieUsed: 2, hit: false }
      ],
      resultingGameHash: 'hash-after-hit-9'
    });
    const optionB = buildOption({
      steps: [
        { from: 10, to: 8, dieUsed: 2, hit: true },
        { from: 8, to: 7, dieUsed: 1, hit: false }
      ],
      resultingGameHash: 'hash-after-hit-8'
    });

    expect(shouldPromptForPathChoice([optionA, optionB])).toBe(true);
  });

  it('does not prompt when duplicate sequences are outcome-equivalent', () => {
    const optionA = buildOption({
      steps: [
        { from: 10, to: 9, dieUsed: 1, hit: false },
        { from: 9, to: 7, dieUsed: 2, hit: false }
      ],
      resultingGameHash: 'same-hash'
    });
    const optionB = buildOption({
      steps: [
        { from: 10, to: 9, dieUsed: 1, hit: false },
        { from: 9, to: 7, dieUsed: 2, hit: false }
      ],
      resultingGameHash: 'same-hash'
    });

    expect(shouldPromptForPathChoice([optionA, optionB])).toBe(false);
  });
});
