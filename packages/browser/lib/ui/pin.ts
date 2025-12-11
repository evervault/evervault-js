import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type {
  PinPayload,
  SelectorType,
  PinFrameClientMessages,
  EvervaultFrameHostMessages,
  PinOptions,
} from "types";

interface PinEvents {
  ready: () => void;
  error: () => void;
  change: (payload: PinPayload) => void;
  complete: (payload: PinPayload) => void;
}

export default class Pin {
  values: PinPayload = {
    value: "",
    isComplete: false,
  };

  #options: PinOptions;
  #frame: EvervaultFrame<PinFrameClientMessages, EvervaultFrameHostMessages>;
  #events = new EventManager<PinEvents>();

  constructor(client: EvervaultClient, options?: PinOptions) {
    this.#options = options ?? {};
    this.#frame = new EvervaultFrame(client, "Pin", {
      colorScheme: this.#options.colorScheme,
    });

    this.#frame.on("EV_CHANGE", (payload) => {
      this.values = payload;
      this.#events.dispatch("change", payload);
    });

    this.#frame.on("EV_COMPLETE", (payload) => {
      this.values = payload;
      this.#events.dispatch("complete", payload);
    });

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
    });
  }

  get config() {
    return {
      theme: this.#options.theme,
      config: {
        length: Math.min(this.#options.length ?? 4, 10),
        mode: this.#options.mode ?? "numeric",
        autoFocus: this.#options.autoFocus,
        inputType: this.#options.inputType,
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

  unmount() {
    this.#frame.unmount();
    return this;
  }

  update(options: PinOptions) {
    if (options) {
      this.#options = { ...this.#options, ...options };
    }
    this.#frame.update(this.config);
    return this;
  }

  on<T extends keyof PinEvents>(event: T, callback: PinEvents[T]) {
    return this.#events.on(event, callback);
  }
}
