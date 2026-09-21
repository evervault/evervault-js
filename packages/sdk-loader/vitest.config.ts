import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    environmentOptions: {
      happyDOM: {
        settings: {
          enableJavaScriptEvaluation: true,
          disableJavaScriptFileLoading: false,
        },
      },
    },
  },
});
