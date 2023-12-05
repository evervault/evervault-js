import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type {
  CardDetailsPayload,
  CardDetailsOptions,
  SwipedCardDetails,
  CardDetailsFrameClientMessages,
  CardDetailsFrameHostMessages,
  SelectorType,
} from "types";

interface CardDetailsEvents {
  ready: () => void;
  error: () => void;
  change: (payload: CardDetailsPayload) => void;
  swipe: (payload: SwipedCardDetails) => void;
}

export default class CardDetails {
  values?: CardDetailsPayload;
  #options: CardDetailsOptions;
  #frame: EvervaultFrame<
    CardDetailsFrameClientMessages,
    CardDetailsFrameHostMessages
  >;

  #events = new EventManager<CardDetailsEvents>();

  constructor(client: EvervaultClient, options?: CardDetailsOptions) {
    this.#options = options ?? {};
    this.#frame = new EvervaultFrame(client, "CardDetails");

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

  update(options?: CardDetailsOptions) {
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

  on<T extends keyof CardDetailsEvents>(
    event: T,
    callback: CardDetailsEvents[T]
  ) {
    return this.#events.on(event, callback);
  }

  validate() {
    this.#frame.send("EV_VALIDATE");
    return this;
  }
}
