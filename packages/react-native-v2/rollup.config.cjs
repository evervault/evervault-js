const { defineConfig } = require("rollup");
const pkgJson = require("./package.json");
const typescript = require("@rollup/plugin-typescript");
const nodeResolve = require("@rollup/plugin-node-resolve");

const peerDependencies = Object.keys(pkgJson.peerDependencies);

module.exports = defineConfig([
  // Default CommonJS build
  {
    external: [
      ...peerDependencies, 
      "react/jsx-runtime", 
      'react-native',
      // Externalize React Native internal modules to avoid parsing TypeScript
      /^react-native\/Libraries\/.*/
    ],
    input: "src/index.ts",
    output: {
      file: "build/index.js",
      format: "cjs",
      sourcemap: true,
    },
    plugins: [typescript(), nodeResolve()],
  },
  // // iOS-specific CommonJS build
  // {
  //   external: [
  //     ...peerDependencies, 
  //     "react/jsx-runtime", 
  //     'react-native',
  //     // Externalize React Native internal modules to avoid parsing TypeScript
  //     /^react-native\/Libraries\/.*/
  //   ],
  //   input: "src/index.ios.ts",
  //   output: {
  //     file: "build/index.ios.js",
  //     format: "cjs",
  //     sourcemap: true,
  //   },
  //   plugins: [typescript(), nodeResolve()],
  // },
  // ESM build (for modern bundlers that prefer ESM)
  {
    external: [
      ...peerDependencies, 
      "react/jsx-runtime", 
      'react-native',
      // Externalize React Native internal modules to avoid parsing TypeScript
      /^react-native\/Libraries\/.*/
    ],
    input: "src/index.ts",
    output: {
      file: "build/index.esm.js",
      format: "esm",
    },
    plugins: [typescript(), nodeResolve()],
  }
]);
