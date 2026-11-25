import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/draft-core/src/**/*.test.ts", "lib/content/src/**/*.test.ts", "artifacts/api-server/src/**/*.test.ts"],
  },
});
