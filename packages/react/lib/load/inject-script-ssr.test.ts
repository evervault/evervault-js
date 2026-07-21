/**
 * @vitest-environment node
 */

import { describe, it, expect } from "vitest";
import { injectScript } from "./inject-script";
import { ScriptLoadError } from "./error";

describe("injectScript (SSR)", () => {
  it("fails if window is undefined", async () => {
    const promise = injectScript("https://js.evervault.com/v2");
    await expect(promise).rejects.toThrow(
      new ScriptLoadError(
        "window_not_available",
        "Evervault.js is only available in browser environments with a global `window` object."
      )
    );
  });
});
