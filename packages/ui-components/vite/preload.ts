import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import jsdom from "jsdom";
import { ResolvedConfig } from "vite";
import { COMPONENT_ENTRIES } from "../src/utilities/componentEntries";

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
