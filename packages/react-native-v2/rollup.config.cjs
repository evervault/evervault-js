const { defineConfig } = require("rollup");
const glob = require("glob");
const pkgJson = require("./package.json");
const typescript = require("@rollup/plugin-typescript");
const resolve = require("@rollup/plugin-node-resolve");

function platformResolution() {
  return {
    name: "platform-resolution",
    generateBundle(options, bundle) {
      Object.keys(bundle).forEach((fileName) => {
        const file = bundle[fileName];
        if (file.type === "chunk") {
          file.code = file.code
            // Handle require() calls
            .replace(/require\(['"`](.+?)\/index\.js['"`]\)/g, "require('$1')");
        }
      });
    },
  };
}

const input = glob.sync("src/**/*.{ts,tsx}", {
  ignore: ["**/*.test.*", "**/*.d.ts", "__mocks__/**/*"],
});

const external = [
  ...Object.keys(pkgJson.peerDependencies),
  "react/jsx-runtime",
];

module.exports = defineConfig({
  input,
  external,
  output: {
    entryFileNames: "[name].js",
    format: "cjs",
    dir: "build",
    exports: "named",
    sourcemap: true,
    preserveModules: true,
    preserveModulesRoot: "src",
  },
  plugins: [
    resolve(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "./build",
      rootDir: "./src", // Ensure proper mapping
    }),
    platformResolution(),
  ],
});
