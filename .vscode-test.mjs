import { defineConfig } from "@vscode/test-cli";

export default defineConfig([
  {
    label: "unit",
    files: "out/test/**/*.test.js",
    version: "stable",
    mocha: {
      ui: "tdd",
      timeout: 20000,
      reporter: "spec",
    },
  },
  {
    label: "integration",
    files: "out/test/**/rooRoutesIntegration.test.js",
    version: "stable",
    mocha: {
      ui: "tdd",
      timeout: 30000,
      reporter: "spec",
    },
  },
  {
    label: "schema",
    files: "out/test/**/schemaValidation.test.js",
    version: "stable",
    mocha: {
      ui: "tdd",
      timeout: 10000,
      reporter: "spec",
    },
  },
]);
