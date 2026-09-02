import EvervaultClient from "../../main";
import type {
  ApplePayErrorMessage,
  EncryptedApplePayData,
  SelectorType,
  TransactionLineItem,
} from "types";
import { resolveSelector } from "../utils";
import {
  buildSession,
  resolveMerchantIdentifier,
  mapTransactionType,
  resolveUnit,
} from "./utilities";
import EventManager from "../eventManager";
import {
  ApplePayButtonLocale,
  ApplePayButtonStyle,
  ApplePayButtonType,
  ApplePayCardNetwork,
  ApplePayShippingMethod,
  ApplePayShippingType,
  CouponCodeChangeResult,
  PaymentContact,
  PaymentMethodUpdate,
  ShippingAddress,
} from "./types";
import { tryCatch } from "../../utilities";
import { Transaction } from "../../resources/transaction";

const APPLE_PAY_SCRIPT_URL =
  "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";

export type ApplePayButtonOptions = {
  type?: ApplePayButtonType;
  style?: ApplePayButtonStyle;
  locale?: ApplePayButtonLocale;
  padding?: string;
  borderRadius?: string | number;
  size?: { width: string | number; height: string | number };
  allowedCardNetworks?: ApplePayCardNetwork[];
  requestPayerDetails?: ("name" | "email" | "phone" | "postalAddress")[];
  requestBillingAddress?: boolean;
  requestShipping?: boolean;
  paymentOverrides?: {
    paymentMethodData?: PaymentMethodData[];
    paymentDetails?: PaymentDetailsInit;
  };
  disbursementOverrides?: {
    disbursementDetails?: PaymentDetailsInit;
  };
  onPaymentMethodChange?: (
    newPaymentMethod: PaymentMethodUpdate
  ) => Promise<{ amount: number; lineItems?: TransactionLineItem[] }>;
  onShippingAddressChange?: (
    newAddress: ShippingAddress
  ) => Promise<{ amount: number; lineItems?: TransactionLineItem[] }>;
  /**
   * Shipping type label on the Apple Pay sheet (shipping / delivery / pickup).
   * Payment (one-off) transactions only — rejected for recurring and disbursement.
   */
  shippingType?: ApplePayShippingType;
  /**
   * Shipping methods shown as selectable options on the Apple Pay sheet.
   * Requires `requestShipping: true` (auto-enabled when methods are provided).
   * Payment (one-off) transactions only — rejected for recurring and disbursement.
   *
   * When the customer selects a method, totals are recomputed. Provide
   * `onShippingMethodSelected` to control the amount/line items yourself;
   * otherwise the SDK adjusts the total by the selected method's amount.
   */
  shippingMethods?: ApplePayShippingMethod[];
  /**
   * Called when the customer selects a shipping method on the sheet.
   * Return updated totals. Maps to PaymentRequest `shippingoptionchange`.
   * Requires `shippingMethods` (and shipping to be requested).
   */
  onShippingMethodSelected?: (
    shippingMethod: ApplePayShippingMethod
  ) => Promise<{ amount: number; lineItems?: TransactionLineItem[] }>;
  /**
   * Show the coupon field on the Apple Pay sheet and receive updates when the
   * customer changes the code. Maps to ApplePayRequest.supportsCouponCode /
   * couponCode on the PaymentRequest bridge.
   */
  supportsCouponCode?: boolean;
  /** Initial coupon code shown in the sheet when supportsCouponCode is true. */
  couponCode?: string;
  /**
   * Called when the customer changes the coupon on the sheet.
   * Return updated totals, and optionally `error` to show an invalid/expired
   * coupon message in the native Apple Pay UI.
   */
  onCouponCodeChange?: (couponCode: string) => Promise<CouponCodeChangeResult>;
  /**
   * Prefill billing contact on the Apple Pay sheet (ApplePayRequest.billingContact).
   * Requires `requestBillingAddress: true` for the postal address to actually show.
   *
   * Payment and recurring transactions only. Apple Pay disbursements use a
   * separate recipient-contact model (`requiredRecipientDetails` on the
   * transaction) — this field has no effect on disbursement-type transactions.
   */
  billingContact?: PaymentContact;
  /**
   * Prefill shipping contact on the Apple Pay sheet (ApplePayRequest.shippingContact).
   * Requires `requestShipping: true` for the postal address to actually show.
   *
   * Payment and recurring transactions only. Apple Pay disbursements use a
   * separate recipient-contact model (`requiredRecipientDetails` on the
   * transaction) — this field has no effect on disbursement-type transactions.
   */
  shippingContact?: PaymentContact;
  /**
   * Opaque merchant data included on the Apple Pay request
   * (ApplePayRequest.applicationData). Must be a Base64-encoded string.
   */
  applicationData?: string;
  /**
   * Restrict payments to cards issued in these ISO 3166 country codes
   * (ApplePayRequest.supportedCountries).
   */
  supportedCountries?: string[];
  prepareTransaction?: () => Promise<{
    amount?: number;
    lineItems?: TransactionLineItem[];
  }>;
  appleMerchantId?: string;
  process: (
    data: EncryptedApplePayData,
    helpers: {
      fail: (error?: ApplePayErrorMessage) => void;
    }
  ) => Promise<void>;
};

interface ApplePayEvents {
  ready: () => void;
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
  #scriptLoaded = false;
  #scriptLoadPromise: Promise<void>;
  #resolveScriptLoad!: () => void;
  #activeSession: PaymentRequest | null = null;
  #abortRequested = false;
  #sessionInProgress = false;
  #showStarted = false;
  #availabilityPromise: Promise<
    "available" | "unavailable" | "unsupported"
  > | null = null;

  constructor(
    client: EvervaultClient,
    transaction: Transaction,
    options: ApplePayButtonOptions
  ) {
    this.client = client;
    this.#options = options;
    this.transaction = transaction;
    this.#scriptLoadPromise = new Promise((resolve) => {
      this.#resolveScriptLoad = resolve;
    });
    this.#injectScript();
  }

  #injectScript() {
    const selector = `script[src="${APPLE_PAY_SCRIPT_URL}"]`;
    const existing = document.querySelector(selector);
    if (existing) {
      this.#scriptLoaded = true;
      this.#resolveScriptLoad();
      return;
    }

    const script = document.createElement("script");
    script.src = APPLE_PAY_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      this.#scriptLoaded = true;
      this.#resolveScriptLoad();
    };

    document.body.appendChild(script);
  }

  async #handleClick() {
    this.#abortRequested = false;
    this.#sessionInProgress = true;

    try {
      if (this.#options.prepareTransaction) {
        const { amount, lineItems } = await this.#options.prepareTransaction();
        if (this.#abortRequested) {
          this.#events.dispatch("cancel");
          return;
        }

        if (amount) {
          this.transaction.details.amount = amount;
        }

        if (lineItems) {
          this.transaction.details.lineItems = lineItems;
        }
      }

      const session = await buildSession(this, {
        transaction: this.transaction.details,
        allowedCardNetworks: this.#options.allowedCardNetworks,
        requestPayerDetails: this.#options.requestPayerDetails,
        paymentOverrides: this.#options.paymentOverrides,
        disbursementOverrides: this.#options.disbursementOverrides,
        requestBillingAddress: this.#options.requestBillingAddress,
        requestShipping: this.#options.requestShipping,
        shippingType: this.#options.shippingType,
        shippingMethods: this.#options.shippingMethods,
        onPaymentMethodChange: this.#options.onPaymentMethodChange,
        onShippingAddressChange: this.#options.onShippingAddressChange,
        onShippingMethodSelected: this.#options.onShippingMethodSelected,
        supportsCouponCode: this.#options.supportsCouponCode,
        couponCode: this.#options.couponCode,
        onCouponCodeChange: this.#options.onCouponCodeChange,
        billingContact: this.#options.billingContact,
        shippingContact: this.#options.shippingContact,
        applicationData: this.#options.applicationData,
        supportedCountries: this.#options.supportedCountries,
        prepareTransaction: this.#options.prepareTransaction,
        appleMerchantId: this.#options.appleMerchantId,
      });

      if (this.#abortRequested) {
        this.#events.dispatch("cancel");
        return;
      }

      this.#activeSession = session;
      this.#showStarted = true;

      const [response, responseError] = await tryCatch(session.show());

      this.#activeSession = null;

      if (responseError) {
        if (responseError.name === "AbortError") {
          this.#events.dispatch("cancel");
          return;
        }

        this.#events.dispatch("error", responseError.message);
        return;
      }

      const paymentMethodDisplayName =
        response.details?.token?.paymentMethod?.displayName;
      const paymentMethodType = response.details?.token?.paymentMethod?.type;

      const [encrypted, encryptedError] = await tryCatch(
        this.#exchangeApplePaymentData(response)
      );

      if (encryptedError) {
        this.#events.dispatch("error", encryptedError.message);
        return;
      }

      if (response.details.billingContact) {
        encrypted.billingContact = response.details.billingContact;
      }

      if (response.details.shippingContact) {
        encrypted.shippingContact = response.details.shippingContact;
      }

      // Safari fulfils requestPayerName/Email/Phone via the Apple Pay shipping
      // contact and mirrors them onto the flat PaymentResponse payer fields.
      // Forward those so callers using `requestPayerDetails` get the values
      // under matching names, in addition to `shippingContact`.
      const { payerName, payerEmail, payerPhone } =
        response as PaymentResponse & {
          payerName?: string | null;
          payerEmail?: string | null;
          payerPhone?: string | null;
        };

      if (payerName) {
        encrypted.payerName = payerName;
      }

      if (payerEmail) {
        encrypted.payerEmail = payerEmail;
      }

      if (payerPhone) {
        encrypted.payerPhone = payerPhone;
      }

      const shippingOptionId = (
        response as PaymentResponse & { shippingOption?: string | null }
      ).shippingOption;

      if (shippingOptionId) {
        const selectedMethod = this.#options.shippingMethods?.find(
          (method) => method.id === shippingOptionId
        );
        if (selectedMethod) {
          encrypted.shippingMethod = {
            id: selectedMethod.id,
            label: selectedMethod.label,
            amount: selectedMethod.amount,
            detail: selectedMethod.detail,
          };
        } else {
          console.warn(
            `[Evervault Apple Pay] PaymentResponse.shippingOption "${shippingOptionId}" ` +
              "did not match any configured shippingMethods. " +
              "Returning a placeholder shippingMethod with amount 0."
          );
          encrypted.shippingMethod = {
            id: shippingOptionId,
            label: shippingOptionId,
            amount: 0,
          };
        }
      }

      encrypted.transactionType = mapTransactionType(
        this.transaction.details.type
      );

      encrypted.card.displayName = paymentMethodDisplayName;
      if (paymentMethodType) {
        encrypted.card.paymentMethodType = paymentMethodType;
      }
      if (paymentMethodDisplayName) {
        const fourDigitRegex = /(\d{4})$/;
        const lastFour = paymentMethodDisplayName.match(fourDigitRegex);
        if (lastFour) {
          encrypted.card.lastFour = lastFour[0];
        }
      }

      let failed = false;

      await this.#options.process(encrypted, {
        fail: (error?: ApplePayErrorMessage) => {
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
    } finally {
      this.#activeSession = null;
      this.#sessionInProgress = false;
      this.#abortRequested = false;
      this.#showStarted = false;
    }
  }

  async #exchangeApplePaymentData(
    response: PaymentResponse
  ): Promise<EncryptedApplePayData> {
    const requestBody = {
      merchantId: this.transaction.details.merchantId,
      encryptedCredentials: response.details.token.paymentData,
    };

    const apiURL = this.client.config.http.apiUrl;
    const res = await fetch(`${apiURL}/frontend/apple-pay/credentials`, {
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

  /**
   * Programmatically dismiss the Apple Pay sheet while a session is active.
   * Maps to PaymentRequest.abort(). Fires the `cancel` event on success.
   * No-op if no session is in progress or abort is not possible.
   */
  async abort(): Promise<void> {
    if (!this.#sessionInProgress) {
      return;
    }

    if (this.#activeSession) {
      try {
        await this.#activeSession.abort();
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "InvalidStateError"
        ) {
          return;
        }
        throw error;
      }
      return;
    }

    if (this.#showStarted) {
      return;
    }

    this.#abortRequested = true;
  }

  async #waitForScript() {
    if (this.#scriptLoaded) return;
    const TIMEOUT = 10000;

    let timeoutId: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Apple Pay SDK script load timeout"));
      }, TIMEOUT);
    });

    try {
      await Promise.race([this.#scriptLoadPromise, timeout]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }

  /**
   * Checks the availability of Apple Pay on the current device.
   *
   * @returns {Promise<"available" | "unavailable" | "unsupported">} A promise that resolves to a string indicating the availability status of Apple Pay:
   * - "available": Apple Pay is available and can be used.
   * - "unavailable": Apple Pay is not available due to payment credentials being unavailable.
   * - "unsupported": Apple Pay is not supported on this device or browser.
   */
  async availability(): Promise<"available" | "unavailable" | "unsupported"> {
    if (!this.#availabilityPromise) {
      this.#availabilityPromise = this.#computeAvailability().catch((error) => {
        // Don't cache a failed probe — allow a later call to retry.
        this.#availabilityPromise = null;
        throw error;
      });
    }

    return this.#availabilityPromise;
  }

  async #computeAvailability(): Promise<
    "available" | "unavailable" | "unsupported"
  > {
    if (typeof window.PaymentRequest === "undefined") return "unsupported";
    await this.#waitForScript();

    if (
      typeof ApplePaySession === "undefined" ||
      typeof ApplePaySession.applePayCapabilities !== "function"
    ) {
      return "unsupported";
    }

    const capabilities = await ApplePaySession.applePayCapabilities(
      resolveMerchantIdentifier(
        this.transaction.details.merchantId,
        this.#options.appleMerchantId
      )
    );

    if (capabilities.paymentCredentialStatus === "applePayUnsupported") {
      return "unsupported";
    }

    if (
      capabilities.paymentCredentialStatus === "paymentCredentialsUnavailable"
    ) {
      return "unavailable";
    }

    return "available";
  }

  async mount(selector: SelectorType) {
    const availability = await this.availability();

    if (availability === "unsupported") {
      console.info("Apple Pay is not supported on this device.");
      return;
    }

    if (availability === "unavailable") {
      console.info("Apple Pay may be unavailable on this device.");
    }

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
        resolveUnit(this.#options.borderRadius)
      );
    }

    if (this.#options.size) {
      this.#button.style.setProperty(
        "--apple-pay-button-width",
        resolveUnit(this.#options.size.width)
      );
      this.#button.style.setProperty(
        "--apple-pay-button-height",
        resolveUnit(this.#options.size.height)
      );
    }

    this.#button.addEventListener("click", () => {
      this.#handleClick();
    });

    element.appendChild(this.#button);
    this.#events.dispatch("ready");
  }

  unmount() {
    void this.abort();

    if (this.#button) {
      this.#button.remove();
    }
  }
}
