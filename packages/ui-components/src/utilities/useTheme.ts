import jss, { JssStyle, StyleSheet } from "jss";
import preset from "jss-preset-default";
import { useEffect, useRef, useState } from "react";
import { ThemeObject } from "types";
import { isAllowedFontUrl, parseFontFaces } from "./fontFaces";
import { resize } from "./resize";

jss.setup(preset());

export function useTheme() {
  const styles = useRef<StyleSheet | null>(null);
  const [theme, setTheme] = useState<ThemeObject | null>(null);

  useEffect(() => {
    if (!theme) return;

    let cancelled = false;

    parseFontFaces(theme.fontFaces ?? []).then((fontFaces) => {
      if (cancelled) return;

      const opts = {
        "@import": (theme.fonts ?? [])
          .filter(isAllowedFontUrl)
          .map((url) => `url(${url})`) as JssStyle[],
        ...(fontFaces.length > 0 ? { "@font-face": fontFaces } : {}),
        "@global": theme.styles,
      };

      if (styles.current) {
        styles.current.detach();
      }

      styles.current = jss.createStyleSheet(opts);
      styles.current.attach();

      resize();
    });

    return () => {
      cancelled = true;
    };
  }, [theme]);

  return setTheme;
}
