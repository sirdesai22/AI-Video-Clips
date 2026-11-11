import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    env: {
      DB_PATH: ":memory:",
      STUDIO_ROOT: path.resolve(__dirname),
      SETUP_CODE: "TESTCODE",
      SESSION_SECRET: "test-secret-test-secret-test-secret-0000",
    },
    testTimeout: 20000,
  },
  resolve: { alias: { "@": path.resolve(__dirname) } },
});
