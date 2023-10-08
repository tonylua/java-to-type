module.exports = {
  root: true,
  env: {browser: true, es2021: true, commonjs: true},
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {jsx: true},
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "import", "prettier"],
  rules: {
    "max-len": ["error", {code: 80, ignoreRegExpLiterals: true, ignoreComments: true}],
  },
};
