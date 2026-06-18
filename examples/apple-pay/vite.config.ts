import { defineConfig } from "vite";

// Local Apple Pay testing via localhost.run:
// - basic-ssl removed: it makes vite serve HTTPS locally, which breaks the
//   localhost.run tunnel (the tunnel does TLS termination and forwards plain
//   HTTP to localhost:4000).
// - host:true so the IPv4 tunnel can reach it; allow the *.lhr.life host.
export default defineConfig({
  server: {
    host: true,
    port: 4000,
    allowedHosts: [".lhr.life"],
  },
});
