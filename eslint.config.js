import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import importPlugin from "eslint-plugin-import";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "18.3" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/jsx-no-target-blank": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/features/auth",
              from: "./src/features",
              except: ["./auth"],
            },
            {
              target: "./src/features/admin",
              from: "./src/features",
              except: ["./admin"],
            },
            {
              target: "./src/features/facilityAuthentication",
              from: "./src/features",
              except: ["./facilityAuthentication"],
            },
            {
              target: "./src/features/pms",
              from: "./src/features",
              except: ["./pms"],
            },
            {
              target: "./src/features/smartlock",
              from: "./src/features",
              except: ["./smartlock"],
            },
            {
              target: "./src/features",
              from: "./src/app",
            },
            {
              target: ["./src/components", "./src/hooks", "./src/utils"],
              from: ["./src/features", "./src/app"],
            },
          ],
        },
      ],
    },
  },
];
