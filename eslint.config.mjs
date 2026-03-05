// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextConfig from "eslint-config-next/core-web-vitals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import hooksPlugin from "eslint-plugin-react-hooks";
import drizzlePlugin from "eslint-plugin-drizzle";

export default defineConfig([
  ...nextConfig,
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "wp-bridge-plugin/**",
    "next-env.d.ts",
  ]),
  {
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": hooksPlugin,
      drizzle: drizzlePlugin,
    },
    rules: {
      // General — disable base rule in favor of @typescript-eslint/no-unused-vars
      "no-unused-vars": "off",
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",

      // TypeScript
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/strict-boolean-expressions": "off",

      // React Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Drizzle
      "drizzle/enforce-delete-with-where": "error",
      "drizzle/enforce-update-with-where": "error",
    },
  },
  {
    files: ["scripts/**/*.ts", "scripts/*.ts"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
