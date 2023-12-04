import { createHash } from "crypto";
import jsdom from "jsdom";
import { IndexHtmlTransformContext } from "vite";

// custom vite plugin to add integrity attribute to scripts and stylesheets
export function integrity() {
  return {
    name: "vite-plugin-integrity",
    enforce: "post" as const,
    apply: "build" as const,

    transformIndexHtml(html: string, ctx: IndexHtmlTransformContext) {
      const parsed = new jsdom.JSDOM(html);

      function addIntegrityToNode(node: Element, src: string) {
        // only add integrity to local scripts
        if (src.startsWith("http")) return;
        const cleaned = src.startsWith("/") ? src.slice(1) : src;
        const resource = ctx.bundle?.[cleaned] as { code?: string };

        if (!resource?.code) return;
        const hash = generateIntegrity(resource.code);
        node.setAttribute("integrity", hash);
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

      return parsed.serialize();
    },
  };
}

function generateIntegrity(code: string) {
  const hash = createHash("sha512");
  hash.update(code);
  return `sha512-${hash.digest("base64")}`;
}
