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
  resolveDisbursementMerchantCapabilities,
} from "../lib/ui/ApplePay/utilities";
import type { ApplePayMerchantCapability } from "types";
import ApplePayButton from "../lib/ui/ApplePay";
import { setupCrypto } from "./setup";

const apiUrl = "https://api.test.evervault.com";
const app = "app_test123";
const merchantId = "merchant_abc";
const merchantName = "Acme Co";

const paymentRequestCalls: PaymentDetailsInit[] = [];
const paymentMethodDataCalls: Array<{
  merchantCapabilities?: string[];
}> = [];

class MockPaymentRequest {
  constructor(
    methodData: Array<{ data?: { merchantCapabilities?: string[] } }>,
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
