const locationKey = (location) => (location === 'bar' || location === 'off' ? location : String(location));

function stateOutcomeHash(state) {
  return JSON.stringify({
    points: state.points,
    bar: state.bar,
    bearOff: state.bearOff
  });
}

function hitTargetsForSteps(steps) {
  return steps
    .filter((step) => step.hit)
    .map((step) => locationKey(step.to));
}

function outcomeSignature(option) {
  return JSON.stringify({
    board: stateOutcomeHash(option.resultingGame),
    movedCheckerFinalPosition: locationKey(option.to),
    hitTargets: hitTargetsForSteps(option.steps)
  });
}

function choiceLabel(option) {
  const hitTargets = hitTargetsForSteps(option.steps);
  if (hitTargets.length === 0) return 'No hit';
  if (hitTargets.length === 1) return `Hit blot on point ${Number(hitTargets[0]) + 1}`;
  return `Hit blots on points ${hitTargets.map((point) => Number(point) + 1).join(', ')}`;
}

function firstDie(option) {
  return option.steps[0]?.dieUsed ?? 0;
}

function sortDeterministically(options) {
  return [...options].sort((a, b) => {
    const byHigherFirst = firstDie(b) - firstDie(a);
    if (byHigherFirst !== 0) return byHigherFirst;
    return outcomeSignature(a).localeCompare(outcomeSignature(b));
  });
}

function buildIntermediateChoiceMap(options) {
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

function buildDifferingBlotChoiceMap(options) {
  const map = new Map();
  for (const option of options) {
    const firstStep = option.steps[0];
    if (!firstStep?.hit || typeof firstStep.to !== 'number') continue;
    const key = locationKey(firstStep.to);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(option);
  }
  return map;
}

export function buildMoveSequenceOption({ from, to, steps, kind, resultingGame }) {
  const signature = outcomeSignature({ to, steps, resultingGame });
  return {
    from,
    to,
    kind,
    steps,
    resultingGame,
    outcomeSignature: signature,
    choiceLabel: choiceLabel({ steps })
  };
}

export function analyzePathChoices(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return {
      legalSequenceCount: 0,
      uniqueOutcomeCount: 0,
      shouldPrompt: false,
      promptMessage: null,
      chosenOption: null,
      promptOptions: [],
      intermediateMap: new Map()
    };
  }

  const orderedOptions = sortDeterministically(options);
  const uniqueOutcomeSignatures = new Set(orderedOptions.map((option) => option.outcomeSignature));
  const shouldPrompt = orderedOptions.length > 1 && uniqueOutcomeSignatures.size > 1;

  if (!shouldPrompt) {
    return {
      legalSequenceCount: orderedOptions.length,
      uniqueOutcomeCount: uniqueOutcomeSignatures.size,
      shouldPrompt: false,
      promptMessage: null,
      chosenOption: orderedOptions[0],
      promptOptions: [],
      intermediateMap: new Map()
    };
  }

  const blotMap = buildDifferingBlotChoiceMap(orderedOptions);
  const isBlotChoice = blotMap.size > 1;
  const intermediateMap = isBlotChoice ? blotMap : buildIntermediateChoiceMap(orderedOptions);
  const promptOptions = orderedOptions.map((option, index) => ({
    id: index,
    label: option.choiceLabel,
    option
  }));

  return {
    legalSequenceCount: orderedOptions.length,
    uniqueOutcomeCount: uniqueOutcomeSignatures.size,
    shouldPrompt: true,
    promptMessage: isBlotChoice ? 'Choose which blot to hit' : 'Choose the intermediate step',
    chosenOption: null,
    promptOptions,
    intermediateMap
  };
}

export function findDeterministicChoice(options) {
  if (!options.length) return null;
  return sortDeterministically(options)[0];
}
