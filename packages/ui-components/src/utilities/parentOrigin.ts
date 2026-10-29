/**
 * The origin of the window that embeds this frame, as reported by the browser.
 * Returns `undefined` when the browser doesn't support `ancestorOrigins` or
 * hides the origin as `"null"`.
 */
export function parentOrigin(): string | undefined {
  const origin = window.location.ancestorOrigins?.[0];
  if (!origin || origin === "null") return undefined;
  return origin;
}

/**
 * Whether a message was sent by the window that embeds this frame. Checks the
 * origin too when the browser reports it.
 */
export function isFromParent(event: MessageEvent): boolean {
  if (event.source !== window.parent) return false;
  const origin = parentOrigin();
  return origin === undefined || event.origin === origin;
}

/**
 * Posts a message to the window that embeds this frame, targeting its origin
 * when the browser reports it.
 */
export function postToParent(message: unknown) {
  window.parent.postMessage(message, parentOrigin() ?? "*");
}
