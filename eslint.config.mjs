import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "warn",
      "no-unreachable": "error",
      "import/no-cycle": "error",
    },
  },

  {
    files: ["scripts/**/*.{ts,tsx,js,mjs}"],
    rules: {
      "no-console": "off",
    },
  },

  {
    files: [
      "src/infrastructure/**/seed.{ts,tsx,js,mjs}",
      "src/infrastructure/**/*seed*.{ts,tsx,js,mjs}",
    ],
    rules: {
      "no-console": "off",
    },
  },

  {
    files: ["src/interface/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/infrastructure/*"],
        },
      ],
    },
  },

  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/application/*",
            "@/interface/*",
            "@/infrastructure/*",
          ],
        },
      ],
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;