import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  use: { baseURL: "http://127.0.0.1:3100", browserName: "chromium", viewport: { width: 1280, height: 800 } },
  webServer: { command: "npm run e2e:serve", url: "http://127.0.0.1:3100/", timeout: 120_000, reuseExistingServer: false },
});
