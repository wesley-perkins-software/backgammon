export function getItem(key) {
  return globalThis.localStorage.getItem(key);
}

export function setItem(key, value) {
  globalThis.localStorage.setItem(key, value);
}

export function removeItem(key) {
  globalThis.localStorage.removeItem(key);
}
