import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "es",
  },
  plugins: [
    typescript(),
    replace({
      preventAssignment: true,
      values: {
        "process.env.VITE_KEYS_URL": JSON.stringify(process.env.VITE_KEYS_URL),
      },
    }),
  ],
};
