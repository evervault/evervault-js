import { defineConfig } from "vite";

// Minimal config to allow the localhost.run tunnel host used for local
// Apple Pay testing (the app is served on :4000 behind the stable tunnel).
export default defineConfig({
  server: {
    host: true,
    port: 4000,
    allowedHosts: [".lhr.life"],
  },
});
