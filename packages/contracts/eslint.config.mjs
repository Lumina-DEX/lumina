import { builtinModules } from "module"
import path from "path"
import { fileURLToPath } from "url"

import { FlatCompat } from "@eslint/eslintrc"
import jsLint from "@eslint/js"
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort"
import unusedImports from "eslint-plugin-unused-imports"
import globals from "globals"
import tsLint from "typescript-eslint"

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})

export default [
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
      "@typescript-eslint/no-unused-vars": "off",
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
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "no-type-imports", // /!\ Do not change that or the build will break due to decorators stuff.
          fixStyle: "separate-type-imports"
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
  {
    // https://eslint.org/docs/latest/use/configure/ignore
    ignores: [
      // only ignore node_modules in the same directory as the configuration file
      "node_modules",
      // so you have to add `**/` pattern to include nested directories (for example if you use pnpm workspace)
      "**/node_modules"
    ]
  }
]
