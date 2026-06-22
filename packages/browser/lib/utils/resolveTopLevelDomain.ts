function stripProtocol(origin: string): string {
  return origin.replace(/https?:\/\//, "");
}

/**
 * Resolves the domain used for Apple Pay merchant validation.
 *
 * Apple Pay (and Safari) validate a merchant session against the *top-level*
 * document's origin — the one in the address bar that the shopper actually
 * sees. When the SDK runs inside a cross-origin iframe (e.g. a PSP-hosted
 * widget embedded in a merchant store), `window.location.origin` is the
 * iframe's own origin, not the top-level page, so the merchant session is
 * issued for the wrong domain and `completeMerchantValidation` is rejected.
 *
 * `window.location.ancestorOrigins` is populated by the browser from the real
 * frame tree and cannot be spoofed by page-level JS, so it is the only
 * trustworthy source for the top-level origin. It is ordered from the
 * immediate parent (index 0) to the top-level document (last index), so the
 * final entry is the address-bar origin regardless of nesting depth.
 *
 * Falls back to the current frame's origin when not embedded, when
 * `ancestorOrigins` is unavailable, or when the top-level origin is opaque
 * (reported as "null", e.g. a sandboxed ancestor) — an opaque origin can never
 * be a registered Apple Pay domain, so we avoid sending "null" downstream.
 */
export default function resolveTopLevelDomain(): string {
  const { ancestorOrigins } = window.location;

  if (ancestorOrigins && ancestorOrigins.length > 0) {
    const topLevelOrigin = ancestorOrigins[ancestorOrigins.length - 1];
    if (topLevelOrigin && topLevelOrigin !== "null") {
      return stripProtocol(topLevelOrigin);
    }
  }

  return stripProtocol(window.location.origin);
}
