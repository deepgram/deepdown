import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import nxPlugin from "@nx/eslint-plugin";

export default defineConfig([
  { ignores: ["**/*.cjs", "**/dist/**", "**/node_modules/**"] },
  { files: ["**/*.{js,mjs,ts}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,ts}"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts}"],
    plugins: { nx: nxPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "nx/enforce-module-boundaries": [
        "error",
        {
          allow: [],
          depConstraints: [
            { 
              sourceTag: "*", 
              onlyDependOnLibsWithTags: ["*"] 
            }
          ]
        }
      ]
    }
  }
]);