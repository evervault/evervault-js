import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import jsdom from "jsdom";
import { ResolvedConfig } from "vite";

// custom vite plugin to add integrity attribute to scripts and stylesheets
export function integrity() {
  let outDir = "dist";

  return {
    name: "vite-plugin-integrity",
    enforce: "post" as const,
    apply: "build" as const,

    configResolved(config: ResolvedConfig) {
      outDir = resolve(config.root, config.build.outDir);
    },

    closeBundle() {
      const indexPath = resolve(outDir, "index.html");
      const parsed = new jsdom.JSDOM(readFileSync(indexPath, "utf-8"));

      function addIntegrityToNode(node: Element, src: string) {
        // only add integrity to local scripts
        if (src.startsWith("http")) return;
        const cleaned = src.startsWith("/") ? src.slice(1) : src;

        let code;
        try {
          code = readFileSync(resolve(outDir, cleaned));
        } catch {
          return;
        }

        node.setAttribute("integrity", generateIntegrity(code));
      }

      const scripts = parsed.window.document.querySelectorAll("script");
      for (const script of scripts) {
        const src = script.getAttribute("src");
        if (src) addIntegrityToNode(script, src);
      }

      const links = parsed.window.document.querySelectorAll(
        "link[rel=stylesheet], link[rel=modulepreload]"
      );
      for (const link of links) {
        const href = link.getAttribute("href");
        if (href) addIntegrityToNode(link, href);
      }

      writeFileSync(indexPath, parsed.serialize());
    },
  };
}

export function generateIntegrity(code: Buffer) {
  const hash = createHash("sha512");
  hash.update(code);
  return `sha512-${hash.digest("base64")}`;
}
