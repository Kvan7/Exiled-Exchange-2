import { defineConfig } from "eslint/config";

import globalsPkg from "globals";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import love from "eslint-config-love";
import { FlatCompat } from "@eslint/eslintrc";

import path from "path";
import { fileURLToPath } from "url";

const { node } = globalsPkg;

export default defineConfig([
  {
    ...love,
    files: ["**/*.js", "**/*.ts"],
  },
  {
    files: ["**/*.js", "**/*.ts"],
    languageOptions: {
      globals: {
        ...node,
      },

      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".vue"],
      },
    },

    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    rules: {
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
      "quote-props": ["error", "consistent-as-needed"],

      "no-labels": [
        "error",
        {
          allowLoop: true,
        },
      ],

      "multiline-ternary": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-plusplus": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/prefer-readonly": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/prefer-reduce-type-parameter": "off",
      "@typescript-eslint/no-invalid-void-type": "off",
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "import/first": "off",
      "import/no-duplicates": "off",
      "func-call-spacing": "off",
      // TODO: refactor IPC and enable
      "@typescript-eslint/consistent-type-assertions": "off",
      // TODO: maybe re-enable
      "@typescript-eslint/no-magic-numbers": "warn",
      "complexity": ["error", 20],
      "@typescript-eslint/prefer-destructuring": "off",
      "promise/avoid-new": "off",
      "no-param-reassign": "off",
      "@typescript-eslint/class-methods-use-this": "off",
      "@typescript-eslint/switch-exhaustiveness-check": "off",
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/require-await": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-private-class-members": "warn",
      "@typescript-eslint/strict-void-return": "warn",
      "@typescript-eslint/no-unsafe-type-assertion": "warn",
      "init-declarations": "off",
      "@typescript-eslint/init-declarations": "off",
      "max-params": "off",
      "@typescript-eslint/max-params": "off",
    },
  },
  {
    files: ["src/main/**/*"],

    languageOptions: {
      globals: {
        ...node,
      },
    },
  },

  // temp until removed...
  {
    files: [
      "src/vision/HeistGemFinder.ts",
      "src/vision/link-worker.ts",
      "src/vision/utils.ts",
      "src/vision/wasm-bindings.ts",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "import/enforce-node-protocol-usage": "off",
      "@typescript-eslint/init-declarations": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "prefer-template": "off",
      "@typescript-eslint/prefer-destructuring": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "no-param-reassign": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "require-atomic-updates": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "@eslint-community/eslint-comments/require-description": "off",
    },
  },
  {
    files: [
      "src/vision/opencv/CppAdapter.ts",
      "src/vision/opencv/JsAdapter.ts",
    ],
    rules: {
      "@typescript-eslint/no-unsafe-type-assertion": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
  {
    files: ["src/vision/**/*.ts"],
    rules: {
      "@typescript-eslint/no-magic-numbers": "off",
    },
  },

  prettierRecommended,
]);
