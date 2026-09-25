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

// WebMCP only honours secure origins in exposedTo. Accepts a bare trailing
// slash, since browsers append one to a pasted origin, but rejects anything
// with a real path, query or fragment. Returns the canonical origin.
export function toSecureOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.pathname !== "/" || url.search || url.hash) return null;
    if (url.username || url.password) return null;

    const secure =
      url.protocol === "https:" ||
      (url.protocol === "http:" &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1"));

    return secure ? url.origin : null;
  } catch {
    return null;
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
  const exposeTo = Array.from(
    new Set(
      requested
        .map(toSecureOrigin)
        .filter((origin): origin is string => origin !== null)
    )
  );

  if (exposeTo.length === 0) {
    console.warn(
      `agentTools.exposeTo contains no secure origins (${requested.join(
        ", "
      )}); the tools will be registered but no page will be able to discover them.`
    );
  }

  return { namePrefix, productName, exposeTo };
}
