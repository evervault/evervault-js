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

export interface CardFrameOptions {
  colorScheme?: ColorScheme;
  allow?: string;
}

export interface CardFrameConfiguration {
  theme?: ThemeDefinition;
  config?: CardFrameConfig;
}

// The card machinery shared by every card front-end: one frame, its
// subscriptions and their release, the values mirror and validation.
export class CardFrame {
  values: CardPayload;
  #frame: EvervaultFrame<CardFrameClientMessages, CardFrameHostMessages>;
  #events = new EventManager<CardEvents>();
  #unsubscribes: (() => void)[] = [];
  #destroyed = false;

  constructor(client: EvervaultClient, options: CardFrameOptions = {}) {
    this.#frame = new EvervaultFrame(client, "Card", {
      colorScheme: options.colorScheme,
      allow: options.allow,
    });

    this.#unsubscribes.push(
      this.#frame.on("EV_CHANGE", (payload) => {
        this.values = payload;
        this.#events.dispatch("change", payload);
      }),

      this.#frame.on("EV_COMPLETE", (payload) => {
        this.#events.dispatch("complete", payload);
      }),

      this.#frame.on("EV_SWIPE", (payload) => {
        this.#events.dispatch("swipe", payload);
      }),

      this.#frame.on("EV_FRAME_READY", () => {
        this.#events.dispatch("ready");
      }),

      this.#frame.on("EV_FOCUS", (field) => {
        this.#events.dispatch("focus", { field, data: this.values });
      }),

      this.#frame.on("EV_BLUR", (field) => {
        this.#events.dispatch("blur", { field, data: this.values });
      }),

      this.#frame.on("EV_KEYDOWN", (field) => {
        this.#events.dispatch("keydown", { field, data: this.values });
      }),

      this.#frame.on("EV_KEYUP", (field) => {
        this.#events.dispatch("keyup", { field, data: this.values });
      })
    );

    this.values = {
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

  mount(selector: SelectorType, configuration: CardFrameConfiguration = {}) {
    // The subscriptions are made once, in the constructor, so a frame mounted
    // after destroy() would never report back.
    if (this.#destroyed) {
      throw new Error(
        "Evervault card has been destroyed and cannot be mounted"
      );
    }

    this.#frame.mount(selector, {
      ...configuration,
      onError: () => {
        this.#events.dispatch("error");
      },
    });

    return this;
  }

  preload(selector: SelectorType, configuration: CardFrameConfiguration = {}) {
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
    this.#frame.reveal();
    return this;
  }

  update(configuration: CardFrameConfiguration) {
    this.#frame.update(configuration);
    return this;
  }

  send<K extends keyof CardFrameHostMessages>(
    type: K,
    payload?: CardFrameHostMessages[K]
  ) {
    this.#frame.send(type, payload);
    return this;
  }

  unmount() {
    this.#frame.unmount();
    return this;
  }

  // Unlike unmount(), releases every subscription; a destroyed frame cannot be
  // mounted again.
  destroy() {
    for (const release of this.#unsubscribes) release();

    this.#unsubscribes = [];
    this.#destroyed = true;
    this.#frame.destroy();

    return this;
  }

  on<T extends keyof CardEvents>(event: T, callback: CardEvents[T]) {
    return this.#events.on(event, callback);
  }

  validate() {
    if (this.#destroyed) {
      console.error(
        "Evervault card has been destroyed and cannot be validated"
      );
      return this;
    }

    this.#frame.send("EV_VALIDATE");

    // Dropped once it fires, so repeated calls do not pile up.
    const release = this.#frame.once("EV_VALIDATED", (payload) => {
      this.#unsubscribes = this.#unsubscribes.filter(
        (held) => held !== release
      );
      this.values = payload;
      this.#events.dispatch("validate", payload);
    });

    this.#unsubscribes.push(release);

    return this;
  }
}
