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
            .replace(/require\(['"`](.+?)\/index\.js['"`]\)/g, "require('$1')")
            // Handle ES6 imports if you use them
            .replace(/from ['"`](.+?)\/index\.js['"`]/g, "from '$1'")
            // Handle dynamic imports
            .replace(/import\(['"`](.+?)\/index\.js['"`]\)/g, "import('$1')");
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
  // Externalize React Native internal modules to avoid parsing Flow
  /^react-native\/Libraries\/.*/,
];

module.exports = defineConfig([
  {
    input,
    external,
    output: {
      dir: "build/cjs",
      format: "cjs",
      exports: "named",
      preserveModules: true,
      preserveModulesRoot: "src",
    },
    plugins: [
      resolve(),
      typescript({
        declaration: false,
        declarationMap: false,
      }),
      platformResolution(),
    ],
  },
  {
    input,
    external,
    output: {
      dir: "build/esm",
      format: "esm",
      exports: "named",
      preserveModules: true,
      preserveModulesRoot: "src",
    },
    plugins: [
      resolve(),
      typescript({
        declaration: true,
        declarationDir: "build/esm",
        declarationMap: false,
      }),
      platformResolution(),
    ],
  },
]);
