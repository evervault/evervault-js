import jsdom from "jsdom";
import { createHash } from "crypto";

// custom vite plugin to add integrity attribute to scripts and stylesheets
export function integrity() {
  return {
    name: "vite-plugin-integrity",
    enforce: "post" as const,
    apply: "build" as const,

    async transformIndexHtml(html, ctx) {
      const parsed = new jsdom.JSDOM(html);

      async function addIntegrityToNode(node: jsdom.Node, src: string) {
        // only add integrity to local scripts
        if (src.startsWith("http")) return;
        src = src.startsWith("/") ? src.slice(1) : src;
        const resource = ctx.bundle[src];
        const code = resource?.code || resource?.source;
        const integrity = await generateIntegrity(code);
        node.setAttribute("integrity", integrity);
      }

      const scripts = parsed.window.document.querySelectorAll("script");
      for (const script of scripts) {
        const src = script.getAttribute("src");
        await addIntegrityToNode(script, src);
      }

      const links = parsed.window.document.querySelectorAll(
        "link[rel=stylesheet]"
      );
      for (const link of links) {
        const href = link.getAttribute("href");
        await addIntegrityToNode(link, href);
      }

      return parsed.serialize();
    },
  };
}

async function generateIntegrity(code: string) {
  const hash = createHash("sha512");
  hash.update(code);
  return `sha512-${hash.digest("base64")}`;
}
