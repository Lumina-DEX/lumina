import { builtinModules } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { FlatCompat } from "@eslint/eslintrc"
import jsLint from "@eslint/js"
import oxlint from "eslint-plugin-oxlint"
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort"
import unusedImports from "eslint-plugin-unused-imports"
import { defineConfig } from "eslint/config"
import globals from "globals"
import tsLint from "typescript-eslint"

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})

export default defineConfig([
  // config parsers
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,jsx,tsx}"]
  },
  // config envs
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    }
  },
  // rules
  jsLint.configs.recommended,
  ...tsLint.configs.recommended,
  ...compat.extends("plugin:o1js/recommended"),
  {
    rules: {
      "no-unused-vars": "off",
      "no-constant-condition": "off",
      "prefer-const": "warn",
      "o1js/no-constructor-in-smart-contract": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          "vars": "all",
          "varsIgnorePattern": "^_",
          "args": "after-used",
          "argsIgnorePattern": "^_"
        }
      ]
    }
  },
  ...compat.plugins("o1js"),
  {
    plugins: {
      "simple-import-sort": pluginSimpleImportSort,
      "unused-imports": unusedImports
    },
    rules: {
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            [
              `node:`,
              `^(${builtinModules.join("|")})(/|$)`
            ],
            // style less,scss,css
            ["^.+\\.less$", "^.+\\.s?css$"],
            // Side effect imports.
            ["^\\u0000"],
            ["^@?\\w.*\\u0000$", "^[^.].*\\u0000$", "^\\..*\\u0000$"],
            ["^vue", "^@vue", "^@?\\w", "^\\u0000"],
            ["^@/utils"],
            ["^@/composables"],
            // Parent imports. Put `..` last.
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // Other relative imports. Put same-folder imports and `.` last.
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"]
          ]
        }
      ]
    }
  },

  // Oxlint recommended (disables overlapping ESLint core rules for performance)
  ...oxlint.buildFromOxlintConfigFile(path.join(__dirname, "./.oxlintrc.json")),
  {
    // https://eslint.org/docs/latest/use/configure/ignore
    ignores: [
      // only ignore node_modules in the same directory as the configuration file
      "node_modules",
      "docs",
      "dist",
      "output",
      // so you have to add `**/` pattern to include nested directories (for example if you use pnpm workspace)
      "**/node_modules"
    ]
  }
])
