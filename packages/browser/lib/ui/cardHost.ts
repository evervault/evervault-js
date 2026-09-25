import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type {
  CardEvents,
  CardPayload,
  CardFrameClientMessages,
  CardFrameConfig,
  CardFrameHostMessages,
  ColorScheme,
  SelectorType,
  ThemeDefinition,
} from "types";

export interface CardHostOptions {
  colorScheme?: ColorScheme;
  allow?: string;
}

export interface CardHostConfiguration {
  theme?: ThemeDefinition;
  config?: CardFrameConfig;
}

// The card machinery shared by every card front-end.
export class CardHost {
  #values: CardPayload;
  #frame: EvervaultFrame<CardFrameClientMessages, CardFrameHostMessages>;
  #events = new EventManager<CardEvents>();
  #pendingValidate?: () => void;

  constructor(client: EvervaultClient, options: CardHostOptions = {}) {
    this.#frame = new EvervaultFrame(client, "Card", {
      colorScheme: options.colorScheme,
      allow: options.allow,
    });

    this.#frame.on("EV_CHANGE", (payload) => {
      this.#values = payload;
      this.#events.dispatch("change", payload);
    });

    this.#frame.on("EV_COMPLETE", (payload) => {
      this.#events.dispatch("complete", payload);
    });

    this.#frame.on("EV_SWIPE", (payload) => {
      this.#events.dispatch("swipe", payload);
    });

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
    });

    this.#frame.on("EV_FOCUS", (field) => {
      this.#events.dispatch("focus", { field, data: this.values });
    });

    this.#frame.on("EV_BLUR", (field) => {
      this.#events.dispatch("blur", { field, data: this.values });
    });

    this.#frame.on("EV_KEYDOWN", (field) => {
      this.#events.dispatch("keydown", { field, data: this.values });
    });

    this.#frame.on("EV_KEYUP", (field) => {
      this.#events.dispatch("keyup", { field, data: this.values });
    });

    this.#values = {
      card: {
        name: null,
        brand: null,
        localBrands: [],
        bin: null,
        lastFour: null,
        number: null,
        expiry: { month: null, year: null },
        cvc: null,
      },
      isValid: false,
      isComplete: false,
      errors: null,
    };
  }

  // Kept current by the frame's change and validate replies.
  get values() {
    return this.#values;
  }

  mount(selector: SelectorType, configuration: CardHostConfiguration = {}) {
    if (!this.live()) return this;

    // A validate issued while unmounted went nowhere; its reply never comes.
    this.#pendingValidate?.();
    this.#pendingValidate = undefined;
    this.#frame.mount(selector, {
      ...configuration,
      onError: () => {
        this.#events.dispatch("error");
      },
    });

    return this;
  }

  preload(selector: SelectorType, configuration: CardHostConfiguration = {}) {
    if (!this.live()) return this;

    // A validate issued while unmounted went nowhere; its reply never comes.
    this.#pendingValidate?.();
    this.#pendingValidate = undefined;
    this.#frame.preload(selector, {
      ...configuration,
      onError: () => {
        this.#events.dispatch("error");
      },
    });

    return this;
  }

  reveal() {
    if (!this.live()) return this;

    this.#frame.reveal();
    return this;
  }

  update(configuration: CardHostConfiguration) {
    if (!this.live()) return this;

    this.#frame.update(configuration);
    return this;
  }

  send<K extends keyof CardFrameHostMessages>(
    type: K,
    payload?: CardFrameHostMessages[K]
  ) {
    if (!this.live()) return this;

    this.#frame.send(type, payload);
    return this;
  }

  unmount() {
    if (!this.live()) return this;

    // A reply to the unmounted frame's request must not land in the next one.
    this.#pendingValidate?.();
    this.#pendingValidate = undefined;
    this.#frame.unmount();
    return this;
  }

  destroy() {
    this.#pendingValidate = undefined;
    this.#frame.destroy();
    // Nothing can dispatch to them again; let the callbacks go.
    this.#events = new EventManager<CardEvents>();
    return this;
  }

  on<T extends keyof CardEvents>(event: T, callback: CardEvents[T]) {
    if (!this.live()) return () => {};

    return this.#events.on(event, callback);
  }

  validate() {
    if (!this.live()) return this;

    // One reply answers the latest request, however many were sent.
    this.#pendingValidate?.();
    this.#pendingValidate = this.#frame.once("EV_VALIDATED", (payload) => {
      this.#pendingValidate = undefined;
      this.#values = payload;
      this.#events.dispatch("validate", payload);
    });

    this.#frame.send("EV_VALIDATE");

    return this;
  }

  // The frame reports a destroyed call; nothing here reaches it once it has.
  live() {
    return this.#frame.live();
  }
}
