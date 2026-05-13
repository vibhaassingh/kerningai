import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` is Next's marker package that throws if imported on
      // the client. In a Vitest node environment we want a no-op.
      "server-only": path.resolve(__dirname, "tests/_stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
      include: ["lib/**/*.ts"],
      exclude: ["lib/three/**", "lib/animations/**"],
    },
  },
});
