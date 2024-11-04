import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type { SelectorType, GooglePayOptions } from "types";
import { Transaction } from "../resources/transaction";

export default class GooglePay {
  #transaction: Transaction;
  #options: GooglePayOptions;
  #frame: EvervaultFrame;
  #events = new EventManager();

  constructor(
    client: EvervaultClient,
    transaction: Transaction,
    options: GooglePayOptions
  ) {
    this.#options = options;
    this.#transaction = transaction;
    this.#frame = new EvervaultFrame(client, "GooglePay");

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
    });

    this.#frame.on("EV_GOOGLE_PAY_AUTH", async (payload) => {
      await this.#options.process(payload);
      this.#frame.send("EV_GOOGLE_PAY_AUTH_COMPLETE");
    });
  }

  get config() {
    return {
      config: {
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

  update(options?: GooglePayOptions) {
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
