import { describe, expect, it } from 'vitest';
import { analyzePathChoices } from '../movePathChoice.js';

function makeState(points, bar = { A: 0, B: 0 }, bearOff = { A: 0, B: 0 }) {
  return { points, bar, bearOff };
}

function makeOption({ steps, to = 7, resultingPoints, bar, bearOff }) {
  return {
    from: 10,
    to,
    kind: 'chain',
    steps,
    resultingGame: makeState(resultingPoints, bar, bearOff),
    outcomeSignature: JSON.stringify({
      points: resultingPoints,
      bar: bar ?? { A: 0, B: 0 },
      bearOff: bearOff ?? { A: 0, B: 0 },
      to
    }),
    choiceLabel: 'test'
  };
}

describe('move path ambiguity detection', () => {
  it('Case A: prompts when two legal sequences produce different hit outcomes', () => {
    const optionA = makeOption({
      steps: [
        { from: 10, to: 9, dieUsed: 1, hit: true },
        { from: 9, to: 7, dieUsed: 2, hit: false }
      ],
      resultingPoints: Array(24).fill(0).map((_, index) => (index === 7 ? 1 : 0)),
      bar: { A: 0, B: 1 }
    });
    const optionB = makeOption({
      steps: [
        { from: 10, to: 8, dieUsed: 2, hit: true },
        { from: 8, to: 7, dieUsed: 1, hit: false }
      ],
      resultingPoints: Array(24).fill(0).map((_, index) => (index === 7 ? 1 : 0)),
      bar: { A: 0, B: 2 }
    });

    const result = analyzePathChoices([optionA, optionB]);
    expect(result.shouldPrompt).toBe(true);
    expect(result.uniqueOutcomeCount).toBe(2);
    expect(result.promptMessage).toBe('Choose which blot to hit');
  });

  it('Case B: no prompt when both legal paths have no hits and same board outcome', () => {
    const sharedPoints = Array(24).fill(0).map((_, index) => (index === 7 ? 1 : 0));
    const optionA = makeOption({
      steps: [
        { from: 10, to: 9, dieUsed: 1, hit: false },
        { from: 9, to: 7, dieUsed: 2, hit: false }
      ],
      resultingPoints: sharedPoints
    });
    const optionB = makeOption({
      steps: [
        { from: 10, to: 8, dieUsed: 2, hit: false },
        { from: 8, to: 7, dieUsed: 1, hit: false }
      ],
      resultingPoints: sharedPoints
    });

    const result = analyzePathChoices([optionA, optionB]);
    expect(result.shouldPrompt).toBe(false);
    expect(result.uniqueOutcomeCount).toBe(1);
    expect(result.promptMessage).toBeNull();
  });

  it('Case C: no prompt when both legal paths produce same hit outcome', () => {
    const sharedPoints = Array(24).fill(0).map((_, index) => (index === 7 ? 1 : 0));
    const optionA = makeOption({
      steps: [
        { from: 10, to: 9, dieUsed: 1, hit: true },
        { from: 9, to: 7, dieUsed: 2, hit: false }
      ],
      resultingPoints: sharedPoints,
      bar: { A: 0, B: 1 }
    });
    const optionB = makeOption({
      steps: [
        { from: 10, to: 8, dieUsed: 2, hit: false },
        { from: 8, to: 7, dieUsed: 1, hit: true }
      ],
      resultingPoints: sharedPoints,
      bar: { A: 0, B: 1 }
    });

    const result = analyzePathChoices([optionA, optionB]);
    expect(result.shouldPrompt).toBe(false);
    expect(result.uniqueOutcomeCount).toBe(1);
  });
});
