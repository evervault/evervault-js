import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import jsdom from "jsdom";
import { ResolvedConfig } from "vite";

const COMPONENT_ENTRIES: Record<string, string> = {
  Card: "src/Card/index.tsx",
  Pin: "src/Pin/index.tsx",
  Form: "src/Form/index.tsx",
  ThreeDSecure: "src/ThreeDSecure/index.tsx",
  GooglePay: "src/GooglePay/index.tsx",
  RevealRequest: "src/Reveal/RevealRequest.tsx",
  RevealText: "src/Reveal/RevealText.tsx",
  RevealCopyButton: "src/Reveal/RevealCopyButton.tsx",
};

interface ManifestChunk {
  file: string;
  imports?: string[];
}

type Manifest = Record<string, ManifestChunk>;

function preloadRequestedComponent(manifest: Record<string, string[]>) {
  const component = new URLSearchParams(location.search).get("component");
  const files = component ? manifest[component] : undefined;
  if (!files) return;

  for (const file of files) {
    const link = document.createElement("link");
    link.rel = "modulepreload";
    link.href = `/${file}`;
    document.head.appendChild(link);
  }
}

// Vite's own build manifest already resolves each entry's full chunk import
// graph, so building our preload manifest from it is a plain lookup rather
// than re-deriving that graph from Rollup's internal bundle output.
function collectChunkFiles(manifest: Manifest, entryKey: string): string[] {
  const files = new Set<string>();
  const stack = [entryKey];

  while (stack.length > 0) {
    const key = stack.pop() as string;
    const chunk = manifest[key];
    if (!chunk || files.has(chunk.file)) continue;
    files.add(chunk.file);
    stack.push(...(chunk.imports ?? []));
  }

  return [...files];
}

// The component-specific chunk otherwise only starts fetching once the
// shared entry script has fully downloaded and executed, since that's the
// code that triggers its dynamic import(). That's a real, unavoidable
// sequential network round trip. This plugin injects a tiny inline script
// into index.html, placed before the main entry script, that reads
// ?component= from the URL and issues modulepreload requests for that one
// component's chunk (and its own dependency chunks) immediately, in
// parallel with the entry script rather than after it.
export function componentPreload() {
  let outDir = "dist";

  return {
    name: "vite-plugin-component-preload",
    enforce: "post" as const,
    apply: "build" as const,

    configResolved(config: ResolvedConfig) {
      outDir = resolve(config.root, config.build.outDir);
    },

    closeBundle() {
      const manifestPath = resolve(outDir, ".vite/manifest.json");
      let manifest: Manifest;
      try {
        manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      } catch {
        return;
      }

      const preloadManifest: Record<string, string[]> = {};
      for (const [component, entryKey] of Object.entries(COMPONENT_ENTRIES)) {
        if (!manifest[entryKey]) continue;
        preloadManifest[component] = collectChunkFiles(manifest, entryKey);
      }

      if (Object.keys(preloadManifest).length === 0) return;

      const indexPath = resolve(outDir, "index.html");
      const parsed = new jsdom.JSDOM(readFileSync(indexPath, "utf-8"));
      const doc = parsed.window.document;

      const script = doc.createElement("script");
      script.textContent = `(${preloadRequestedComponent.toString()})(${JSON.stringify(
        preloadManifest
      )});`;

      const mainScript = doc.querySelector('script[type="module"]');
      if (mainScript?.parentNode) {
        mainScript.parentNode.insertBefore(script, mainScript);
      } else {
        doc.head.appendChild(script);
      }

      writeFileSync(indexPath, parsed.serialize());
    },
  };
}
