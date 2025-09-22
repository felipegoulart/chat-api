import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./__tests__/e2e/helpers/setup.ts"],
  },
});
