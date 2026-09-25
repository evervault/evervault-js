import { resolveAgentToolsConfig } from "./agentTools";
import { CardHost } from "./cardHost";
import type { CardHostConfiguration } from "./cardHost";
import type EvervaultClient from "../main";
import type {
  CardEvents,
  CardFrameConfig,
  CardOptions,
  SelectorType,
} from "types";

// The `ui.card()` front-end: translates `CardOptions` for the card frame.
export default class Card {
  #options: CardOptions;
  #client: EvervaultClient;
  #host: CardHost;

  constructor(client: EvervaultClient, options?: CardOptions) {
    this.#options = options ?? {};
    this.#client = client;
    this.#host = new CardHost(client, {
      colorScheme: this.#options.colorScheme,
      // Cross-origin iframes need the `tools` Permissions Policy delegated
      // before they can register WebMCP tools.
      allow: this.#options.agentTools?.enabled ? "payment; tools" : undefined,
    });
  }

  get values() {
    return this.#host.values;
  }

  get config(): CardHostConfiguration & { config: CardFrameConfig } {
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
    this.#host.mount(selector, this.config);
    return this;
  }

  preload(selector: SelectorType) {
    this.#host.preload(selector, this.config);

    return this;
  }

  reveal() {
    this.#host.reveal();
    return this;
  }

  update(options?: CardOptions) {
    // Reported once by the frame; the options stay as they were.
    if (this.#host.isDestroyed) {
      this.#host.update(this.config);
      return this;
    }

    if (options) {
      this.#options = { ...this.#options, ...options };
    }

    if (options?.defaultValues?.name) {
      this.#host.send("EV_UPDATE_NAME", options.defaultValues.name);
    }

    this.#host.update(this.config);
    return this;
  }

  unmount() {
    this.#host.unmount();
    return this;
  }

  destroy() {
    this.#host.destroy();
    return this;
  }

  on<T extends keyof CardEvents>(event: T, callback: CardEvents[T]) {
    return this.#host.on(event, callback);
  }

  validate() {
    this.#host.validate();
    return this;
  }
}
