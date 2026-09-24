import type { AgentToolsConfig, AgentToolsFrameConfig } from "types";

export const DEFAULT_AGENT_TOOLS_PRODUCT_NAME = "the secure card form";
const FALLBACK_NAME_PREFIX = "card-form";

// WebMCP tool names are shared with agents verbatim, so keep them to a
// conservative lowercase slug alphabet.
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// WebMCP only honours secure origins in exposedTo.
export function isSecureOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.origin !== origin) return false;
    if (url.protocol === "https:") return true;
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export function resolveAgentToolsConfig(
  config: AgentToolsConfig | undefined,
  appId: string
): AgentToolsFrameConfig | undefined {
  if (!config?.enabled) return undefined;

  const namePrefix =
    slugify(config.namePrefix ?? "") || slugify(appId) || FALLBACK_NAME_PREFIX;

  const productName =
    config.productName?.trim() || DEFAULT_AGENT_TOOLS_PRODUCT_NAME;

  const requested = config.exposeTo ?? [window.location.origin];
  const exposeTo = Array.from(new Set(requested)).filter(isSecureOrigin);

  return { namePrefix, productName, exposeTo };
}
