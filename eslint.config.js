import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      
      // ============================================================================
      // TypeScript Rules (Task 13 - Phase 3: Code Quality)
      // ============================================================================
      
      // Prevent 'any' types - enforce type safety
      "@typescript-eslint/no-explicit-any": "error",
      
      // Require explicit return types on functions
      "@typescript-eslint/explicit-function-return-type": ["warn", {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
      }],
      
      // Require explicit types on module boundaries (exported functions)
      "@typescript-eslint/explicit-module-boundary-types": ["warn", {
        allowArgumentsExplicitlyTypedAsAny: false,
        allowDirectConstAssertionInArrowFunctions: true,
      }],
      
      // Warn on unused variables (but allow underscore prefix for intentionally unused)
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      
      // Require consistent type imports
      "@typescript-eslint/consistent-type-imports": ["warn", {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      }],
      
      // ============================================================================
      // Code Quality Rules (Task 13)
      // ============================================================================
      
      // Prevent console.log in production code (allow warn/error for logging)
      "no-console": ["error", { allow: ["warn", "error"] }],
      
      // Limit function length to improve readability
      "max-lines-per-function": ["warn", {
        max: 50,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      }],
      
      // Prevent debugger statements
      "no-debugger": "error",
      
      // Require consistent return statements
      "consistent-return": "warn",
      
      // Prevent unnecessary boolean casts
      "no-extra-boolean-cast": "error",
      
      // ============================================================================
      // React Hooks Rules (Task 13)
      // ============================================================================
      
      // Enforce exhaustive dependencies in useEffect/useCallback/useMemo
      "react-hooks/exhaustive-deps": "error",
      
      // Enforce rules of hooks
      "react-hooks/rules-of-hooks": "error",
      
      // ============================================================================
      // Best Practices
      // ============================================================================
      
      // Prevent duplicate imports
      "no-duplicate-imports": "error",
      
      // Require === instead of ==
      "eqeqeq": ["error", "always", { null: "ignore" }],
      
      // Prevent reassignment of function parameters
      "no-param-reassign": ["warn", { props: false }],
      
      // Prevent use of var (use const/let)
      "no-var": "error",
      
      // Prefer const over let when possible
      "prefer-const": "warn",
      
      // Prevent nested ternary expressions
      "no-nested-ternary": "warn",
    },
  },
  // Separate config for scripts - more lenient rules
  {
    files: ["scripts/**/*.{ts,js}"],
    rules: {
      "no-console": "off", // Allow console in scripts
      "@typescript-eslint/no-explicit-any": "warn", // Warn instead of error
      "max-lines-per-function": "off", // No limit for scripts
    },
  },
  eslintPluginPrettier,
);
