import type { ThemeFontFace } from "types";

type FontFaceStyle = Record<string, string | number>;

const FORMATS: Record<string, string> = {
  "font/woff2": "woff2",
  "font/woff": "woff",
  "font/ttf": "truetype",
  "font/otf": "opentype",
};

const SRC = /^data:([a-z]+\/[a-z0-9+-]+);base64,([A-Za-z0-9+/]+={0,2})$/;
const FAMILY = /^[\w -]{1,64}$/;
const WEIGHT = /^(normal|bold|[1-9]\d{0,2}( [1-9]\d{0,2})?)$/;
const STYLE = /^(normal|italic|oblique)$/;
const DISPLAY = /^(auto|block|swap|fallback|optional)$/;
const CARD_FIELD_CHARACTERS = "0123456789";

const ALLOWED_FONT_HOSTS = new Set(["fonts.googleapis.com"]);

export function isAllowedFontUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" && ALLOWED_FONT_HOSTS.has(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function matchOrNull(
  value: string | number | undefined,
  pattern: RegExp
): string | null {
  if (value === undefined) return null;
  const string = String(value);
  return pattern.test(string) ? string : null;
}

function decodeBase64(base64: string): Uint8Array {
  try {
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  } catch {
    throw new Error("src is not a valid base64 payload");
  }
}

async function assertSafeDigitGlyphs(base64: string): Promise<void> {
  const { create: createFont } = await import("fontkit");

  const bytes = decodeBase64(base64);

  let font;
  try {
    font = createFont(bytes as unknown as Buffer);
  } catch {
    throw new Error("font could not be parsed");
  }

  if (!("hasGlyphForCodePoint" in font)) {
    throw new Error("font collections are not supported");
  }

  const seenGlyphIds = new Map<number, string>();

  for (const character of CARD_FIELD_CHARACTERS) {
    const codePoint = character.codePointAt(0) as number;
    if (!font.hasGlyphForCodePoint(codePoint)) {
      throw new Error(`font has no glyph for the digit "${character}"`);
    }

    const glyphId = font.glyphForCodePoint(codePoint).id;
    if (glyphId === 0) {
      throw new Error(
        `the digit "${character}" maps to the missing-glyph placeholder`
      );
    }

    const seen = seenGlyphIds.get(glyphId);
    if (seen !== undefined) {
      throw new Error(
        `the digits "${seen}" and "${character}" are drawn by the same glyph`
      );
    }
    seenGlyphIds.set(glyphId, character);
  }
}

export async function parseFontFace(
  face: ThemeFontFace
): Promise<FontFaceStyle> {
  const src = SRC.exec(face.src);
  if (!src) throw new Error("src must be a base64 data URL");

  const format = FORMATS[src[1]];
  if (!format) {
    throw new Error(
      `src has an unsupported type "${src[1]}", expected ${Object.keys(
        FORMATS
      ).join(", ")}`
    );
  }

  if (!FAMILY.test(face.fontFamily)) {
    throw new Error(
      "fontFamily must be 1-64 letters, digits, spaces, hyphens or underscores"
    );
  }

  await assertSafeDigitGlyphs(src[2]);

  const style: FontFaceStyle = {
    fontFamily: face.fontFamily,
    src: `url("${face.src}") format("${format}")`,
  };

  const weight = matchOrNull(face.fontWeight, WEIGHT);
  if (weight) style.fontWeight = weight;

  const fontStyle = matchOrNull(face.fontStyle, STYLE);
  if (fontStyle) style.fontStyle = fontStyle;

  const display = matchOrNull(face.fontDisplay, DISPLAY);
  if (display) style.fontDisplay = display;

  return style;
}

export async function parseFontFaces(
  faces: ThemeFontFace[]
): Promise<FontFaceStyle[]> {
  const results = await Promise.allSettled(
    faces.map((face) => parseFontFace(face))
  );

  return results.reduce<FontFaceStyle[]>((acc, result, index) => {
    if (result.status === "rejected") {
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);

      console.error(
        `Invalid theme font face for "${
          faces[index]?.fontFamily ?? "unknown"
        }": ${reason}`
      );

      return acc;
    }

    return [...acc, result.value];
  }, []);
}
