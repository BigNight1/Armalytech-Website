import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

export default [
  { ignores: ["dist/**"] },
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2021 },
    },
  },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  // React 17+ automatic JSX runtime (Vite default): no `import React` needed in JSX files.
  pluginReact.configs.flat["jsx-runtime"],
  {
    settings: { react: { version: "detect" } },
    rules: {
      // The project doesn't use the `prop-types` package.
      "react/prop-types": "off",
    },
  },
  {
    // Node-executed config files (CommonJS-style `require()` inside ESM configs,
    // loaded by their respective CLIs via a loader that provides it).
    files: ["tailwind.config.js", "postcss.config.js", "vite.config.js"],
    languageOptions: { globals: globals.node },
  },
  {
    // Vercel serverless functions run in Node, not the browser.
    files: ["api/**/*.js"],
    languageOptions: { globals: globals.node },
  },
];