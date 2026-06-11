/**
 * Vitest setup, run before every test file.
 *
 * The workflow store uses zustand's persist middleware, which reads and writes
 * `localStorage`. Tests run in a plain Node environment where that global does
 * not exist, so we install a minimal in-memory implementation. Persistence
 * itself is not under test — the stub only keeps the middleware quiet.
 */

const memory = new Map<string, string>();

const localStorageStub: Storage = {
  get length() {
    return memory.size;
  },
  clear: () => {
    memory.clear();
  },
  getItem: (key) => memory.get(key) ?? null,
  key: (index) => [...memory.keys()][index] ?? null,
  removeItem: (key) => {
    memory.delete(key);
  },
  setItem: (key, value) => {
    memory.set(key, String(value));
  },
};

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageStub,
    configurable: true,
  });
}
