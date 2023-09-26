module.exports = {
  extends: [
    "turbo",
    "airbnb-base",
    "eslint:recommended",
    "prettier",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  ignorePatterns: ["dist"],
  env: { browser: true },
  parserOptions: {
    project: "./tsconfig.json",
  },
  settings: {
    "import/extensions": [".js", ".mjs", ".jsx", ".ts", ".tsx", ".d.ts"],
    // Resolve type definition packages
    "import/external-module-folders": ["node_modules", "node_modules/@types"],
    // Apply special parsing for TypeScript files
    "import/parsers": { "@typescript-eslint/parser": [".ts", ".tsx", ".d.ts"] },
    "import/resolver": {
      node: { extensions: [".mjs", ".js", ".json", ".ts", ".d.ts"] },
    },
  },
  rules: {
    "@typescript-eslint/no-explicit-any": ["error", { fixToUnknown: true }],
    "@typescript-eslint/no-shadow": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-use-before-define": ["error", { functions: false }],
    "import/extensions": [
      "error",
      "ignorePackages",
      { ts: "never", js: "never", mjs: "never", jsx: "never", tsx: "never" },
    ],
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: [
          "**/postcss.config.js",
          "**/vite.config.mts",
          "**/test/*",
          "**/*.test.*",
          "**/*.spec.*",
        ],
      },
    ],
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "internal",
          "external",
          "parent",
          "sibling",
          "index",
          "object",
          "type",
        ],
        pathGroups: [{ pattern: "@evervault/**", group: "internal" }],
        distinctGroup: true,
        alphabetize: { order: "asc", caseInsensitive: false },
      },
    ],
    "import/prefer-default-export": "off",
    "linebreak-style": ["error", "unix"],
    "lines-between-class-members": [
      "error",
      "always",
      { exceptAfterSingleLine: true },
    ],
    "no-continue": "off",
    "no-param-reassign": ["error", { props: false }],
    "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
    "no-restricted-syntax": [
      "error",
      {
        selector: "ForInStatement",
        message:
          "for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.",
      },
      {
        selector: "LabeledStatement",
        message:
          "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
      },
      {
        selector: "WithStatement",
        message:
          "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
      },
    ],
    "no-shadow": "off",
    "no-use-before-define": ["error", { functions: false }],
    "no-void": ["error", { allowAsStatement: true }],
  },
  overrides: [
    {
      files: ["*.js", "*.jsx"],
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
      rules: { "@typescript-eslint/no-var-requires": "off" },
    },
    {
      files: ["scaffold.js", "*.spec.*", "*.test.*", "test/*"],
      rules: { "no-console": "off" },
    },
  ],
};
