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

const {
  buildSession,
  mapTransactionType,
  resolveMerchantIdentifier,
  resolveDisbursementMerchantCapabilities,
} = applePayUtilities;
const buildSessionMock = vi.fn();

const apiUrl = "https://api.test.evervault.com";
const app = "app_test123";
const merchantId = "merchant_abc";
const merchantName = "Acme Co";

const paymentRequestCalls: PaymentDetailsInit[] = [];
const paymentMethodDataCalls: Array<{
  merchantIdentifier?: string;
  merchantCapabilities?: string[];
  supportsCouponCode?: boolean;
  couponCode?: string;
}> = [];
const paymentRequestInstances: MockPaymentRequest[] = [];

class MockPaymentRequest {
  onshippingaddresschange: ((event: PaymentRequestUpdateEvent) => void) | null =
    null;
  onpaymentmethodchange: ((event: PaymentMethodChangeEvent) => void) | null =
    null;
  onmerchantvalidation: ((event: unknown) => void) | null = null;

  constructor(
    methodData: Array<{
      data?: {
        merchantIdentifier?: string;
        merchantCapabilities?: string[];
        supportsCouponCode?: boolean;
        couponCode?: string;
      };
    }>,
    details: PaymentDetailsInit
  ) {
    paymentMethodDataCalls.push(methodData[0]?.data ?? {});
    paymentRequestCalls.push(details);
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

function createMockClient(): EvervaultClient {
  return {
    config: {
      appId: "app_test",
      http: { apiUrl: "https://api.evervault.com" },
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
