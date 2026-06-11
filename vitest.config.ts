import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The tests cover pure logic (model, store, exporters), so the plain Node
    // environment is enough — no DOM emulation needed. The only browser API the
    // store relies on (localStorage, via zustand/persist) is stubbed in setup.
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
  },
});
