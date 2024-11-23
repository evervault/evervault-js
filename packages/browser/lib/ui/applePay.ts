import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type {
  SelectorType,
  ApplePayOptions,
  ApplePayClientMessages,
  ApplePayHostMessages,
  ApplePayErrorMessage,
} from "types";
import { Transaction } from "../resources/transaction";

interface ApplePayEvents {
  ready: () => void;
  success: () => void;
  error: () => void;
  cancel: () => void;
}

export default class ApplePay {
  #transaction: Transaction;
  #options: ApplePayOptions;
  #frame: EvervaultFrame<ApplePayClientMessages, ApplePayHostMessages>;
  #events = new EventManager<ApplePayEvents>();

  constructor(
    client: EvervaultClient,
    transaction: Transaction,
    options: ApplePayOptions
  ) {
    this.#options = options;
    this.#transaction = transaction;
    this.#frame = new EvervaultFrame(client, "ApplePay", {
      size: {
        width: options.size?.width || "150px",
        height: options.size?.height || "50px",
      },
    });

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
    });

    this.#frame.on("EV_APPLE_PAY_AUTH", async (payload) => {
      try {
        let failed = false;
        await this.#options.process(payload, {
          fail: (err: ApplePayErrorMessage) => {
            failed = true;
            this.#frame.send("EV_APPLE_PAY_AUTH_ERROR", err);
          },
        });

        if (failed) return;
        this.#frame.send("EV_APPLE_PAY_COMPLETION");
      } catch {
        const error: ApplePayError = {
          code: "unknown",
          message: "Something went wrong, please try again",
        };

        this.#frame.send("EV_APPLE_PAY_AUTH_ERROR", error);
      }
    });

    this.#frame.on("EV_APPLE_PAY_CANCELLED", () => {
      this.#events.dispatch("cancel");
    });

    this.#frame.on("EV_APPLE_PAY_ERROR", (error) => {
      this.#events.dispatch("error", error);
    });

  }

  get config() {
    return {
      config: {
        type: this.#options.type,
        style: this.#options.style,
        locale: this.#options.locale,
        borderRadius: this.#options.borderRadius,
        allowedCardNetworks: this.#options.allowedCardNetworks,
        transaction: this.#transaction.details,
        paymentRequest: this.#options.paymentRequest,
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

  on<T extends keyof ApplePayEvents>(event: T, callback: ApplePayEvents[T]) {
    return this.#events.on(event, callback);
  }
}
