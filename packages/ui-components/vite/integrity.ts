import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import jsdom from "jsdom";
import { ResolvedConfig, Rollup } from "vite";

// custom vite plugin to add integrity attribute to scripts and stylesheets
export function integrity() {
  let outDir = "dist";
  let chunks: string[] = [];

  return {
    name: "vite-plugin-integrity",
    enforce: "post" as const,
    apply: "build" as const,

    configResolved(config: ResolvedConfig) {
      outDir = resolve(config.root, config.build.outDir);
    },

    buildStart() {
      chunks = [];
    },

    generateBundle(_options: unknown, bundle: Rollup.OutputBundle) {
      chunks.push(
        ...Object.values(bundle)
          .filter((output) => output.type === "chunk")
          .map((output) => output.fileName)
      );
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
        "link[rel=stylesheet]"
      );
      for (const link of links) {
        const href = link.getAttribute("href");
        if (href) addIntegrityToNode(link, href);
      }

      const preloads = parsed.window.document.querySelectorAll(
        "link[rel=modulepreload]"
      );
      for (const link of preloads) {
        const href = link.getAttribute("href");
        if (href) addIntegrityToNode(link, href);
      }

      const referenced = new Set(
        [...scripts, ...links].map((node) =>
          (node.getAttribute("src") ?? node.getAttribute("href"))?.replace(
            /^\//,
            ""
          )
        )
      );

      const dynamic: Record<string, string> = {};
      for (const fileName of chunks) {
        if (referenced.has(fileName)) continue;
        dynamic[`/${fileName}`] = generateIntegrity(
          readFileSync(resolve(outDir, fileName))
        );
      }

      parsed.window.document
        .querySelector('script[type="importmap"]')
        ?.remove();

      if (Object.keys(dynamic).length > 0) {
        const map = parsed.window.document.createElement("script");
        map.setAttribute("type", "importmap");
        map.textContent = JSON.stringify({ integrity: dynamic });
        parsed.window.document.head.prepend(map);
      }

      writeFileSync(indexPath, parsed.serialize());
    },
  };
}

function generateIntegrity(code: Buffer) {
  const hash = createHash("sha512");
  hash.update(code);
  return `sha512-${hash.digest("base64")}`;
}
