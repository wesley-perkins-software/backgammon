export function setTimeout(callback, delay) {
  return globalThis.setTimeout(callback, delay);
}

export function clearTimeout(timeoutId) {
  globalThis.clearTimeout(timeoutId);
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
