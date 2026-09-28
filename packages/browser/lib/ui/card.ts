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

// The `ui.card()` settings a declared card takes as properties of its own.
export type CardSettings = Pick<
  CardOptions,
  | "icons"
  | "autoFocus"
  | "translations"
  | "acceptedBrands"
  | "customBrands"
  | "defaultValues"
  | "autoComplete"
  | "redactCVC"
  | "allow3DigitAmexCVC"
  | "validation"
  | "agentTools"
>;

// Cross-origin iframes need the `tools` Permissions Policy delegated before
// they can register WebMCP tools.
export function framePermissions(agentTools: CardOptions["agentTools"]) {
  return agentTools?.enabled ? "payment; tools" : undefined;
}

export function cardSettingsConfig(
  settings: CardSettings,
  client: EvervaultClient
): CardFrameConfig {
  return {
    icons: settings.icons,
    autoFocus: settings.autoFocus,
    translations: settings.translations,
    acceptedBrands: settings.acceptedBrands,
    customBrands: settings.customBrands,
    defaultValues: settings.defaultValues,
    autoComplete: settings.autoComplete,
    redactCVC: settings.redactCVC,
    allow3DigitAmexCVC: settings.allow3DigitAmexCVC,
    validation: settings.validation,
    agentTools: resolveAgentToolsConfig(
      settings.agentTools,
      client.config.appId
    ),
  };
}

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
      allow: framePermissions(this.#options.agentTools),
    });
  }

  get values() {
    return this.#host.values;
  }

  get config(): CardHostConfiguration & { config: CardFrameConfig } {
    return {
      theme: this.#options.theme,
      config: {
        ...cardSettingsConfig(this.#options, this.#client),
        hiddenFields: (this.#options.hiddenFields ?? [])?.join(","),
        fields: this.#options.fields,
        autoProgress: this.#options.autoProgress,
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

  show() {
    this.#host.show();
    return this;
  }

  update(options?: CardOptions) {
    if (!this.#host.live()) return this;

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
