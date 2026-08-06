import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  describe,
  assert,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
} from "vitest";
import * as applePayUtilities from "../lib/ui/ApplePay/utilities";
import type { ApplePayMerchantCapability } from "types";
import ApplePayButton from "../lib/ui/ApplePay";
import { Transaction } from "../lib/resources/transaction";
import type EvervaultClient from "../lib/main";
import { setupCrypto } from "./setup";
import type { ApplePayPaymentDetailsInit } from "../lib/ui/ApplePay/types";

const {
  APPLE_PAY_MAX_VERSION,
  buildSession,
  mapTransactionType,
  resolveMerchantIdentifier,
  resolveDisbursementMerchantCapabilities,
  resolveApplePayVersion,
} = applePayUtilities;
const buildSessionMock = vi.fn();

const apiUrl = "https://api.test.evervault.com";
const app = "app_test123";
const merchantId = "merchant_abc";
const merchantName = "Acme Co";

const paymentRequestCalls: ApplePayPaymentDetailsInit[] = [];
const paymentMethodDataCalls: Array<{
  merchantIdentifier?: string;
  merchantCapabilities?: string[];
  supportsCouponCode?: boolean;
  couponCode?: string;
  billingContact?: unknown;
  shippingContact?: unknown;
  applicationData?: string;
  supportedCountries?: string[];
  version?: number;
}> = [];
const paymentOptionsCalls: Array<{
  requestShipping?: boolean;
  shippingType?: string;
}> = [];
const paymentRequestInstances: MockPaymentRequest[] = [];

class MockPaymentRequest {
  onshippingaddresschange: ((event: PaymentRequestUpdateEvent) => void) | null =
    null;
  onshippingoptionchange: ((event: PaymentRequestUpdateEvent) => void) | null =
    null;
  onpaymentmethodchange: ((event: PaymentMethodChangeEvent) => void) | null =
    null;
  onmerchantvalidation: ((event: unknown) => void) | null = null;
  shippingOption: string | null = null;

  constructor(
    methodData: Array<{
      data?: {
        merchantIdentifier?: string;
        merchantCapabilities?: string[];
        supportsCouponCode?: boolean;
        couponCode?: string;
        billingContact?: unknown;
        shippingContact?: unknown;
        applicationData?: string;
        supportedCountries?: string[];
        version?: number;
      };
    }>,
    details: ApplePayPaymentDetailsInit,
    options?: {
      requestShipping?: boolean;
      shippingType?: string;
    }
  ) {
    paymentMethodDataCalls.push(methodData[0]?.data ?? {});
    paymentRequestCalls.push(details);
    paymentOptionsCalls.push(options ?? {});
    paymentRequestInstances.push(this);
  }
}

const applePay = {
  client: { config: { appId: app, http: { apiUrl } } },
} as unknown as ApplePayButton;

const transaction = {
  type: "payment" as const,
  amount: 1000,
  currency: "USD",
  country: "US",
  merchantId,
  domain: "shop.example.com",
};

const recurringTransaction = {
  type: "recurring" as const,
  amount: 1000,
  currency: "USD",
  country: "US",
  merchantId,
  domain: "shop.example.com",
  managementURL: "https://shop.example.com/manage",
  billingAgreement: "Billed monthly",
  description: "Monthly plan",
  regularBilling: {
    label: "Monthly",
    amount: 1000,
    recurringPaymentStartDate: new Date("2026-01-01"),
    recurringPaymentIntervalUnit: "month" as const,
    recurringPaymentIntervalCount: 1,
  },
};

const disbursementTransaction = {
  type: "disbursement" as const,
  amount: 1000,
  currency: "USD",
  country: "US",
  merchantId,
  domain: "shop.example.com",
};

const server = setupServer();

beforeAll(() => {
  setupCrypto();
  (globalThis as unknown as { PaymentRequest: unknown }).PaymentRequest =
    MockPaymentRequest;
  (globalThis as unknown as { ApplePayError: unknown }).ApplePayError = class {
    code: string;
    contactField?: string;
    message: string;
    constructor(code: string, contactField?: string, message = "") {
      this.code = code;
      this.contactField = contactField;
      this.message = message;
    }
  };
  server.listen();
});

beforeEach(() => {
  paymentRequestCalls.length = 0;
  paymentMethodDataCalls.length = 0;
  paymentOptionsCalls.length = 0;
  paymentRequestInstances.length = 0;
  server.use(
    http.get(`${apiUrl}/frontend/merchants/${merchantId}`, () =>
      HttpResponse.json({ id: merchantId, name: merchantName }, { status: 200 })
    )
  );
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("buildSession sandbox label", () => {
  it("appends '(Card is not charged)' to the merchant name when is_sandbox is true", async () => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, () =>
        HttpResponse.json({ is_sandbox: true }, { status: 200 })
      )
    );

    await buildSession(applePay, { transaction });

    assert(
      paymentRequestCalls[0].total?.label ===
        `${merchantName} (Card is not charged)`
    );
  });

  it("leaves the merchant name unchanged when is_sandbox is false", async () => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, () =>
        HttpResponse.json({ is_sandbox: false }, { status: 200 })
      )
    );

    await buildSession(applePay, { transaction });

    assert(paymentRequestCalls[0].total?.label === merchantName);
  });
});

describe("buildSession GET concurrency", () => {
  it("issues the merchant and sdk-config requests concurrently, not sequentially", async () => {
    let resolveMerchant: () => void = () => {};
    const merchantGate = new Promise<void>((resolve) => {
      resolveMerchant = resolve;
    });
    let sdkConfigRequested = false;

    server.use(
      http.get(`${apiUrl}/frontend/merchants/${merchantId}`, async () => {
        await merchantGate;
        return HttpResponse.json(
          { id: merchantId, name: merchantName },
          { status: 200 }
        );
      }),
      http.get(`${apiUrl}/frontend/sdk/config`, () => {
        sdkConfigRequested = true;
        return HttpResponse.json({ is_sandbox: false }, { status: 200 });
      })
    );

    const buildSessionPromise = buildSession(applePay, { transaction });

    // If the two GETs were sequential, sdk-config would never be requested
    // while the merchant request is still gated open — this only resolves
    // if both requests are in flight concurrently.
    await vi.waitFor(() => {
      expect(sdkConfigRequested).toBe(true);
    });

    resolveMerchant();
    await buildSessionPromise;
  });
});

describe("buildSession onshippingaddresschange", () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, () =>
        HttpResponse.json({ is_sandbox: false }, { status: 200 })
      )
    );
  });

  const shippingAddress = {
    addressLine: ["1 Main St"],
    city: "Dublin",
    country: "Ireland",
    dependentLocality: "",
    organization: "",
    phone: "",
    postalCode: "D01",
    recipient: "Jane Doe",
    region: "Leinster",
    sortingCode: "",
  };

  it("does not throw and still calls updateWith when event.target is null", async () => {
    // Repro for a customer-reported crash on desktop Chrome + phone-QR Apple
    // Pay handoff: apple-pay-sdk.js's polyfill invokes onshippingaddresschange
    // with event.target === null in that remote-continuity flow, which threw
    // "Cannot read properties of null (reading 'shippingAddress')" and left
    // the sheet stuck on "Processing" since updateWith was never called.
    const onShippingAddressChange = vi.fn().mockResolvedValue({ amount: 500 });
    const request = await buildSession(applePay, {
      transaction,
      requestShipping: true,
      onShippingAddressChange,
    });

    const updateWith = vi.fn();
    const event = {
      target: null,
      updateWith,
    } as unknown as PaymentRequestUpdateEvent;

    expect(() => request.onshippingaddresschange?.(event)).not.toThrow();
    expect(updateWith).toHaveBeenCalled();
  });

  it("calls onShippingAddressChange and updateWith when a shipping address is present", async () => {
    const onShippingAddressChange = vi.fn().mockResolvedValue({ amount: 500 });
    const request = await buildSession(applePay, {
      transaction,
      requestShipping: true,
      onShippingAddressChange,
    });

    const updateWith = vi.fn();
    const event = {
      target: { shippingAddress },
      updateWith,
    } as unknown as PaymentRequestUpdateEvent;

    request.onshippingaddresschange?.(event);

    expect(onShippingAddressChange).toHaveBeenCalledWith(shippingAddress);
    expect(updateWith).toHaveBeenCalled();
  });
});

describe("resolveMerchantIdentifier", () => {
  it("returns the Evervault merchant identifier by default", () => {
    expect(resolveMerchantIdentifier("merchant_abc")).toBe(
      "merchant.com.evervault.merchant_abc"
    );
  });

  it("returns a custom Apple merchant identifier when provided", () => {
    expect(
      resolveMerchantIdentifier("merchant_abc", "merchant.com.example.store")
    ).toBe("merchant.com.example.store");
  });
});

describe("resolveDisbursementMerchantCapabilities", () => {
  const baseDisbursement = {
    type: "disbursement" as const,
    amount: 1000,
    currency: "USD",
    country: "US",
    merchantId,
    domain: "shop.example.com",
  };

  it("uses explicit merchantCapabilities when provided", () => {
    expect(
      resolveDisbursementMerchantCapabilities({
        ...baseDisbursement,
        merchantCapabilities: ["supportsEMV", "supportsCredit"],
      })
    ).toEqual(["supportsEMV", "supportsCredit"]);
  });

  it("defaults to supports3DS when no override or instant transfer", () => {
    expect(resolveDisbursementMerchantCapabilities(baseDisbursement)).toEqual([
      "supports3DS",
    ]);
  });

  it("adds supportsInstantFundsOut when instantTransfer is set", () => {
    expect(
      resolveDisbursementMerchantCapabilities({
        ...baseDisbursement,
        instantTransfer: { label: "Instant fee", amount: 50 },
      })
    ).toEqual(["supports3DS", "supportsInstantFundsOut"]);
  });
});

describe("buildSession appleMerchantId", () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, () =>
        HttpResponse.json({ is_sandbox: false }, { status: 200 })
      )
    );
  });

  it("uses a custom appleMerchantId in the PaymentRequest", async () => {
    await buildSession(applePay, {
      transaction,
      appleMerchantId: "merchant.com.example.custom",
    });

    assert(
      paymentMethodDataCalls[0].merchantIdentifier ===
        "merchant.com.example.custom"
    );
  });

  it("falls back to the Evervault merchant identifier when omitted", async () => {
    await buildSession(applePay, { transaction });

    assert(
      paymentMethodDataCalls[0].merchantIdentifier ===
        `merchant.com.evervault.${merchantId}`
    );
  });
});

describe("buildSession disbursement merchantCapabilities", () => {
  const disbursementTransaction = {
    type: "disbursement" as const,
    amount: 1000,
    currency: "USD",
    country: "US",
    merchantId,
    domain: "shop.example.com",
    merchantCapabilities: [
      "supportsDebit",
    ] satisfies ApplePayMerchantCapability[],
  };

  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, () =>
        HttpResponse.json({ is_sandbox: false }, { status: 200 })
      )
    );
  });

  it("passes explicit merchantCapabilities to the PaymentRequest", async () => {
    await buildSession(applePay, { transaction: disbursementTransaction });

    assert(
      paymentMethodDataCalls[0].merchantCapabilities?.[0] === "supportsDebit"
    );
  });
});

describe("mapTransactionType", () => {
  it("maps payment to oneOff", () => {
    expect(mapTransactionType("payment")).toBe("oneOff");
  });

  it("maps recurring to recurring", () => {
    expect(mapTransactionType("recurring")).toBe("recurring");
  });

  it("maps disbursement to disbursement", () => {
    expect(mapTransactionType("disbursement")).toBe("disbursement");
  });
});

describe("buildSession coupon codes", () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, () =>
        HttpResponse.json({ is_sandbox: false }, { status: 200 })
      )
    );
  });

  it("omits coupon fields when supportsCouponCode is not set", async () => {
    await buildSession(applePay, { transaction });

    expect(paymentMethodDataCalls[0].supportsCouponCode).toBeUndefined();
    expect(paymentMethodDataCalls[0].couponCode).toBeUndefined();
  });

  it("passes supportsCouponCode and couponCode on the PaymentRequest data", async () => {
    await buildSession(applePay, {
      transaction,
      supportsCouponCode: true,
      couponCode: "SAVE20",
    });

    expect(paymentMethodDataCalls[0].supportsCouponCode).toBe(true);
    expect(paymentMethodDataCalls[0].couponCode).toBe("SAVE20");
  });

  it("defaults couponCode to an empty string when supportsCouponCode is true", async () => {
    await buildSession(applePay, {
      transaction,
      supportsCouponCode: true,
    });

    expect(paymentMethodDataCalls[0].supportsCouponCode).toBe(true);
    expect(paymentMethodDataCalls[0].couponCode).toBe("");
  });

  it("calls onCouponCodeChange from shippingaddresschange and always updateWith", async () => {
    const onCouponCodeChange = vi.fn().mockResolvedValue({
      amount: 800,
      lineItems: [
        { label: "Item", amount: 1000 },
        { label: "Coupon", amount: -200 },
      ],
    });

    await buildSession(applePay, {
      transaction,
      supportsCouponCode: true,
      onCouponCodeChange,
    });

    const session = paymentRequestInstances[0];
    const updateWith = vi.fn();
    session.onshippingaddresschange?.({
      target: {},
      methodDetails: { couponCode: "SAVE20" },
      updateWith,
    } as unknown as PaymentRequestUpdateEvent);

    expect(onCouponCodeChange).toHaveBeenCalledWith("SAVE20");
    expect(updateWith).toHaveBeenCalledTimes(1);

    const update = await updateWith.mock.calls[0][0];
    expect(update.total?.amount.value).toBe("8.00");
    expect(update.displayItems).toHaveLength(2);
  });

  it("calls onCouponCodeChange from paymentmethodchange", async () => {
    const onCouponCodeChange = vi.fn().mockResolvedValue({ amount: 900 });

    await buildSession(applePay, {
      transaction,
      supportsCouponCode: true,
      onCouponCodeChange,
    });

    const session = paymentRequestInstances[0];
    const updateWith = vi.fn();
    session.onpaymentmethodchange?.({
      methodDetails: { couponCode: "SAVE10" },
      updateWith,
    } as unknown as PaymentMethodChangeEvent);

    expect(onCouponCodeChange).toHaveBeenCalledWith("SAVE10");
    const update = await updateWith.mock.calls[0][0];
    expect(update.total?.amount.value).toBe("9.00");
    expect(update.displayItems).toEqual([]);
  });

  it("does not route coupon updates to onPaymentMethodChange when onCouponCodeChange is missing", async () => {
    const onPaymentMethodChange = vi.fn().mockResolvedValue({ amount: 1000 });

    await buildSession(applePay, {
      transaction,
      supportsCouponCode: true,
      onPaymentMethodChange,
    });

    const session = paymentRequestInstances[0];
    const updateWith = vi.fn();
    session.onpaymentmethodchange?.({
      methodDetails: { couponCode: "SAVE20" },
      updateWith,
    } as unknown as PaymentMethodChangeEvent);

    expect(onPaymentMethodChange).not.toHaveBeenCalled();
    expect(updateWith).toHaveBeenCalledWith({});
  });

  it("does not treat coupon updates as shipping changes when onCouponCodeChange is missing", async () => {
    const onShippingAddressChange = vi.fn().mockResolvedValue({ amount: 1000 });

    await buildSession(applePay, {
      transaction,
      supportsCouponCode: true,
      onShippingAddressChange,
    });

    const session = paymentRequestInstances[0];
    const updateWith = vi.fn();
    session.onshippingaddresschange?.({
      target: { shippingAddress: { country: "US" } },
      methodDetails: { couponCode: "SAVE20" },
      updateWith,
    } as unknown as PaymentRequestUpdateEvent);

    expect(onShippingAddressChange).not.toHaveBeenCalled();
    expect(updateWith).toHaveBeenCalledWith({});
  });

  it("passes coupon fields on recurring PaymentRequest data", async () => {
    await buildSession(applePay, {
      transaction: recurringTransaction,
      supportsCouponCode: true,
      couponCode: "SAVE20",
    });

    expect(paymentMethodDataCalls[0].supportsCouponCode).toBe(true);
    expect(paymentMethodDataCalls[0].couponCode).toBe("SAVE20");
  });

  it("omits coupon fields for disbursement sessions", async () => {
    await buildSession(applePay, {
      transaction: disbursementTransaction,
      supportsCouponCode: true,
      couponCode: "SAVE20",
    });

    expect(paymentMethodDataCalls[0].supportsCouponCode).toBeUndefined();
    expect(paymentMethodDataCalls[0].couponCode).toBeUndefined();
  });

  it("calls onCouponCodeChange for recurring and surfaces sheet errors", async () => {
    const onCouponCodeChange = vi.fn().mockResolvedValue({
      amount: 1000,
      error: {
        code: "couponCodeInvalid",
        message: "Unknown coupon",
      },
    });

    await buildSession(applePay, {
      transaction: recurringTransaction,
      supportsCouponCode: true,
      onCouponCodeChange,
    });

    const session = paymentRequestInstances[0];
    const updateWith = vi.fn();
    session.onpaymentmethodchange?.({
      methodDetails: { couponCode: "BAD" },
      updateWith,
    } as unknown as PaymentMethodChangeEvent);

    expect(onCouponCodeChange).toHaveBeenCalledWith("BAD");
    const update = await updateWith.mock.calls[0][0];
    expect(update.total?.amount.value).toBe("10.00");
    expect(update.paymentMethodErrors).toHaveLength(1);
    expect(update.paymentMethodErrors[0].code).toBe("couponCodeInvalid");
    expect(update.paymentMethodErrors[0].message).toBe("Unknown coupon");
  });

  it("surfaces paymentMethodErrors when onCouponCodeChange returns error", async () => {
    const onCouponCodeChange = vi.fn().mockResolvedValue({
      amount: 1000,
      error: {
        code: "couponCodeExpired",
        message: "Coupon expired",
      },
    });

    await buildSession(applePay, {
      transaction,
      supportsCouponCode: true,
      onCouponCodeChange,
    });

    const session = paymentRequestInstances[0];
    const updateWith = vi.fn();
    session.onshippingaddresschange?.({
      target: {},
      methodDetails: { couponCode: "OLD" },
      updateWith,
    } as unknown as PaymentRequestUpdateEvent);

    const update = await updateWith.mock.calls[0][0];
    expect(update.paymentMethodErrors).toHaveLength(1);
    expect(update.paymentMethodErrors[0].code).toBe("couponCodeExpired");
    expect(update.paymentMethodErrors[0].message).toBe("Coupon expired");
  });

  it("still calls updateWith when shippingaddresschange has no address", async () => {
    await buildSession(applePay, { transaction });

    const session = paymentRequestInstances[0];
    const updateWith = vi.fn();
    session.onshippingaddresschange?.({
      target: {},
      updateWith,
    } as unknown as PaymentRequestUpdateEvent);

    expect(updateWith).toHaveBeenCalledWith({});
  });
});

describe("buildSession contact prefill", () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, () =>
        HttpResponse.json({ is_sandbox: false }, { status: 200 })
      )
    );
  });

  it("omits contact fields when billingContact and shippingContact are not set", async () => {
    await buildSession(applePay, { transaction });

    expect(paymentMethodDataCalls[0].billingContact).toBeUndefined();
    expect(paymentMethodDataCalls[0].shippingContact).toBeUndefined();
  });

  it("passes billingContact and shippingContact on the PaymentRequest data", async () => {
    const billingContact = {
      givenName: "John",
      familyName: "Appleseed",
      addressLines: ["1 Infinite Loop"],
      locality: "Cupertino",
      administrativeArea: "CA",
      postalCode: "95014",
      countryCode: "US",
    };
    const shippingContact = {
      givenName: "John",
      familyName: "Appleseed",
      emailAddress: "john@example.com",
      phoneNumber: "+14085551234",
      addressLines: ["1 Infinite Loop"],
      locality: "Cupertino",
      administrativeArea: "CA",
      postalCode: "95014",
      countryCode: "US",
    };

    await buildSession(applePay, {
      transaction,
      billingContact,
      shippingContact,
    });

    expect(paymentMethodDataCalls[0].billingContact).toEqual(billingContact);
    expect(paymentMethodDataCalls[0].shippingContact).toEqual(shippingContact);
  });

  it("passes contact fields on recurring PaymentRequest data", async () => {
    const billingContact = {
      givenName: "Jane",
      familyName: "Doe",
      countryCode: "US",
    };

    await buildSession(applePay, {
      transaction: recurringTransaction,
      billingContact,
    });

    expect(paymentMethodDataCalls[0].billingContact).toEqual(billingContact);
    expect(paymentMethodDataCalls[0].shippingContact).toBeUndefined();
  });

  it("does not apply contact fields on disbursement PaymentRequest data", async () => {
    await buildSession(applePay, {
      transaction: disbursementTransaction,
      billingContact: {
        givenName: "John",
        familyName: "Appleseed",
        countryCode: "US",
      },
      shippingContact: {
        givenName: "John",
        familyName: "Appleseed",
        emailAddress: "john@example.com",
      },
    });

    expect(paymentMethodDataCalls[0].billingContact).toBeUndefined();
    expect(paymentMethodDataCalls[0].shippingContact).toBeUndefined();
  });
});

describe("buildSession shipping methods", () => {
  const shippingMethods = [
    {
      id: "standard",
      label: "Standard Shipping",
      amount: 299,
      detail: "3-5 business days",
      selected: true,
    },
    {
      id: "express",
      label: "Express Shipping",
      amount: 999,
      detail: "1-2 business days",
    },
  ];

  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, () =>
        HttpResponse.json({ is_sandbox: false }, { status: 200 })
      )
    );
  });

  it("maps shippingType and shippingMethods onto the PaymentRequest", async () => {
    await buildSession(applePay, {
      transaction: {
        ...transaction,
        amount: 3799,
        lineItems: [
          { label: "Mens Shirt", amount: 3000 },
          { label: "Socks", amount: 500 },
          { label: "Standard Shipping", amount: 299 },
        ],
      },
      shippingType: "delivery",
      shippingMethods,
    });

    expect(paymentOptionsCalls[0].requestShipping).toBe(true);
    expect(paymentOptionsCalls[0].shippingType).toBe("delivery");
    expect(paymentRequestCalls[0].shippingOptions).toEqual([
      {
        id: "standard",
        label: "Standard Shipping",
        amount: { currency: "USD", value: "2.99" },
        selected: true,
        detail: "3-5 business days",
      },
      {
        id: "express",
        label: "Express Shipping",
        amount: { currency: "USD", value: "9.99" },
        selected: false,
        detail: "1-2 business days",
      },
    ]);
  });

  it("maps storePickup shippingType to Payment Request pickup", async () => {
    await buildSession(applePay, {
      transaction,
      shippingType: "storePickup",
      shippingMethods: [
        { id: "pickup", label: "Store Pickup", amount: 0, selected: true },
      ],
    });

    expect(paymentOptionsCalls[0].shippingType).toBe("pickup");
  });

  it("rejects shipping methods on recurring transactions", async () => {
    await expect(
      buildSession(applePay, {
        transaction: recurringTransaction,
        shippingMethods,
      })
    ).rejects.toThrow(
      "Apple Pay shipping methods are only supported for one-off payment transactions"
    );
  });

  it("rejects shipping methods on disbursement transactions", async () => {
    await expect(
      buildSession(applePay, {
        transaction: disbursementTransaction,
        shippingMethods,
      })
    ).rejects.toThrow(
      "Apple Pay shipping methods are only supported for one-off payment transactions"
    );
  });

  it("passes shippingType through on recurring when only requestShipping is set", async () => {
    await buildSession(applePay, {
      transaction: recurringTransaction,
      requestShipping: true,
      shippingType: "delivery",
    });

    expect(paymentOptionsCalls[0].requestShipping).toBe(true);
    expect(paymentOptionsCalls[0].shippingType).toBe("delivery");
  });

  it("internally recomputes totals on shippingoptionchange when no merchant callback is set", async () => {
    const request = await buildSession(applePay, {
      transaction: {
        ...transaction,
        amount: 3799,
        lineItems: [
          { label: "Mens Shirt", amount: 3000 },
          { label: "Socks", amount: 500 },
          { label: "Standard Shipping", amount: 299 },
        ],
      },
      shippingMethods,
    });

    const session = paymentRequestInstances[0];
    session.shippingOption = "express";
    const updateWith = vi.fn();
    request.onshippingoptionchange?.({
      target: session,
      updateWith,
    } as unknown as PaymentRequestUpdateEvent);

    expect(updateWith).toHaveBeenCalledTimes(1);
    const update = await updateWith.mock.calls[0][0];
    expect(update.total?.amount.value).toBe("44.99");
    expect(update.displayItems).toEqual([
      {
        label: "Mens Shirt",
        amount: { value: "30.00", currency: "USD" },
      },
      {
        label: "Socks",
        amount: { value: "5.00", currency: "USD" },
      },
      {
        label: "Express Shipping",
        amount: { value: "9.99", currency: "USD" },
      },
    ]);
    expect(
      update.shippingOptions?.find((o: { id: string }) => o.id === "express")
        ?.selected
    ).toBe(true);
    expect(
      update.shippingOptions?.find((o: { id: string }) => o.id === "standard")
        ?.selected
    ).toBe(false);
  });

  it("calls onShippingMethodSelected and updateWith on shippingoptionchange", async () => {
    const onShippingMethodSelected = vi.fn().mockResolvedValue({
      amount: 4499,
      lineItems: [
        { label: "Mens Shirt", amount: 3000 },
        { label: "Socks", amount: 500 },
        { label: "Express Shipping", amount: 999 },
      ],
    });

    const request = await buildSession(applePay, {
      transaction: {
        ...transaction,
        amount: 3799,
      },
      shippingMethods,
      onShippingMethodSelected,
    });

    const session = paymentRequestInstances[0];
    session.shippingOption = "express";
    const updateWith = vi.fn();
    request.onshippingoptionchange?.({
      target: session,
      updateWith,
    } as unknown as PaymentRequestUpdateEvent);

    expect(onShippingMethodSelected).toHaveBeenCalledWith(shippingMethods[1]);
    const update = await updateWith.mock.calls[0][0];
    expect(update.total?.amount.value).toBe("44.99");
    expect(update.shippingOptions).toHaveLength(2);
  });

  it("still calls updateWith when shippingoptionchange has a null target", async () => {
    const request = await buildSession(applePay, {
      transaction: { ...transaction, amount: 3799 },
      shippingMethods,
    });

    const updateWith = vi.fn();
    expect(() =>
      request.onshippingoptionchange?.({
        target: null,
        updateWith,
      } as unknown as PaymentRequestUpdateEvent)
    ).not.toThrow();
    expect(updateWith).toHaveBeenCalled();

    const update = await updateWith.mock.calls[0][0];
    // Falls back to the initially selected (or first) method.
    expect(update.total?.amount.value).toBe("37.99");
  });

  it("preserves the selected shipping method after a later shipping address change", async () => {
    const onShippingAddressChange = vi.fn().mockResolvedValue({
      amount: 4499,
      lineItems: [
        { label: "Mens Shirt", amount: 3000 },
        { label: "Socks", amount: 500 },
        { label: "Express Shipping", amount: 999 },
      ],
    });

    const request = await buildSession(applePay, {
      transaction: {
        ...transaction,
        amount: 3799,
        lineItems: [
          { label: "Mens Shirt", amount: 3000 },
          { label: "Socks", amount: 500 },
          { label: "Standard Shipping", amount: 299 },
        ],
      },
      shippingMethods,
      onShippingAddressChange,
    });

    const session = paymentRequestInstances[0];
    session.shippingOption = "express";
    request.onshippingoptionchange?.({
      target: session,
      updateWith: vi.fn(),
    } as unknown as PaymentRequestUpdateEvent);

    const updateWith = vi.fn();
    request.onshippingaddresschange?.({
      // No shippingOption on the address-change target — selection must come
      // from the live session / persisted activeShippingOptionId.
      target: {
        shippingAddress: {
          addressLine: ["1 Main St"],
          city: "Dublin",
          country: "IE",
          dependentLocality: "",
          organization: "",
          phone: "",
          postalCode: "D01",
          recipient: "Jane",
          region: "",
          sortingCode: "",
        },
      },
      updateWith,
    } as unknown as PaymentRequestUpdateEvent);

    const update = await updateWith.mock.calls[0][0];
    expect(onShippingAddressChange).toHaveBeenCalled();
    expect(
      update.shippingOptions?.find((o: { id: string }) => o.id === "express")
        ?.selected
    ).toBe(true);
    expect(
      update.shippingOptions?.find((o: { id: string }) => o.id === "standard")
        ?.selected
    ).toBe(false);
  });

  it("preserves the selected shipping method across coupon updates", async () => {
    const onCouponCodeChange = vi.fn().mockResolvedValue({
      amount: 3799,
      lineItems: [
        { label: "Mens Shirt", amount: 3000 },
        { label: "Socks", amount: 500 },
        { label: "Coupon", amount: -700 },
        { label: "Express Shipping", amount: 999 },
      ],
    });

    const request = await buildSession(applePay, {
      transaction: {
        ...transaction,
        amount: 3799,
      },
      shippingMethods,
      supportsCouponCode: true,
      onCouponCodeChange,
    });

    const session = paymentRequestInstances[0];
    session.shippingOption = "express";
    request.onshippingoptionchange?.({
      target: session,
      updateWith: vi.fn(),
    } as unknown as PaymentRequestUpdateEvent);

    const updateWith = vi.fn();
    request.onshippingaddresschange?.({
      target: {},
      methodDetails: { couponCode: "SAVE20" },
      updateWith,
    } as unknown as PaymentRequestUpdateEvent);

    const update = await updateWith.mock.calls[0][0];
    expect(onCouponCodeChange).toHaveBeenCalledWith("SAVE20");
    expect(update.shippingOptions).toHaveLength(2);
    expect(
      update.shippingOptions?.find((o: { id: string }) => o.id === "express")
        ?.selected
    ).toBe(true);
  });

  it("warns when internal recompute cannot match a shipping line item by label", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const request = await buildSession(applePay, {
      transaction: {
        ...transaction,
        amount: 3799,
        lineItems: [
          { label: "Mens Shirt", amount: 3000 },
          { label: "Socks", amount: 500 },
          // Label does not match shippingMethods[].label ("Standard Shipping")
          { label: "Shipping", amount: 299 },
        ],
      },
      shippingMethods,
    });

    const session = paymentRequestInstances[0];
    session.shippingOption = "express";
    const updateWith = vi.fn();
    request.onshippingoptionchange?.({
      target: session,
      updateWith,
    } as unknown as PaymentRequestUpdateEvent);

    await updateWith.mock.calls[0][0];
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "expected to replace exactly one line item matching a shippingMethods[].label"
      )
    );

    warn.mockRestore();
  });

  it("warns and keeps only the first selected shipping method when multiple are marked selected", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await buildSession(applePay, {
      transaction,
      shippingMethods: [
        {
          id: "standard",
          label: "Standard Shipping",
          amount: 299,
          selected: true,
        },
        {
          id: "express",
          label: "Express Shipping",
          amount: 999,
          selected: true,
        },
      ],
    });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Multiple shippingMethods have selected: true")
    );
    expect(paymentRequestCalls[0].shippingOptions).toEqual([
      expect.objectContaining({ id: "standard", selected: true }),
      expect.objectContaining({ id: "express", selected: false }),
    ]);

    warn.mockRestore();
  });
});

describe("buildSession request-config passthrough", () => {
  beforeEach(() => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, () =>
        HttpResponse.json({ is_sandbox: false }, { status: 200 })
      )
    );
  });

  it("omits applicationData and supportedCountries when not set", async () => {
    await buildSession(applePay, { transaction });

    expect(paymentMethodDataCalls[0].applicationData).toBeUndefined();
    expect(paymentMethodDataCalls[0].supportedCountries).toBeUndefined();
  });

  it("passes applicationData and supportedCountries on the PaymentRequest data", async () => {
    await buildSession(applePay, {
      transaction,
      applicationData: "b3BhcXVl",
      supportedCountries: ["US", "CA"],
    });

    expect(paymentMethodDataCalls[0].applicationData).toBe("b3BhcXVl");
    expect(paymentMethodDataCalls[0].supportedCountries).toEqual(["US", "CA"]);
  });

  it("passes request-config fields on recurring and disbursement sessions", async () => {
    await buildSession(applePay, {
      transaction: recurringTransaction,
      applicationData: "cmVjdXJyaW5n",
      supportedCountries: ["GB"],
    });

    expect(paymentMethodDataCalls[0].applicationData).toBe("cmVjdXJyaW5n");
    expect(paymentMethodDataCalls[0].supportedCountries).toEqual(["GB"]);

    paymentMethodDataCalls.length = 0;

    await buildSession(applePay, {
      transaction: disbursementTransaction,
      applicationData: "ZGlzYnVyc2VtZW50",
      supportedCountries: ["IE"],
    });

    expect(paymentMethodDataCalls[0].applicationData).toBe("ZGlzYnVyc2VtZW50");
    expect(paymentMethodDataCalls[0].supportedCountries).toEqual(["IE"]);
  });

  it("rejects applicationData that is not Base64-encoded", async () => {
    await expect(
      buildSession(applePay, {
        transaction,
        applicationData: "not base64!!!",
      })
    ).rejects.toThrow("applicationData must be a Base64-encoded string");
  });

  it("marks pending line items on displayItems", async () => {
    await buildSession(applePay, {
      transaction: {
        ...transaction,
        lineItems: [
          { label: "Item", amount: 1000 },
          { label: "Estimated tax", amount: 80, type: "pending" },
        ],
      },
    });

    expect(paymentRequestCalls[0].displayItems).toEqual([
      {
        label: "Item",
        amount: { value: "10.00", currency: "USD" },
      },
      {
        label: "Estimated tax",
        amount: { value: "0.80", currency: "USD" },
        pending: true,
      },
    ]);
  });

  it("passes pending line item type through additionalLineItems on disbursement sessions", async () => {
    await buildSession(applePay, {
      transaction: {
        ...disbursementTransaction,
        lineItems: [
          { label: "Item", amount: 1000 },
          { label: "Estimated tax", amount: 80, type: "pending" },
        ],
      },
    });

    const modifierData = (
      paymentRequestCalls[0].modifiers?.[0] as unknown as {
        data: { additionalLineItems: Array<Record<string, unknown>> };
      }
    ).data;

    expect(modifierData.additionalLineItems).toEqual([
      { label: "Total Amount", amount: 1000 },
      { label: "Item", amount: { value: "10.00", currency: "USD" } },
      {
        label: "Estimated tax",
        amount: { value: "0.80", currency: "USD" },
        type: "pending",
      },
      {
        label: "Apple Pay Demo",
        amount: 1000,
        disbursementLineItemType: "disbursement",
      },
    ]);
  });

  it("preserves pending line items on payment method updates", async () => {
    const onPaymentMethodChange = vi.fn().mockResolvedValue({
      amount: 1080,
      lineItems: [
        { label: "Item", amount: 1000 },
        { label: "Estimated tax", amount: 80, type: "pending" },
      ],
    });

    await buildSession(applePay, {
      transaction,
      onPaymentMethodChange,
    });

    const session = paymentRequestInstances[0];
    const updateWith = vi.fn();
    session.onpaymentmethodchange?.({
      methodDetails: { type: "credit" },
      updateWith,
    } as unknown as PaymentMethodChangeEvent);

    const update = await updateWith.mock.calls[0][0];
    expect(update.displayItems).toEqual([
      {
        label: "Item",
        amount: { value: "10.00", currency: "USD" },
      },
      {
        label: "Estimated tax",
        amount: { value: "0.80", currency: "USD" },
        pending: true,
      },
    ]);
  });

  it("defaults Apple Pay version to 3 when ApplePaySession is unavailable", async () => {
    await buildSession(applePay, { transaction });
    expect(paymentMethodDataCalls[0].version).toBe(3);
  });

  it("propagates a resolved non-default version to payment and disbursement method data", async () => {
    const originalApplePaySession = (
      globalThis as unknown as { ApplePaySession?: unknown }
    ).ApplePaySession;
    (globalThis as unknown as { ApplePaySession: unknown }).ApplePaySession = {
      supportsVersion: (version: number) => version <= 9,
    };

    try {
      await buildSession(applePay, { transaction });
      expect(paymentMethodDataCalls[0].version).toBe(9);

      paymentMethodDataCalls.length = 0;

      await buildSession(applePay, { transaction: disbursementTransaction });
      expect(paymentMethodDataCalls[0].version).toBe(9);
    } finally {
      if (originalApplePaySession === undefined) {
        delete (globalThis as unknown as { ApplePaySession?: unknown })
          .ApplePaySession;
      } else {
        (
          globalThis as unknown as { ApplePaySession: unknown }
        ).ApplePaySession = originalApplePaySession;
      }
    }
  });
});

describe("resolveApplePayVersion", () => {
  const originalApplePaySession = (
    globalThis as unknown as { ApplePaySession?: unknown }
  ).ApplePaySession;

  afterEach(() => {
    if (originalApplePaySession === undefined) {
      delete (globalThis as unknown as { ApplePaySession?: unknown })
        .ApplePaySession;
    } else {
      (globalThis as unknown as { ApplePaySession: unknown }).ApplePaySession =
        originalApplePaySession;
    }
  });

  it("stays ahead of the installed @types/applepayjs major version", async () => {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const { version } = require("@types/applepayjs/package.json") as {
      version: string;
    };
    const typesMajor = Number(version.split(".")[0]);

    expect(APPLE_PAY_MAX_VERSION).toBeGreaterThanOrEqual(typesMajor);
  });

  it("returns the highest supported version up to the max", () => {
    (globalThis as unknown as { ApplePaySession: unknown }).ApplePaySession = {
      supportsVersion: (version: number) => version <= 12,
    };

    expect(resolveApplePayVersion(14)).toBe(12);
  });

  it("falls back to 3 when no version is supported", () => {
    (globalThis as unknown as { ApplePaySession: unknown }).ApplePaySession = {
      supportsVersion: () => false,
    };

    expect(resolveApplePayVersion(14)).toBe(3);
  });

  it("falls back to 3 when ApplePaySession is missing", () => {
    delete (globalThis as unknown as { ApplePaySession?: unknown })
      .ApplePaySession;

    expect(resolveApplePayVersion()).toBe(3);
  });

  it("falls back to 3 when supportsVersion is not a function", () => {
    (globalThis as unknown as { ApplePaySession: unknown }).ApplePaySession =
      {};

    expect(resolveApplePayVersion(14)).toBe(3);
  });
});

function createMockClient(): EvervaultClient {
  return {
    config: {
      appId: "app_test",
      http: { apiUrl },
    },
  } as EvervaultClient;
}

function createTransaction() {
  return new Transaction({
    amount: 1000,
    currency: "USD",
    country: "US",
    merchantId: "merchant_test",
  });
}

function createMockSession() {
  let showReject: (error: Error) => void = () => {};
  const showPromise = new Promise<PaymentResponse>((_, reject) => {
    showReject = reject;
  });

  return {
    show: vi.fn(() => showPromise),
    abort: vi.fn().mockResolvedValue(undefined),
    rejectShow: (error: Error) => showReject(error),
  };
}

async function clickApplePayButton(apple: ApplePayButton) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  await apple.mount(container);
  const button = container.querySelector("apple-pay-button");
  button?.dispatchEvent(new Event("click"));
}

describe("ApplePayButton script loading", () => {
  beforeEach(() => {
    vi.stubGlobal("PaymentRequest", class PaymentRequest {});
    vi.stubGlobal("ApplePaySession", {
      applePayCapabilities: vi.fn().mockResolvedValue({
        paymentCredentialStatus: "paymentCredentialsAvailable",
      }),
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("resolves availability() as soon as the SDK script's onload fires, without polling", async () => {
    const apple = new ApplePayButton(createMockClient(), createTransaction(), {
      process: vi.fn(),
    });

    const script = document.querySelector<HTMLScriptElement>(
      'script[src="https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js"]'
    );
    expect(script).not.toBeNull();

    let resolved = false;
    const availabilityPromise = apple.availability().then((result) => {
      resolved = true;
      return result;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(resolved).toBe(false);

    script!.dispatchEvent(new Event("load"));

    await expect(availabilityPromise).resolves.toBe("available");
    expect(resolved).toBe(true);
  });

  it("rejects with a timeout error if the SDK script never loads", async () => {
    vi.useFakeTimers();
    try {
      const apple = new ApplePayButton(
        createMockClient(),
        createTransaction(),
        { process: vi.fn() }
      );

      const assertion = expect(apple.availability()).rejects.toThrow(
        "Apple Pay SDK script load timeout"
      );

      await vi.advanceTimersByTimeAsync(10000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("ApplePayButton.abort", () => {
  beforeEach(() => {
    buildSessionMock.mockReset();
    vi.spyOn(applePayUtilities, "buildSession").mockImplementation(
      buildSessionMock
    );

    vi.stubGlobal("PaymentRequest", class PaymentRequest {});

    vi.stubGlobal("ApplePaySession", {
      applePayCapabilities: vi.fn().mockResolvedValue({
        paymentCredentialStatus: "paymentCredentialsAvailable",
      }),
    });

    const script = document.createElement("script");
    script.src =
      "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";
    document.body.appendChild(script);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("is a no-op when no session is in progress", async () => {
    const apple = new ApplePayButton(createMockClient(), createTransaction(), {
      process: vi.fn(),
    });

    await expect(apple.abort()).resolves.toBeUndefined();
  });

  it("calls PaymentRequest.abort and dispatches cancel when the sheet is showing", async () => {
    const session = createMockSession();
    buildSessionMock.mockResolvedValue(session);

    const cancel = vi.fn();
    const apple = new ApplePayButton(createMockClient(), createTransaction(), {
      process: vi.fn(),
    });
    apple.on("cancel", cancel);

    await clickApplePayButton(apple);

    await vi.waitFor(() => {
      expect(session.show).toHaveBeenCalled();
    });

    const abortError = new DOMException("Aborted", "AbortError");
    const abortPromise = apple.abort();

    session.rejectShow(abortError);
    await abortPromise;

    expect(session.abort).toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(cancel).toHaveBeenCalledOnce();
    });
  });

  it("dispatches cancel without calling show when aborted before the sheet opens", async () => {
    let resolveBuildSession: (
      session: ReturnType<typeof createMockSession>
    ) => void = () => {};
    buildSessionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBuildSession = resolve;
        })
    );

    const cancel = vi.fn();
    const apple = new ApplePayButton(createMockClient(), createTransaction(), {
      process: vi.fn(),
      prepareTransaction: () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ amount: 2000 }), 50);
        }),
    });
    apple.on("cancel", cancel);

    await clickApplePayButton(apple);

    await vi.waitFor(() => {
      expect(buildSessionMock).toHaveBeenCalled();
    });

    const session = createMockSession();
    const abortPromise = apple.abort();
    resolveBuildSession(session);
    await abortPromise;

    await vi.waitFor(() => {
      expect(cancel).toHaveBeenCalledOnce();
    });
    expect(session.show).not.toHaveBeenCalled();
  });

  it("swallows InvalidStateError from PaymentRequest.abort", async () => {
    const session = createMockSession();
    session.abort.mockRejectedValue(
      new DOMException("Invalid state", "InvalidStateError")
    );
    buildSessionMock.mockResolvedValue(session);

    const apple = new ApplePayButton(createMockClient(), createTransaction(), {
      process: vi.fn(),
    });

    await clickApplePayButton(apple);

    await vi.waitFor(() => {
      expect(session.show).toHaveBeenCalled();
    });

    await expect(apple.abort()).resolves.toBeUndefined();
  });
});

describe("ApplePayButton shipping method on process()", () => {
  function createResolvedSession(shippingOption?: string | null) {
    return {
      show: vi.fn().mockResolvedValue({
        details: {
          token: {
            paymentData: {},
            paymentMethod: { displayName: "Visa 1234", type: "credit" },
          },
        },
        shippingOption,
        complete: vi.fn().mockResolvedValue(undefined),
      }),
      abort: vi.fn(),
    };
  }

  beforeEach(() => {
    buildSessionMock.mockReset();
    vi.spyOn(applePayUtilities, "buildSession").mockImplementation(
      buildSessionMock
    );

    vi.stubGlobal("PaymentRequest", class PaymentRequest {});

    vi.stubGlobal("ApplePaySession", {
      applePayCapabilities: vi.fn().mockResolvedValue({
        paymentCredentialStatus: "paymentCredentialsAvailable",
      }),
    });

    const script = document.createElement("script");
    script.src =
      "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";
    document.body.appendChild(script);

    server.use(
      http.post(`${apiUrl}/frontend/apple-pay/credentials`, () =>
        HttpResponse.json({ card: {} })
      )
    );
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("attaches the matching shippingMethod to the process() payload", async () => {
    buildSessionMock.mockResolvedValue(createResolvedSession("express"));
    const process = vi.fn().mockResolvedValue(undefined);
    const apple = new ApplePayButton(createMockClient(), createTransaction(), {
      process,
      shippingMethods: [
        { id: "standard", label: "Standard Shipping", amount: 299 },
        {
          id: "express",
          label: "Express Shipping",
          amount: 999,
          detail: "1-2 days",
        },
      ],
    });

    await clickApplePayButton(apple);
    await vi.waitFor(() => expect(process).toHaveBeenCalled());

    expect(process.mock.calls[0][0].shippingMethod).toEqual({
      id: "express",
      label: "Express Shipping",
      amount: 999,
      detail: "1-2 days",
    });
  });

  it("falls back to a placeholder and warns when shippingOption matches nothing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildSessionMock.mockResolvedValue(createResolvedSession("unknown-id"));
    const process = vi.fn().mockResolvedValue(undefined);
    const apple = new ApplePayButton(createMockClient(), createTransaction(), {
      process,
      shippingMethods: [
        { id: "standard", label: "Standard Shipping", amount: 299 },
      ],
    });

    await clickApplePayButton(apple);
    await vi.waitFor(() => expect(process).toHaveBeenCalled());

    expect(process.mock.calls[0][0].shippingMethod).toEqual({
      id: "unknown-id",
      label: "unknown-id",
      amount: 0,
    });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("did not match any configured shippingMethods")
    );
    warn.mockRestore();
  });

  it("omits shippingMethod entirely when no shippingOption is returned", async () => {
    buildSessionMock.mockResolvedValue(createResolvedSession(undefined));
    const process = vi.fn().mockResolvedValue(undefined);
    const apple = new ApplePayButton(createMockClient(), createTransaction(), {
      process,
    });

    await clickApplePayButton(apple);
    await vi.waitFor(() => expect(process).toHaveBeenCalled());

    expect(process.mock.calls[0][0].shippingMethod).toBeUndefined();
  });
});
