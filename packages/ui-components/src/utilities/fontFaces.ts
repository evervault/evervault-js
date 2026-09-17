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

function optional(
  value: string | number | undefined,
  pattern: RegExp
): string | null {
  if (value === undefined) return null;
  const string = String(value);
  return pattern.test(string) ? string : null;
}

function decodeBase64(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function hasSafeDigitGlyphs(bytes: Uint8Array): Promise<boolean> {
  const { create: createFont } = await import("fontkit");

  let font;
  try {
    font = createFont(bytes as unknown as Buffer);
  } catch {
    return false;
  }

  if (!("hasGlyphForCodePoint" in font)) return false;

  const seenGlyphIds = new Set<number>();

  for (const character of CARD_FIELD_CHARACTERS) {
    const codePoint = character.codePointAt(0) as number;
    if (!font.hasGlyphForCodePoint(codePoint)) return false;

    const glyphId = font.glyphForCodePoint(codePoint).id;
    if (glyphId === 0) return false;
    if (seenGlyphIds.has(glyphId)) return false;
    seenGlyphIds.add(glyphId);
  }

  return true;
}

export async function parseFontFace(
  face: ThemeFontFace
): Promise<FontFaceStyle | null> {
  const src = SRC.exec(face.src);
  if (!src) return null;

  const format = FORMATS[src[1]];
  if (!format) return null;
  if (!FAMILY.test(face.fontFamily)) return null;
  if (!(await hasSafeDigitGlyphs(decodeBase64(src[2])))) return null;

  const style: FontFaceStyle = {
    fontFamily: face.fontFamily,
    src: `url("${face.src}") format("${format}")`,
  };

  const weight = optional(face.fontWeight, WEIGHT);
  if (weight) style.fontWeight = weight;

  const fontStyle = optional(face.fontStyle, STYLE);
  if (fontStyle) style.fontStyle = fontStyle;

  const display = optional(face.fontDisplay, DISPLAY);
  if (display) style.fontDisplay = display;

  return style;
}

export async function parseFontFaces(
  faces: ThemeFontFace[]
): Promise<FontFaceStyle[]> {
  const parsed = await Promise.all(faces.map((face) => parseFontFace(face)));

  return parsed.reduce<FontFaceStyle[]>((acc, style, index) => {
    if (!style) {
      console.error(
        `Invalid theme font face for "${
          faces[index]?.fontFamily ?? "unknown"
        }". Fonts must be base64 data URLs of type ${Object.keys(FORMATS).join(
          ", "
        )}, and must have distinct, non-empty glyphs for digits 0-9.`
      );
      return acc;
    }

    return [...acc, style];
  }, []);
}
