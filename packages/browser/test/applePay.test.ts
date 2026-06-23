import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  describe,
  assert,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
} from "vitest";
import {
  buildSession,
  resolveMerchantIdentifier,
} from "../lib/ui/ApplePay/utilities";
import ApplePayButton from "../lib/ui/ApplePay";
import { setupCrypto } from "./setup";

const apiUrl = "https://api.test.evervault.com";
const app = "app_test123";
const merchantId = "merchant_abc";
const merchantName = "Acme Co";

const paymentRequestCalls: PaymentDetailsInit[] = [];
const paymentMethodDataCalls: Array<{ merchantIdentifier?: string }> = [];

class MockPaymentRequest {
  constructor(
    methodData: Array<{ data?: { merchantIdentifier?: string } }>,
    details: PaymentDetailsInit
  ) {
    paymentMethodDataCalls.push(methodData[0]?.data ?? {});
    paymentRequestCalls.push(details);
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

const server = setupServer();

beforeAll(() => {
  setupCrypto();
  (globalThis as unknown as { PaymentRequest: unknown }).PaymentRequest =
    MockPaymentRequest;
  server.listen();
});

beforeEach(() => {
  paymentRequestCalls.length = 0;
  paymentMethodDataCalls.length = 0;
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
