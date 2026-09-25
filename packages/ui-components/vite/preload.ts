import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import jsdom from "jsdom";
import { ResolvedConfig } from "vite";
import { COMPONENT_ENTRIES } from "../src/utilities/componentEntries";
import { generateIntegrity } from "./integrity";

interface ManifestChunk {
  file: string;
  imports?: string[];
}

type Manifest = Record<string, ManifestChunk>;

function preloadRequestedComponent(
  manifest: Record<string, Record<string, string>>
) {
  const component = new URLSearchParams(location.search).get("component");
  const files = component ? manifest[component] : undefined;
  if (!files) return;

  for (const [href, integrity] of Object.entries(files)) {
    const link = document.createElement("link");
    link.rel = "modulepreload";
    link.href = href;
    link.crossOrigin = "";
    link.integrity = integrity;
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
      } catch (cause) {
        throw new Error(
          `vite-plugin-component-preload: could not read build manifest at ${manifestPath}. Is "build.manifest: true" set?`,
          { cause }
        );
      }

      const indexPath = resolve(outDir, "index.html");
      const parsed = new jsdom.JSDOM(readFileSync(indexPath, "utf-8"));
      const doc = parsed.window.document;

      const staticPreloads = new Set(
        [...doc.querySelectorAll('link[rel="modulepreload"]')].map((link) =>
          link.getAttribute("href")?.replace(/^\//, "")
        )
      );

      const preloadManifest: Record<string, Record<string, string>> = {};
      for (const [component, entryKey] of Object.entries(COMPONENT_ENTRIES)) {
        if (!manifest[entryKey]) {
          throw new Error(
            `vite-plugin-component-preload: no manifest entry for "${entryKey}" (component "${component}"). Has this file moved?`
          );
        }
        preloadManifest[component] = {};
        for (const file of collectChunkFiles(manifest, entryKey)) {
          if (staticPreloads.has(file)) continue;
          preloadManifest[component][`/${file}`] = generateIntegrity(
            readFileSync(resolve(outDir, file))
          );
        }
      }

      const code = `(${preloadRequestedComponent.toString()})(${JSON.stringify(
        preloadManifest
      )});`;
      const fileName = `assets/preload-${createHash("sha256")
        .update(code)
        .digest("hex")
        .slice(0, 8)}.js`;
      writeFileSync(resolve(outDir, fileName), code);

      const script = doc.createElement("script");
      script.setAttribute("src", `/${fileName}`);
      script.setAttribute("crossorigin", "");
      script.setAttribute("integrity", generateIntegrity(Buffer.from(code)));

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
