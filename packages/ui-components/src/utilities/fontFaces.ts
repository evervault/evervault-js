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
const UNICODE_RANGE =
  /^u\+[0-9a-f?]{1,6}(-[0-9a-f]{1,6})?( *, *u\+[0-9a-f?]{1,6}(-[0-9a-f]{1,6})?)*$/i;

function optional(
  value: string | number | undefined,
  pattern: RegExp
): string | null {
  if (value === undefined) return null;
  const string = String(value);
  return pattern.test(string) ? string : null;
}

export function parseFontFace(face: ThemeFontFace): FontFaceStyle | null {
  const src = SRC.exec(face.src);
  if (!src) return null;

  const format = FORMATS[src[1]];
  if (!format) return null;
  if (!FAMILY.test(face.fontFamily)) return null;

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

  const unicodeRange = optional(face.unicodeRange, UNICODE_RANGE);
  if (unicodeRange) style.unicodeRange = unicodeRange;

  return style;
}

export function parseFontFaces(faces: ThemeFontFace[]): FontFaceStyle[] {
  return faces.reduce<FontFaceStyle[]>((acc, face) => {
    const parsed = parseFontFace(face);

    if (!parsed) {
      console.error(
        `Invalid theme font face for "${face?.fontFamily ?? "unknown"}". Fonts must be base64 data URLs of type ${Object.keys(FORMATS).join(", ")}.`
      );
      return acc;
    }

    return [...acc, parsed];
  }, []);
}
