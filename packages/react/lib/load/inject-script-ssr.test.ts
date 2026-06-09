/**
 * @vitest-environment node
 */

import { injectScript } from "./inject-script";

describe("injectScript (SSR)", () => {
  it("fails if window is undefined", async () => {
    const promise = injectScript();
    await expect(promise).rejects.toThrow("Evervault.js not available");
  });
});
