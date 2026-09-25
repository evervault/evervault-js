// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { withPresetConfig } from "./presetConfig";
import { cssVar } from "./cssVar";

describe("withPresetConfig", () => {
  it("returns the base styles unchanged when no config is given", () => {
    const styles = { body: { color: "red" } };
    expect(withPresetConfig(styles)).toBe(styles);
  });

  it("sets root custom properties for provided fields only", () => {
    const result = withPresetConfig(
      { ":root": { "--icon-offset": "1.9rem" } },
      { primary: "#63e", roundness: "8px" }
    );

    expect(result[":root"]).toEqual({
      "--icon-offset": "1.9rem",
      "--ev-color-primary": "#63e",
      "--ev-roundness": "8px",
    });
  });

  it("takes a page's custom property via cssVar", () => {
    document.documentElement.style.setProperty("--brand-color", "#123456");

    const result = withPresetConfig({}, { primary: cssVar("--brand-color") });

    expect(
      (result[":root"] as Record<string, string>)["--ev-color-primary"]
    ).toBe("#123456");
  });

  it("treats a `--` prefixed string as a literal value", () => {
    const result = withPresetConfig({}, { primary: "--brand-color" });

    expect(
      (result[":root"] as Record<string, string>)["--ev-color-primary"]
    ).toBe("--brand-color");
  });

  it("lets `selectors` override the preset's own styles", () => {
    const result = withPresetConfig(
      { input: { color: "black" } },
      { selectors: { input: { color: "blue" } } }
    );

    expect(result.input).toEqual({ color: "blue" });
  });

  it("merges a `:root` key in `selectors` instead of wiping out semantic overrides", () => {
    const result = withPresetConfig(
      { ":root": { "--icon-offset": "1.9rem" } },
      {
        primary: "#63e",
        selectors: { ":root": { "--custom-token": "42px" } },
      }
    );

    expect(result[":root"]).toEqual({
      "--icon-offset": "1.9rem",
      "--ev-color-primary": "#63e",
      "--custom-token": "42px",
    });
  });

  it("lets a `:root` key in `selectors` override a semantic token", () => {
    const result = withPresetConfig(
      {},
      {
        primary: "#63e",
        selectors: { ":root": { "--ev-color-primary": "#000" } },
      }
    );

    expect(
      (result[":root"] as Record<string, string>)["--ev-color-primary"]
    ).toBe("#000");
  });
});

describe("cssVar", () => {
  it("reads a custom property off the page", () => {
    document.documentElement.style.setProperty("--spacing", " 12px ");

    expect(cssVar("--spacing")).toBe("12px");
  });

  it("returns an empty string for a property that isn't set", () => {
    expect(cssVar("--not-set")).toBe("");
  });
});
