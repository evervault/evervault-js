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

const SHIPPING_CALLBACK_TIMEOUT_MS = 10_000;

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
    validateShippingOptions(options.shippingOptions);
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
      const callbackResult = this.#runDataChangeCallback(payload);
      const update = await resolveWithin(
        callbackResult,
        SHIPPING_CALLBACK_TIMEOUT_MS
      );
      validateShippingOptions(update?.shippingOptions);
      return { ...(update ?? {}), id: payload.id };
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
  ):
    | GooglePayDataChangeUpdate
    | void
    | Promise<GooglePayDataChangeUpdate | void> {
    const context = {
      trigger: payload.trigger,
      shippingAddress: payload.shippingAddress,
      selectedShippingOption: payload.selectedShippingOption,
      amount: payload.amount,
      lineItems: payload.lineItems,
      shippingOptions: payload.shippingOptions,
    };

    if (payload.trigger === "SHIPPING_OPTION") {
      if (!payload.selectedShippingOption) return undefined;
      return this.#options.onShippingOptionChange?.(
        payload.selectedShippingOption,
        context
      );
    }

    if (!payload.shippingAddress) return undefined;
    return this.#options.onShippingAddressChange?.(
      payload.shippingAddress,
      context
    );
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

async function resolveWithin<T>(
  value: T | Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error("Google Pay shipping callback timed out")),
      timeoutMs
    );
  });

  try {
    return await Promise.race([Promise.resolve(value), expired]);
  } finally {
    clearTimeout(timeout);
  }
}

function validateShippingOptions(
  shippingOptions: GooglePayOptions["shippingOptions"]
) {
  if (!shippingOptions) return;
  if (shippingOptions.options.length === 0) {
    throw new Error(
      "Google Pay shippingOptions must contain at least one option"
    );
  }

  const ids = new Set<string>();
  for (const option of shippingOptions.options) {
    if (!option.id.trim()) {
      throw new Error("Google Pay shipping option ids must not be empty");
    }
    if (!option.label.trim()) {
      throw new Error("Google Pay shipping option labels must not be empty");
    }
    if (ids.has(option.id)) {
      throw new Error("Google Pay shipping option ids must be unique");
    }
    ids.add(option.id);
  }

  if (
    shippingOptions.defaultSelectedOptionId !== undefined &&
    !ids.has(shippingOptions.defaultSelectedOptionId)
  ) {
    throw new Error(
      "Google Pay defaultSelectedOptionId must match a shipping option id"
    );
  }
}
