#!/usr/bin/env node
/**
 * Guard: heavy visual/client libraries must never enter the portal /
 * admin-shell bundle boundary. They belong to marketing/visual routes
 * only. Fails CI if a forbidden import appears under a portal path.
 *
 * Run: pnpm check:portal-bundle
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = [
  "app/portal",
  "components/portal",
  "components/chrome/portal",
  "lib/portal",
];

// Bundle-heavy packages that must stay out of authenticated portal code.
const FORBIDDEN = [
  "three",
  "@react-three/fiber",
  "@react-three/drei",
  "framer-motion",
  "motion/react",
  "gsap",
  "lenis",
  "@xyflow/react",
];

const importRe = (pkg) =>
  new RegExp(
    `(?:import[^;]*?from\\s*|require\\(\\s*)['"]${pkg.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    )}(?:/[^'"]*)?['"]`,
  );

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // path may not exist in every checkout
  }
  for (const name of entries) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

const violations = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = readFileSync(file, "utf8");
    for (const pkg of FORBIDDEN) {
      if (importRe(pkg).test(src)) {
        violations.push({ file, pkg });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    "\n✖ Heavy libraries are not allowed in portal bundles:\n",
  );
  for (const v of violations) {
    console.error(`  ${v.file}  →  imports "${v.pkg}"`);
  }
  console.error(
    "\nMove the import out of the portal boundary or load it via a " +
      "dynamic import on a non-portal route.\n",
  );
  process.exit(1);
}

console.log("✓ portal bundle clean — no heavy library imports.");
