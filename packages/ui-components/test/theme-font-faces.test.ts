import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseFontFace, parseFontFaces } from "../src/utilities/fontFaces";

const FIXTURES_DIR = join(__dirname, "fixtures");

function fixtureDataUri(name: string): string {
  const bytes = readFileSync(join(FIXTURES_DIR, name));
  return `data:font/otf;base64,${bytes.toString("base64")}`;
}

const VALID_FONT = fixtureDataUri("digits-valid.otf");
const SPOOFED_FONT = fixtureDataUri("digits-spoofed.otf");
const MISSING_DIGIT_FONT = fixtureDataUri("digits-missing.otf");

describe("parseFontFace", () => {
  it("builds a font-face style from a base64 data URL", async () => {
    expect(
      await parseFontFace({ fontFamily: "Natural Sans", src: VALID_FONT })
    ).toEqual({
      fontFamily: "Natural Sans",
      src: `url("${VALID_FONT}") format("opentype")`,
    });
  });

  it("keeps valid optional descriptors", async () => {
    expect(
      await parseFontFace({
        fontFamily: "Natural Sans",
        src: VALID_FONT,
        fontWeight: 700,
        fontStyle: "italic",
        fontDisplay: "swap",
      })
    ).toMatchObject({
      fontWeight: "700",
      fontStyle: "italic",
      fontDisplay: "swap",
    });
  });

  it("drops invalid optional descriptors but keeps the face", async () => {
    const parsed = await parseFontFace({
      fontFamily: "Natural Sans",
      src: VALID_FONT,
      fontStyle: 'normal"; } body { display: none } @font-face { src: "',
    });

    expect(parsed).toEqual({
      fontFamily: "Natural Sans",
      src: `url("${VALID_FONT}") format("opentype")`,
    });
  });

  it("rejects remote sources", async () => {
    expect(
      await parseFontFace({
        fontFamily: "Natural Sans",
        src: "https://www.natural.com/fonts/natural-sans.woff2",
      })
    ).toBeNull();
  });

  it("rejects non-font mime types", async () => {
    expect(
      await parseFontFace({
        fontFamily: "Natural Sans",
        src: "data:text/html;base64,PHNjcmlwdD4=",
      })
    ).toBeNull();
  });

  it("rejects payloads that could break out of the rule", async () => {
    expect(
      await parseFontFace({
        fontFamily: "Natural Sans",
        src: 'data:font/woff2;base64,abc") format("woff2"); } body { display: none } @font-face { src: url("',
      })
    ).toBeNull();
  });

  it("rejects font families that could break out of the rule", async () => {
    expect(
      await parseFontFace({
        fontFamily: 'Natural"; } body { display: none } @font-face { font-family: "x',
        src: VALID_FONT,
      })
    ).toBeNull();
  });

  it("rejects a font that maps two digits to the same glyph", async () => {
    expect(
      await parseFontFace({ fontFamily: "Natural Sans", src: SPOOFED_FONT })
    ).toBeNull();
  });

  it("rejects a font that's missing a digit glyph", async () => {
    expect(
      await parseFontFace({
        fontFamily: "Natural Sans",
        src: MISSING_DIGIT_FONT,
      })
    ).toBeNull();
  });

  it("rejects bytes that aren't a parseable font at all", async () => {
    expect(
      await parseFontFace({
        fontFamily: "Natural Sans",
        src: "data:font/woff2;base64,d09GMgABAAAAAA==",
      })
    ).toBeNull();
  });
});

describe("parseFontFaces", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps valid faces and logs the rejected ones", async () => {
    const faces = await parseFontFaces([
      { fontFamily: "Natural Sans", src: VALID_FONT },
      { fontFamily: "Natural Sans", src: "https://www.natural.com/f.woff2" },
    ]);

    expect(faces).toHaveLength(1);
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("logs and drops a font with spoofed digit glyphs", async () => {
    const faces = await parseFontFaces([
      { fontFamily: "Natural Sans", src: SPOOFED_FONT },
    ]);

    expect(faces).toHaveLength(0);
    expect(console.error).toHaveBeenCalledOnce();
  });
});
