import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // The store and rate limiter are module-level singletons. Running files in
    // separate forks keeps their state from leaking between test files.
    pool: "forks",
    reporters: ["default"],
  },
});