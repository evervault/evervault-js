import EvervaultClient from "../../main";
import type { SelectorType } from "types";
import { resolveSelector } from "../utils";
import { Transaction } from "../../resources/transaction";
import { buildSession } from "./utilities";
import EventManager from "../eventManager";

const API = import.meta.env.VITE_API_URL || "https://api.evervault.com";
const APPLE_PAY_SCRIPT_URL =
  "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";

type ApplePayButtonType =
  | "add-money"
  | "book"
  | "buy"
  | "check-out"
  | "continue"
  | "contribute"
  | "donate"
  | "order"
  | "pay"
  | "plain"
  | "reload"
  | "rent"
  | "set-up"
  | "subscribe"
  | "support"
  | "tip"
  | "top-up";

type ApplePayButtonStyle = "black" | "white" | "white-outline";

type ApplePayButtonLocale =
  | "ar-AB"
  | "ca-ES"
  | "cs-CZ"
  | "da-DK"
  | "de-DE"
  | "el-GR"
  | "en-AU"
  | "en-GB"
  | "en-US"
  | "es-ES"
  | "es-MX"
  | "fi-FI"
  | "fr-CA"
  | "fr-FR"
  | "he-IL"
  | "hi-IN"
  | "hr-HR"
  | "hu-HU"
  | "id-ID"
  | "it-IT"
  | "ja-JP"
  | "ko-KR"
  | "ms-MY"
  | "nb-NO"
  | "nl-NL"
  | "pl-PL"
  | "pt-BR"
  | "pt-PT"
  | "ro-RO"
  | "ru-RU"
  | "sk-SK"
  | "sv-SE"
  | "th-TH"
  | "tr-TR"
  | "uk-UA"
  | "vi-VN"
  | "zh-CN"
  | "zh-HK"
  | "zh-TW";

type ApplePayCardNetwork =
  | "amex"
  | "bancomat"
  | "bancontact"
  | "cartesBancaires"
  | "chinaUnionPay"
  | "dankort"
  | "discover"
  | "eftpos"
  | "electron"
  | "elo"
  | "girocard"
  | "interac"
  | "jcb"
  | "mada"
  | "maestro"
  | "masterCard"
  | "mir"
  | "privateLabel"
  | "visa"
  | "vPay";

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
      fail: () => void;
    }
  ) => Promise<void>;
};

interface ApplePayEvents {
  success: () => void;
  error: () => void;
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
    try {
      const merchant = await this.#getMerchant();

      const session = buildSession(this.client.config.appId, merchant, {
        transaction: this.transaction.details,
        allowedCardNetworks: this.#options.allowedCardNetworks,
        requestPayerDetails: this.#options.requestPayerDetails,
        paymentOverrides: this.#options.paymentOverrides,
        disbursementOverrides: this.#options.disbursementOverrides,
      });

      const response = await session.show();

      const encrypted = await this.#exchangeApplePaymentData(response);

      let failed = false;

      await this.#options.process(encrypted, {
        fail: () => {
          failed = true;
        },
      });

      if (failed) {
        await response.complete("fail");
        this.#events.dispatch("error");
      } else {
        this.#events.dispatch("success");
        await response.complete("success");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        this.#events.dispatch("cancel");
      }
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

  async #exchangeApplePaymentData(response) {
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

  on(event: keyof ApplePayEvents, callback: () => void) {
    return this.#events.on(event, callback);
  }

  mount(selector: SelectorType) {
    console.log("mount");
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
