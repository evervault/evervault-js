import { describe, expect, it, vi } from "vitest";
import { ELEMENTS, warnUnknownChild } from "../lib/ui/elements/spec";

describe("warnUnknownChild", () => {
  it("warns naming the element and returns null", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const element = document.createElement("ev-card-holder");

    expect(warnUnknownChild(element)).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("<ev-card-holder>")
    );

    warn.mockRestore();
  });

  it("lists the supported children in the warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    warnUnknownChild(document.createElement("div"));

    const [message] = warn.mock.calls[0];
    for (const tag of Object.keys(ELEMENTS)) {
      expect(message).toContain(`<${tag}>`);
    }

    warn.mockRestore();
  });
});
