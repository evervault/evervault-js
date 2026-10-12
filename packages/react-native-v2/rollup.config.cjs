const { defineConfig } = require("rollup");
const glob = require("glob");
const pkgJson = require("./package.json");
const typescript = require("@rollup/plugin-typescript");
const resolve = require("@rollup/plugin-node-resolve");
const ts = require("typescript");
const path = require("path");

const SHARED = path.resolve(__dirname, "../shared/src");

// `shared` ships TypeScript, which the typescript plugin only compiles in `src`.
function sharedSource() {
  return {
    name: "shared-source",
    // `shared` imports its own files without their `.ts` extension.
    resolveId(source, importer) {
      if (!importer?.startsWith(SHARED) || !source.startsWith(".")) return null;

      return `${path.resolve(path.dirname(importer), source)}.ts`;
    },
    transform(code, id) {
      if (!id.startsWith(SHARED)) return null;

      const { outputText, sourceMapText } = ts.transpileModule(code, {
        fileName: id,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ESNext,
          sourceMap: true,
        },
      });

      return { code: outputText, map: sourceMapText };
    },
  };
}

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
      sharedSource(),
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
      sharedSource(),
      typescript({
        declaration: true,
        declarationDir: "build/esm",
        declarationMap: false,
      }),
      platformResolution(),
    ],
  },
]);
