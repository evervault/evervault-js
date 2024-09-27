import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type {
  CardPayload,
  CardOptions,
  SwipedCard,
  CardFrameClientMessages,
  CardFrameHostMessages,
  SelectorType,
} from "types";

interface CardEvents {
  ready: () => void;
  error: () => void;
  change: (payload: CardPayload) => void;
  complete: (payload: CardPayload) => void;
  swipe: (payload: SwipedCard) => void;
  validate: (payload: CardPayload) => void;
}

export default class Card {
  values: CardPayload;
  #options: CardOptions;
  #frame: EvervaultFrame<CardFrameClientMessages, CardFrameHostMessages>;

  #events = new EventManager<CardEvents>();

  constructor(client: EvervaultClient, options?: CardOptions) {
    this.#options = options ?? {};
    this.#frame = new EvervaultFrame(client, "Card");

    // update the values when the frame sends a change event and dispatch
    // a change event.
    this.#frame.on("EV_CHANGE", (payload) => {
      this.values = payload;
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

  get config() {
    return {
      theme: this.#options.theme,
      config: {
        icons: this.#options.icons,
        autoFocus: this.#options.autoFocus,
        translations: this.#options.translations,
        hiddenFields: (this.#options.hiddenFields ?? [])?.join(","),
        fields: this.#options.fields,
        acceptedBrands: this.#options.acceptedBrands,
        autoComplete: this.#options.autoComplete,
        autoProgress: this.#options.autoProgress,
      },
    };
  }

  mount(selector: SelectorType) {
    this.#frame.mount(selector, {
      ...this.config,
      onError: () => {
        this.#events.dispatch("error");
      },
    });

    return this;
  }

  update(options?: CardOptions) {
    if (options) {
      this.#options = { ...this.#options, ...options };
    }
    this.#frame.update(this.config);
    return this;
  }

  unmount() {
    this.#frame.unmount();
    return this;
  }

  on<T extends keyof CardEvents>(event: T, callback: CardEvents[T]) {
    return this.#events.on(event, callback);
  }

  validate() {
    this.#frame.send("EV_VALIDATE");
    this.#frame.once("EV_VALIDATED", (payload) => {
      this.values = payload;
      this.#events.dispatch("validate", payload);
    });
    return this;
  }
}
