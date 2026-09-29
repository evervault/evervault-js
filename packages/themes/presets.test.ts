// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import type { ThemeFunction, ThemeUtilities } from "types";
import { cssVar } from "./cssVar";
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

function rootOf(result: ReturnType<ThemeFunction>) {
  return result.styles?.[":root"] as Record<string, string> | undefined;
}

describe.each(Object.entries(presets))("%s", (_name, preset) => {
  it("takes a theme extension as its first argument", () => {
    const extension = { styles: { label: { color: "#63e" } } };
    const utils = stubUtils();

    apply(preset(extension), utils);

    expect(utils.extend).toHaveBeenCalledWith(extension);
  });

  it("takes the preset config as its only argument", () => {
    const utils = stubUtils();
    const result = apply(preset({ primary: "#16a34a" }), utils);

    expect(
      (result.styles?.[":root"] as Record<string, string>)["--ev-color-primary"]
    ).toBe("#16a34a");
    expect(utils.extend).not.toHaveBeenCalled();
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

  it("adds no semantic variables when called with no arguments", () => {
    const root = rootOf(apply(preset(), stubUtils())) ?? {};

    expect(Object.keys(root).filter((k) => k.startsWith("--ev-"))).toEqual([]);
  });

  it("takes only `selectors` as the config", () => {
    const result = apply(
      preset({ selectors: { label: { fontWeight: 600 } } }),
      stubUtils()
    );

    expect(result.styles?.label).toEqual({ fontWeight: 600 });
  });

  it("takes semantic values and `selectors` together", () => {
    const result = apply(
      preset({
        primary: "#16a34a",
        selectors: { label: { fontWeight: 600 } },
      }),
      stubUtils()
    );

    expect(rootOf(result)?.["--ev-color-primary"]).toBe("#16a34a");
    expect(result.styles?.label).toEqual({ fontWeight: 600 });
  });

  it("takes a theme extension and semantic values together", () => {
    const extension = { styles: { label: { color: "#63e" } } };
    const utils = stubUtils();
    const result = apply(preset(extension, { primary: "#16a34a" }), utils);

    expect(utils.extend).toHaveBeenCalledWith(extension);
    expect(rootOf(result)?.["--ev-color-primary"]).toBe("#16a34a");
  });

  it("takes a theme extension and `selectors` together", () => {
    const extension = { styles: { label: { color: "#63e" } } };
    const utils = stubUtils();
    const result = apply(
      preset(extension, { selectors: { label: { fontWeight: 600 } } }),
      utils
    );

    expect(utils.extend).toHaveBeenCalledWith(extension);
    expect(result.styles?.label).toEqual({ fontWeight: 600 });
  });

  it("takes a theme extension, semantic values and `selectors` together", () => {
    const extension = { styles: { label: { color: "#63e" } } };
    const utils = stubUtils();
    const result = apply(
      preset(extension, {
        primary: "#16a34a",
        selectors: { label: { fontWeight: 600 } },
      }),
      utils
    );

    expect(utils.extend).toHaveBeenCalledWith(extension);
    expect(rootOf(result)?.["--ev-color-primary"]).toBe("#16a34a");
    expect(result.styles?.label).toEqual({ fontWeight: 600 });
  });

  it("treats a function as the theme extension, not the config", () => {
    const extension = () => ({ styles: { label: { color: "#63e" } } });
    const utils = stubUtils();
    const result = apply(preset(extension, { primary: "#16a34a" }), utils);

    expect(utils.extend).toHaveBeenCalledWith(extension);
    expect(rootOf(result)?.["--ev-color-primary"]).toBe("#16a34a");
  });

  it("treats an object with only `fonts` as the theme extension", () => {
    const extension = { fonts: ["https://example.com/font.css"] };
    const utils = stubUtils();

    apply(preset(extension), utils);

    expect(utils.extend).toHaveBeenCalledWith(extension);
  });

  it("takes a page's custom property for a semantic value via cssVar", () => {
    document.documentElement.style.setProperty("--brand-color", "#123456");

    const result = apply(
      preset({ primary: cssVar("--brand-color") }),
      stubUtils()
    );

    expect(rootOf(result)?.["--ev-color-primary"]).toBe("#123456");
  });

  it("takes a page's custom property inside `selectors` via cssVar", () => {
    document.documentElement.style.setProperty("--brand-color", "#123456");

    const result = apply(
      preset({ selectors: { label: { color: cssVar("--brand-color") } } }),
      stubUtils()
    );

    expect(result.styles?.label).toEqual({ color: "#123456" });
  });

  it("adds a custom `:root` variable from `selectors` and keeps the semantic ones", () => {
    const result = apply(
      preset({
        primary: "#16a34a",
        selectors: { ":root": { "--my-token": "42px" } },
      }),
      stubUtils()
    );

    expect(rootOf(result)).toMatchObject({
      "--ev-color-primary": "#16a34a",
      "--my-token": "42px",
    });
  });
});
