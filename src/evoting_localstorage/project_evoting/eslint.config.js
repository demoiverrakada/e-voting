const js = require("@eslint/js");
const prettier = require("eslint-config-prettier");

module.exports = [
  js.configs.recommended,
  prettier,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        process: "readonly",
        module: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        exports: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Promise: "readonly",
      },
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": "warn",
    },
  },
  {
    ignores: ["node_modules/", "pyvenv.cfg", "*.py", "*.pdf", "*.zip", "*.png", "*.log"],
  },
];
