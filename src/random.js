const UINT8_MAX = 256;
const DIE_SIDES = 6;
const ACCEPTANCE_LIMIT = UINT8_MAX - (UINT8_MAX % DIE_SIDES);

export function rollDie1to6() {
  const getRandomValues = globalThis.crypto?.getRandomValues;

  if (typeof getRandomValues === 'function') {
    const buffer = new Uint8Array(1);
    while (true) {
      getRandomValues.call(globalThis.crypto, buffer);
      const value = buffer[0];
      if (value < ACCEPTANCE_LIMIT) {
        return (value % DIE_SIDES) + 1;
      }
    }
  }

  return Math.floor(Math.random() * DIE_SIDES) + 1;
}
