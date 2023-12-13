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
  swipe: (payload: SwipedCard) => void;
}

export default class Card {
  values?: CardPayload;
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

    this.#frame.on("EV_SWIPE", (payload) => {
      this.#events.dispatch("swipe", payload);
    });

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
    });
  }

  get config() {
    return {
      theme: this.#options.theme,
      config: {
        autoFocus: this.#options.autoFocus,
        translations: this.#options.translations,
        hiddenFields: (this.#options.hiddenFields ?? [])?.join(","),
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
    return this;
  }
}
