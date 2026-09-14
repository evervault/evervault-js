import { defineConfig } from "vite";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

export default defineConfig({
  // Relative so one build works under both the live and pinned version paths.
  base: "./",
});
