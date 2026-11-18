/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { getBrowserDetails } from "../src/ThreeDSecure/browserDetails";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getBrowserDetails", () => {
  it("reads the browser fields for the 3DS server", () => {
    vi.spyOn(window.navigator, "javaEnabled").mockReturnValue(false);
    vi.spyOn(window.navigator, "language", "get").mockReturnValue("en-IE");
    vi.spyOn(window.screen, "colorDepth", "get").mockReturnValue(24);
    vi.spyOn(window.screen, "height", "get").mockReturnValue(900);
    vi.spyOn(window.screen, "width", "get").mockReturnValue(1440);
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-60);

    expect(getBrowserDetails()).toEqual({
      javaEnabled: false,
      javascriptEnabled: true,
      language: "en-IE",
      colorDepth: 24,
      screenHeight: 900,
      screenWidth: 1440,
      timeZone: -60,
    });
  });

  it("uses the key names the backend reads", () => {
    const keys = Object.keys(getBrowserDetails());

    expect(keys).toContain("javascriptEnabled");
    expect(keys).not.toContain("javaScriptEnabled");
  });
});
