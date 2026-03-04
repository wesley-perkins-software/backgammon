const locationKey = (location) => (location === 'bar' || location === 'off' ? location : String(location));

function stateOutcomeHash(state) {
  return JSON.stringify({
    points: state.points,
    bar: state.bar,
    bearOff: state.bearOff,
    currentPlayer: state.currentPlayer,
    winner: state.winner,
    remainingDice: state.dice.remaining
  });
}

function stepSignature(step) {
  return `${locationKey(step.from)}>${locationKey(step.to)}:${step.dieUsed}:${step.hit ? 'h' : '-'}`;
}

function optionOutcomeSignature(option) {
  return JSON.stringify({
    steps: option.steps.map(stepSignature),
    resultingGameHash: option.resultingGameHash
  });
}

export function shouldPromptForPathChoice(options) {
  if (!Array.isArray(options) || options.length <= 1) return false;
  const signatures = new Set(options.map(optionOutcomeSignature));
  return signatures.size > 1;
}

export function buildMoveSequenceOption({ from, to, steps, kind, resultingGame }) {
  return {
    from,
    to,
    kind,
    steps,
    resultingGame,
    resultingGameHash: stateOutcomeHash(resultingGame)
  };
}

export function buildIntermediateChoiceMap(options) {
  const map = new Map();
  for (const option of options) {
    const intermediate = option.steps[0]?.to;
    if (intermediate == null) continue;
    const key = locationKey(intermediate);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(option);
  }
  return map;
}

export function findDeterministicChoice(options) {
  if (!options.length) return null;
  return [...options].sort((a, b) => {
    const aSig = optionOutcomeSignature(a);
    const bSig = optionOutcomeSignature(b);
    return aSig.localeCompare(bSig);
  })[0];
}
