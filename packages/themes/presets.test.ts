import { describe, it, expect, vi } from "vitest";
import type { ThemeFunction, ThemeUtilities } from "types";
import { clean } from "./clean";
import { material } from "./material";
import { minimal } from "./minimal";

const presets = { clean, material, minimal };

function apply(theme: ReturnType<typeof clean>, utils: ThemeUtilities) {
  return (theme as ThemeFunction)(utils);
}

function stubUtils(): ThemeUtilities {
  return { extend: vi.fn(() => ({})), media: vi.fn(() => ({})) };
}

describe.each(Object.entries(presets))("%s", (_name, preset) => {
  it("takes a theme extension as its first argument", () => {
    const extension = { styles: { label: { color: "#63e" } } };
    const utils = stubUtils();

    apply(preset(extension), utils);

    expect(utils.extend).toHaveBeenCalledWith(extension);
  });

  it("takes the preset config as its second argument", () => {
    const result = apply(
      preset(undefined, { primary: "#16a34a" }),
      stubUtils()
    );

    expect(
      (result.styles?.[":root"] as Record<string, string>)["--ev-color-primary"]
    ).toBe("#16a34a");
  });
});
