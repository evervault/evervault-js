import EvervaultClient from "../../main";
import type {
  ApplePayErrorMessage,
  EncryptedApplePayData,
  MerchantDetail,
  SelectorType,
  TransactionLineItem,
} from "types";
import { resolveSelector } from "../utils";
import {
  buildSession,
  BuildSessionOptions,
  buildSessionDetails,
  fetchSessionMerchant,
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

const SCRIPT_LOAD_TIMEOUT = 10000;

let sdkLoadPromise: Promise<void> | null = null;

function isApplePaySDKReady() {
  return (
    typeof ApplePaySession !== "undefined" &&
    typeof ApplePaySession.applePayCapabilities === "function"
  );
}

function isApplePayButtonDefined() {
  return (
    typeof customElements !== "undefined" &&
    customElements.get("apple-pay-button") !== undefined
  );
}

function loadApplePaySDK(): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;

  const loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${APPLE_PAY_SCRIPT_URL}"]`
    );

    if (existing && isApplePayButtonDefined()) {
      resolve();
      return;
    }

    const script = existing ?? document.createElement("script");
    const fail = (error: Error) => {
      clearTimeout(timeoutId);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
      if (!existing) script.remove();
      reject(error);
    };
    const onLoad = () => {
      clearTimeout(timeoutId);
      script.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => fail(new Error("Apple Pay SDK script load failed"));
    const timeoutId = setTimeout(() => {
      if (isApplePayButtonDefined()) {
        resolve();
        return;
      }

      fail(new Error("Apple Pay SDK script load timeout"));
    }, SCRIPT_LOAD_TIMEOUT);

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    if (!existing) {
      script.src = APPLE_PAY_SCRIPT_URL;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  });

  const sharedPromise = loadPromise.catch((error) => {
    if (sdkLoadPromise === sharedPromise) sdkLoadPromise = null;
    throw error;
  });
  sdkLoadPromise = sharedPromise;

  return sharedPromise;
}

/** Test-only: drops the shared SDK load so each test is isolated */
export function resetApplePaySDKLoader() {
  sdkLoadPromise = null;
}

type ApiErrorBody = { detail?: string; title?: string };

async function credentialsFailureMessage(res: Response): Promise<string> {
  const [body] = await tryCatch<ApiErrorBody>(res.json());
  const detail = body?.detail ?? body?.title;

  return detail
    ? `Apple Pay credentials exchange failed (${res.status}): ${detail}`
    : `Apple Pay credentials exchange failed (${res.status})`;
}

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
  #activeSession: PaymentRequest | null = null;
  #sessionInProgress = false;
  #merchant: MerchantDetail | null = null;
  #merchantPromise: Promise<MerchantDetail> | null = null;
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
    void loadApplePaySDK().catch(() => {});
  }

  #loadMerchant(): Promise<MerchantDetail> {
    if (!this.#merchantPromise) {
      const merchantPromise = fetchSessionMerchant(
        this,
        this.transaction.details.merchantId
      )
        .then((merchant) => {
          this.#merchant = merchant;
          return merchant;
        })
        .catch((error) => {
          // Don't cache a failed fetch, so the next click retries.
          if (this.#merchantPromise === merchantPromise) {
            this.#merchantPromise = null;
          }
          throw error;
        });
      this.#merchantPromise = merchantPromise;
    }

    return this.#merchantPromise;
  }

  #sessionConfig(): BuildSessionOptions {
    return {
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
    };
  }

  // Safari rejects show() once the click's user activation expires, so
  // nothing in this method may await before show(). Data that is not ready
  // yet reaches the open sheet through show(detailsPromise).
  #handleClick() {
    if (this.#sessionInProgress) {
      return;
    }

    const config = this.#sessionConfig();
    const deferDetails =
      !this.#merchant || Boolean(this.#options.prepareTransaction);
    const merchant = this.#merchant ?? {
      id: this.transaction.details.merchantId,
      name: this.transaction.details.domain,
    };

    let session: PaymentRequest;
    try {
      session = buildSession(this, config, merchant);
    } catch (error) {
      this.#events.dispatch("error", (error as Error).message);
      return;
    }

    // Read only once show() rejects, so a pending prepareTransaction never
    // delays a user cancel.
    let detailsError: Error | null = null;
    const detailsPromise = deferDetails
      ? this.#resolveDetails(config, merchant).catch((error: Error) => {
          detailsError = error;
          throw error;
        })
      : null;

    this.#sessionInProgress = true;

    // apple-pay-sdk.js (Chrome + phone QR) puts show() on the instance and ignores
    // a details promise. It has no click deadline, so resolve the details and
    // show a fresh session.
    if (
      detailsPromise &&
      Object.prototype.hasOwnProperty.call(session, "show")
    ) {
      const showPromise = detailsPromise.then(() => {
        const resolved = buildSession(this, config, merchant);
        this.#activeSession = resolved;
        return resolved.show();
      });
      void this.#completeSession(showPromise, () => detailsError);
      return;
    }

    this.#activeSession = session;
    const showPromise = detailsPromise
      ? session.show(detailsPromise)
      : session.show();

    void this.#completeSession(showPromise, () => detailsError);
  }

  async #resolveDetails(
    config: BuildSessionOptions,
    sessionMerchant: MerchantDetail
  ): Promise<PaymentDetailsUpdate> {
    const [merchant, prepared] = await Promise.all([
      this.#loadMerchant(),
      this.#options.prepareTransaction?.(),
    ]);

    if (prepared?.amount) {
      this.transaction.details.amount = prepared.amount;
    }

    if (prepared?.lineItems) {
      this.transaction.details.lineItems = prepared.lineItems;
    }

    // In place, because the sheet's update handlers hold this object.
    Object.assign(sessionMerchant, merchant);
    return buildSessionDetails(sessionMerchant, config);
  }

  async #completeSession(
    showPromise: Promise<PaymentResponse>,
    detailsError: () => Error | null
  ) {
    try {
      const [response, responseError] = await tryCatch(showPromise);

      this.#activeSession = null;

      if (responseError) {
        // A rejected details promise aborts the sheet, but the cause is the
        // failed fetch or prepareTransaction, not the user.
        const cause = detailsError();
        if (cause) {
          this.#events.dispatch("error", cause.message);
          return;
        }

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
        await response.complete("fail");
        return;
      }

      if (response.details.billingContact) {
        encrypted.billingContact = response.details.billingContact;
      }

      if (response.details.shippingContact) {
        encrypted.shippingContact = response.details.shippingContact;
      }

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

    if (!res.ok) {
      throw new Error(await credentialsFailureMessage(res));
    }

    const [encrypted] = await tryCatch<EncryptedApplePayData>(res.json());

    if (!encrypted?.card) {
      throw new Error(
        "Apple Pay credentials exchange returned no card credentials"
      );
    }

    return encrypted;
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
    if (!this.#activeSession) {
      return;
    }

    try {
      await this.#activeSession.abort();
    } catch (error) {
      if (error instanceof DOMException && error.name === "InvalidStateError") {
        return;
      }
      throw error;
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
      this.#availabilityPromise = this.#computeAvailability()
        .then((result) => {
          // The SDK may not have defined ApplePaySession yet. Do not cache
          // this ambiguous result, so a later call can re-probe.
          if (result === "unsupported" && !isApplePaySDKReady()) {
            this.#availabilityPromise = null;
          }

          return result;
        })
        .catch((error) => {
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
    if (!isApplePaySDKReady()) await loadApplePaySDK();

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

    // Fetch now so the click handler has the merchant before the user clicks.
    void this.#loadMerchant().catch(() => {});

    await loadApplePaySDK();

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
