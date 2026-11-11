import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    env: {
      DB_PATH: ":memory:",
      STUDIO_ROOT: path.resolve(__dirname),
    },
    testTimeout: 20000,
  },
  resolve: { alias: { "@": path.resolve(__dirname) } },
});
