import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./__tests__/e2e/helpers/setup.ts"],
  },
});
