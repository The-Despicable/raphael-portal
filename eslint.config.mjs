import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // CommonJS node-side tooling in scripts/. These are standalone Node
    // scripts (schema validation, diagnostics), not application code, so the
    // app's TypeScript/browser rules do not apply to them.
    "scripts/**/*.cjs",
    "scripts/**/*.mjs",
  ]),
]);

export default eslintConfig;
