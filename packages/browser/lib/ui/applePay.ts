import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type { SelectorType, ApplePayOptions } from "types";
import { Transaction } from "../resources/transaction";

export default class ApplePay {
  #transaction: Transaction;
  #options: ApplePayOptions;
  #frame: EvervaultFrame;
  #events = new EventManager();

  constructor(
    client: EvervaultClient,
    transaction: Transaction,
    options: ApplePayOptions
  ) {
    this.#options = options;
    this.#transaction = transaction;
    this.#frame = new EvervaultFrame(client, "ApplePay", {
      size: options.size ?? {
        width: "250px",
        height: "45px",
      },
    });

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
    });
  }

  get config() {
    return {
      config: {
        type: this.#options.type,
        style: this.#options.style,
        borderRadius: this.#options.borderRadius,
        transaction: this.#transaction.details,
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

  // TODO: Update might not make sense for apple pay
  update(options?: ApplePayOptions) {
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
}
