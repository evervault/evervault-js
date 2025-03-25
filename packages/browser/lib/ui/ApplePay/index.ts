import EvervaultClient from "../../main";
import type { SelectorType } from "types";
import { resolveSelector } from "../utils";
import { Transaction } from "../../resources/transaction";
import { buildSession } from "./utilities";
import EventManager from "../eventManager";
import {
  ApplePayButtonLocale,
  ApplePayButtonStyle,
  ApplePayButtonType,
  ApplePayCardNetwork,
} from "./types";
import { tryCatch } from "../../utilities";

const API = import.meta.env.VITE_API_URL || "https://api.evervault.com";
const APPLE_PAY_SCRIPT_URL =
  "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";

interface ApplePayError {
  message: string;
}

export type ApplePayButtonOptions = {
  type?: ApplePayButtonType;
  style?: ApplePayButtonStyle;
  locale?: ApplePayButtonLocale;
  padding?: string;
  borderRadius?: string;
  size?: { width: string; height: string };
  allowedCardNetworks?: ApplePayCardNetwork[];
  requestPayerDetails?: ("name" | "email" | "phone")[];
  paymentOverrides?: {
    paymentMethodData?: PaymentMethodData[];
    paymentDetails?: PaymentDetailsInit;
  };
  disbursementOverrides?: {
    disbursementDetails?: PaymentDetailsInit;
  };
  process: (
    data: unknown,
    helpers: {
      fail: (error?: ApplePayError) => void;
    }
  ) => Promise<void>;
};

interface ApplePayEvents {
  success: () => void;
  error: (message?: string) => void;
  cancel: () => void;
}

export default class ApplePayButton {
  client: EvervaultClient;
  transaction: Transaction;
  #button: HTMLElement | null = null;
  #options: ApplePayButtonOptions;
  #events = new EventManager<ApplePayEvents>();

  constructor(
    client: EvervaultClient,
    transaction: Transaction,
    options: ApplePayButtonOptions
  ) {
    this.client = client;
    this.#options = options;
    this.transaction = transaction;
    this.#injectScript();
  }

  #injectScript() {
    const script = document.createElement("script");
    script.src = APPLE_PAY_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
  }

  async #handleClick() {
    const merchant = await this.#getMerchant();

    const session = buildSession(this.client.config.appId, merchant, {
      transaction: this.transaction.details,
      allowedCardNetworks: this.#options.allowedCardNetworks,
      requestPayerDetails: this.#options.requestPayerDetails,
      paymentOverrides: this.#options.paymentOverrides,
      disbursementOverrides: this.#options.disbursementOverrides,
    });

    const [response, responseError] = await tryCatch(session.show());

    if (responseError) {
      if (responseError.name === "AbortError") {
        this.#events.dispatch("cancel");
        return;
      }

      this.#events.dispatch("error", responseError.message);
      return;
    }

    const [encrypted, encryptedError] = await tryCatch(
      this.#exchangeApplePaymentData(response)
    );

    if (encryptedError) {
      this.#events.dispatch("error", encryptedError.message);
      return;
    }

    let failed = false;

    await this.#options.process(encrypted, {
      fail: (error?: ApplePayError) => {
        this.#events.dispatch("error", error?.message);
        failed = true;
      },
    });

    if (failed) {
      await response.complete("fail");
    } else {
      this.#events.dispatch("success");
      response.complete("success");
    }
  }

  async #getMerchant() {
    const id = this.transaction.details.merchantId;
    const response = await fetch(`${API}/frontend/merchants/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Evervault-App-Id": this.client.config.appId,
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch merchant details for ${id}`,

        response.status
      );
      return undefined;
    }

    return response.json();
  }

  async #exchangeApplePaymentData(response: PaymentResponse) {
    const requestBody = {
      merchantId: this.transaction.details.merchantId,
      encryptedCredentials: response.details.token.paymentData,
    };

    const res = await fetch(`${API}/frontend/apple-pay/credentials`, {
      method: "POST",
      headers: {
        "x-Evervault-App-Id": this.client.config.appId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    return res.json();
  }

  on(
    event: keyof ApplePayEvents,
    callback: ApplePayEvents[keyof ApplePayEvents]
  ) {
    return this.#events.on(event, callback);
  }

  mount(selector: SelectorType) {
    const element = resolveSelector(selector);
    this.#button = document.createElement("apple-pay-button");

    if (this.#options.type) {
      this.#button.setAttribute("type", this.#options.type);
    }

    if (this.#options.style) {
      this.#button.setAttribute("buttonstyle", this.#options.style);
    }

    if (this.#options.locale) {
      this.#button.setAttribute("locale", this.#options.locale);
    }

    if (this.#options.padding) {
      this.#button.style.setProperty(
        "--apple-pay-button-padding",
        this.#options.padding
      );
    }

    if (this.#options.borderRadius) {
      this.#button.style.setProperty(
        "--apple-pay-button-border-radius",
        this.#options.borderRadius
      );
    }

    if (this.#options.size) {
      this.#button.style.setProperty(
        "--apple-pay-button-width",
        this.#options.size.width
      );
      this.#button.style.setProperty(
        "--apple-pay-button-height",
        this.#options.size.height
      );
    }

    this.#button.addEventListener("click", () => {
      this.#handleClick();
    });

    element.appendChild(this.#button);
  }
}
