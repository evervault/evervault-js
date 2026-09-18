import { CardFrame } from "./cardFrame";
import type { CardEvents } from "./cardFrame";
import type EvervaultClient from "../main";
import type {
  CardOptions,
  CardFrameConfig,
  SelectorType,
  ThemeDefinition,
} from "types";

// The `ui.card()` front-end: translates `CardOptions` for the card frame.
export default class Card {
  #options: CardOptions;
  #frame: CardFrame;

  constructor(client: EvervaultClient, options?: CardOptions) {
    this.#options = options ?? {};
    this.#frame = new CardFrame(client, {
      colorScheme: this.#options.colorScheme,
    });
  }

  get values() {
    return this.#frame.values;
  }

  get config(): { theme?: ThemeDefinition; config: CardFrameConfig } {
    return {
      theme: this.#options.theme,
      config: {
        icons: this.#options.icons,
        autoFocus: this.#options.autoFocus,
        translations: this.#options.translations,
        hiddenFields: (this.#options.hiddenFields ?? [])?.join(","),
        fields: this.#options.fields,
        acceptedBrands: this.#options.acceptedBrands,
        customBrands: this.#options.customBrands,
        defaultValues: this.#options.defaultValues,
        autoComplete: this.#options.autoComplete,
        autoProgress: this.#options.autoProgress,
        redactCVC: this.#options.redactCVC,
        allow3DigitAmexCVC: this.#options.allow3DigitAmexCVC,
        validation: this.#options.validation,
      },
    };
  }

  mount(selector: SelectorType) {
    this.#frame.mount(selector, this.config);
    return this;
  }

  update(options?: CardOptions) {
    if (options) {
      this.#options = { ...this.#options, ...options };
    }

    if (options?.defaultValues?.name) {
      this.#frame.send("EV_UPDATE_NAME", options.defaultValues.name);
    }

    this.#frame.update(this.config);
    return this;
  }

  unmount() {
    this.#frame.unmount();
    return this;
  }

  on<T extends keyof CardEvents>(event: T, callback: CardEvents[T]) {
    return this.#frame.on(event, callback);
  }

  validate() {
    this.#frame.validate();
    return this;
  }
}
