import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type {
  SelectorType,
  EvervaultFrameHostMessages,
  FormOptions,
  FormPayload,
  FormFrameClientMessages
} from "types";

interface FormEvents {
  ready: () => void;
  error: () => void;
  change: (payload: FormPayload) => void;
  complete: (payload: FormPayload) => void;
}

export default class Form {
  values: FormPayload = {
    value: "",
    isComplete: false,
  };

  #options: FormOptions;
  #frame: EvervaultFrame<FormFrameClientMessages, EvervaultFrameHostMessages>;
  #events = new EventManager<FormEvents>();

  constructor(client: EvervaultClient, options?: FormOptions) {
    this.#options = options ?? {};
    this.#frame = new EvervaultFrame(client, "Form");

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

  update(options: FormOptions) {
    if (options) {
      this.#options = { ...this.#options, ...options };
    }
    this.#frame.update(this.config);
    return this;
  }

  on<T extends keyof FormEvents>(event: T, callback: FormEvents[T]) {
    return this.#events.on(event, callback);
  }
}
