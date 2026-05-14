import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Apostrophes / quotes in JSX text render fine in every modern
      // browser. Forcing entities makes the source unreadable.
      "react/no-unescaped-entities": "off",
      // Next 16's react-compiler rule flags effects that sync React
      // state with external systems (route change, IntersectionObserver,
      // scroll, perf-tier detection). Those are exactly what effects
      // are for — the rule produces false positives in our marketing
      // motion components. Re-enable per-file once the rule matures.
      "react-hooks/set-state-in-effect": "off",
      // Same family — flags reassigning a closed-over value across
      // calls of a memoised function. Pattern is intentional in
      // OntologyGraph (deterministic PRNG seed).
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude session worktrees + IDE leftovers — never lint.
    ".claude/**",
    ".vscode/**",
  ]),
]);

export default eslintConfig;
