import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type {
  SelectorType,
  EvervaultFrameHostMessages,
  FormOptions,
  FormPayload,
  FormFrameClientMessages,
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

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
    });

    this.#frame.on("EV_ERROR", () => {
      this.#events.dispatch("error");
    });

    this.#frame.on("EV_SUBMITTED", () => {
      this.#events.dispatch("submitted")
    });
  }

  get config() {
    return {
      theme: this.#options.theme,
      config: {
        formSubmissionUrl: this.#options.formSubmissionUrl,
        formUuid: this.#options.formUuid,
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
