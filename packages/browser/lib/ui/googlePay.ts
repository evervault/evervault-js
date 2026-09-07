import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type {
  SelectorType,
  GooglePayOptions,
  GooglePayClientMessages,
  GooglePayDataChangeRequest,
  GooglePayDataChangeUpdate,
  GooglePayHostMessages,
  GooglePayErrorMessage,
} from "types";
import { Transaction } from "../resources/transaction";
import { getStringDimensionOrDefault } from "../utils";

interface GooglePayEvents {
  ready: () => void;
  success: () => void;
  error: (error: string) => void;
  cancel: () => void;
}

export default class GooglePay {
  #transaction: Transaction;
  #options: GooglePayOptions;
  #frame: EvervaultFrame<GooglePayClientMessages, GooglePayHostMessages>;
  #events = new EventManager<GooglePayEvents>();

  constructor(
    client: EvervaultClient,
    transaction: Transaction,
    options: GooglePayOptions
  ) {
    this.#options = options;
    this.#transaction = transaction;
    this.#frame = new EvervaultFrame(client, "GooglePay", {
      size: {
        width: getStringDimensionOrDefault(options.size?.width, "250px"),
        height: getStringDimensionOrDefault(options.size?.height, "45px"),
      },
      allow: "payment *",
      colorScheme: this.#options.colorScheme,
    });

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
    });

    this.#frame.on("EV_GOOGLE_PAY_AUTH", async (payload) => {
      try {
        let failed = false;
        await this.#options.process(payload, {
          fail: (err: GooglePayErrorMessage) => {
            failed = true;
            this.#frame.send("EV_GOOGLE_PAY_AUTH_ERROR", err);
          },
        });

        if (failed) return;
        this.#frame.send("EV_GOOGLE_PAY_AUTH_COMPLETE");
      } catch {
        this.#frame.send("EV_GOOGLE_PAY_AUTH_ERROR", {
          reason: "PAYMENT_DATA_INVALID",
          message: "Something went wrong, please try again",
          intent: "PAYMENT_AUTHORIZATION",
        });
      }
    });

    this.#frame.on("EV_GOOGLE_PAY_DATA_CHANGE", async (payload) => {
      this.#frame.send(
        "EV_GOOGLE_PAY_DATA_CHANGE_RESULT",
        await this.#handleDataChange(payload)
      );
    });

    this.#frame.on("EV_GOOGLE_PAY_CANCELLED", () => {
      this.#events.dispatch("cancel");
    });

    this.#frame.on("EV_GOOGLE_PAY_ERROR", (error) => {
      this.#events.dispatch("error", error);
    });

    this.#frame.on("EV_GOOGLE_PAY_SUCCESS", () => {
      this.#events.dispatch("success");
    });
  }

  /**
   * Runs the merchant's shipping callback for one sheet selection. The reply
   * always carries the request's id, so the frame can match it even when the
   * buyer changes their mind mid-sheet and several are in flight.
   */
  async #handleDataChange(payload: GooglePayDataChangeRequest) {
    try {
      const update = await this.#runDataChangeCallback(payload);
      return { id: payload.id, ...(update ?? {}) };
    } catch {
      return {
        id: payload.id,
        error: {
          reason: "OTHER_ERROR" as const,
          message: "Something went wrong, please try again",
        },
      };
    }
  }

  #runDataChangeCallback(
    payload: GooglePayDataChangeRequest
  ): Promise<GooglePayDataChangeUpdate | void> | undefined {
    if (payload.trigger === "SHIPPING_OPTION") {
      if (!payload.shippingOptionId) return undefined;
      return this.#options.onShippingOptionChange?.(payload.shippingOptionId);
    }

    if (!payload.shippingAddress) return undefined;
    return this.#options.onShippingAddressChange?.(payload.shippingAddress);
  }

  get config() {
    return {
      config: {
        transaction: this.#transaction.details,
        type: this.#options.type,
        color: this.#options.color,
        locale: this.#options.locale,
        borderRadius: this.#options.borderRadius,
        allowedAuthMethods: this.#options.allowedAuthMethods,
        allowedCardNetworks: this.#options.allowedCardNetworks,
        billingAddress: this.#options.billingAddress,
        shippingAddress: this.#options.shippingAddress,
        shippingOptions: this.#options.shippingOptions,
        emailRequired: this.#options.emailRequired,
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

  on<T extends keyof GooglePayEvents>(event: T, callback: GooglePayEvents[T]) {
    return this.#events.on(event, callback);
  }
}
