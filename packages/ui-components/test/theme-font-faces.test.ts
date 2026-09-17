import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseFontFace, parseFontFaces } from "../src/utilities/fontFaces";

const WOFF2 = "data:font/woff2;base64,d09GMgABAAAAAA==";

describe("parseFontFace", () => {
  it("builds a font-face style from a base64 woff2 data URL", () => {
    expect(parseFontFace({ fontFamily: "Natural Sans", src: WOFF2 })).toEqual({
      fontFamily: "Natural Sans",
      src: `url("${WOFF2}") format("woff2")`,
    });
  });

  it("keeps valid optional descriptors", () => {
    expect(
      parseFontFace({
        fontFamily: "Natural Sans",
        src: WOFF2,
        fontWeight: 700,
        fontStyle: "italic",
        fontDisplay: "swap",
        unicodeRange: "U+0000-00FF, U+0131",
      })
    ).toMatchObject({
      fontWeight: "700",
      fontStyle: "italic",
      fontDisplay: "swap",
      unicodeRange: "U+0000-00FF, U+0131",
    });
  });

  it("drops invalid optional descriptors but keeps the face", () => {
    const parsed = parseFontFace({
      fontFamily: "Natural Sans",
      src: WOFF2,
      fontStyle: 'normal"; } body { display: none } @font-face { src: "',
    });

    expect(parsed).toEqual({
      fontFamily: "Natural Sans",
      src: `url("${WOFF2}") format("woff2")`,
    });
  });

  it("rejects remote sources", () => {
    expect(
      parseFontFace({
        fontFamily: "Natural Sans",
        src: "https://www.natural.com/fonts/natural-sans.woff2",
      })
    ).toBeNull();
  });

  it("rejects non-font mime types", () => {
    expect(
      parseFontFace({
        fontFamily: "Natural Sans",
        src: "data:text/html;base64,PHNjcmlwdD4=",
      })
    ).toBeNull();
  });

  it("rejects payloads that could break out of the rule", () => {
    expect(
      parseFontFace({
        fontFamily: "Natural Sans",
        src: 'data:font/woff2;base64,abc") format("woff2"); } body { display: none } @font-face { src: url("',
      })
    ).toBeNull();
  });

  it("rejects font families that could break out of the rule", () => {
    expect(
      parseFontFace({
        fontFamily: 'Natural"; } body { display: none } @font-face { font-family: "x',
        src: WOFF2,
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

  it("keeps valid faces and logs the rejected ones", () => {
    const faces = parseFontFaces([
      { fontFamily: "Natural Sans", src: WOFF2 },
      { fontFamily: "Natural Sans", src: "https://www.natural.com/f.woff2" },
    ]);

    expect(faces).toHaveLength(1);
    expect(console.error).toHaveBeenCalledOnce();
  });
});
