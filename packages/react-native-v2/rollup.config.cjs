const { defineConfig } = require("rollup");
const pkgJson = require("./package.json");
const typescript = require("@rollup/plugin-typescript");

const peerDependencies = Object.keys(pkgJson.peerDependencies);

module.exports = defineConfig({
  external: [...peerDependencies, "react/jsx-runtime"],
  input: "src/index.ts",
  output: [
    {
      file: "build/index.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "build/index.esm.js",
      format: "esm",
    },
  ],
  plugins: [typescript()],
});
