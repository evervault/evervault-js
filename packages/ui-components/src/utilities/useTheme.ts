import jss, { JssStyle, StyleSheet } from "jss";
import preset from "jss-preset-default";
import { useEffect, useRef, useState } from "react";
import { ThemeObject } from "types";
import { parseFontFaces } from "./fontFaces";
import { resize } from "./resize";

jss.setup(preset());

export function useTheme() {
  const styles = useRef<StyleSheet | null>(null);
  const [theme, setTheme] = useState<ThemeObject | null>(null);

  useEffect(() => {
    if (!theme) return;

    const fontFaces = parseFontFaces(theme.fontFaces ?? []);

    const opts = {
      "@import": (theme.fonts ?? []).map((url) => `url(${url})`) as JssStyle[],
      ...(fontFaces.length > 0 ? { "@font-face": fontFaces } : {}),
      "@global": theme.styles,
    };

    if (styles.current) {
      styles.current.detach();
    }

    styles.current = jss.createStyleSheet(opts);
    styles.current.attach();

    resize();
  }, [theme]);

  return setTheme;
}
