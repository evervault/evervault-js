import deepmerge from "deepmerge";
import type { EvervaultFrame } from "./evervaultFrame";
import type {
  ThemeObject,
  ThemeStyles,
  ThemeDefinition,
  ThemeUtilities,
} from "types";

// The Theme class is responsible for compiling the theme definition into an
// object that can be sent to the iframe. It also handles media queries and
// updates the iframe when the viewport changes.
export class Theme {
  object: ThemeObject;
  frame;
  #extension?: ThemeObject;
  #breakpoints: Record<
    string,
    {
      styles: ThemeStyles;
      matches: boolean;
    }
  > = {};

  constructor(frame: EvervaultFrame, definition: ThemeDefinition = {}) {
    this.object = this.#parseThemeDefinition(definition);
    this.frame = frame;
  }

  update(definition: ThemeDefinition) {
    this.object = this.#parseThemeDefinition(definition);
  }

  get utilities(): ThemeUtilities {
    return {
      media: this.media.bind(this),
      extend: this.extend.bind(this),
    };
  }

  #parseThemeDefinition(def: ThemeDefinition): ThemeObject {
    if (typeof def === "function") {
      return def(this.utilities);
    }

    return def;
  }

  extend(config: ThemeDefinition) {
    this.#extension = this.#parseThemeDefinition(config);
    return {};
  }

  media(query: string, styles: ThemeStyles): object {
    const media = window.matchMedia(query);

    const handler = (e: MediaQueryListEvent) => {
      this.#breakpoints[query].matches = e.matches;
      this.frame.update();
    };

    media.addEventListener("change", handler);

    this.#breakpoints[query] = {
      styles,
      matches: media.matches,
    };

    return {};
  }

  compile(): ThemeObject {
    const extended = this.#extension;
    const matchingBreakpoints = Object.values(this.#breakpoints).filter(
      (b) => b.matches
    );

    const breakpointStyles = matchingBreakpoints.reduce(
      (acc, b) => deepmerge(acc, b.styles),
      {}
    );

    const baseObject = deepmerge(this.object, extended ?? {});

    const compiled = {
      ...baseObject,
      styles: deepmerge(baseObject.styles || {}, breakpointStyles),
    };

    return compiled;
  }
}
