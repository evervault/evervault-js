import { resolveAgentToolsConfig } from "./agentTools";
import { CardFrame } from "./cardFrame";
import type EvervaultClient from "../main";
import type {
  CardEvents,
  CardOptions,
  CardFrameConfig,
  SelectorType,
  ThemeDefinition,
} from "types";

// The `ui.card()` front-end: translates `CardOptions` for the card frame.
export default class Card {
  #options: CardOptions;
  #client: EvervaultClient;
  #frame: CardFrame;

  constructor(client: EvervaultClient, options?: CardOptions) {
    this.#options = options ?? {};
    this.#client = client;
    this.#frame = new CardFrame(client, {
      colorScheme: this.#options.colorScheme,
      // Cross-origin iframes need the `tools` Permissions Policy delegated
      // before they can register WebMCP tools.
      allow: this.#options.agentTools?.enabled ? "payment; tools" : undefined,
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
        agentTools: resolveAgentToolsConfig(
          this.#options.agentTools,
          this.#client.config.appId
        ),
      },
    };
  }

  mount(selector: SelectorType) {
    this.#frame.mount(selector, this.config);
    return this;
  }

  preload(selector: SelectorType) {
    this.#frame.preload(selector, this.config);

    return this;
  }

  reveal() {
    this.#frame.reveal();
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
