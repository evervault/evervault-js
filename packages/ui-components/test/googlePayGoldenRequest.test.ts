import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MerchantDetail } from "types";
import { buildPaymentRequest } from "../src/GooglePay/utilities";
import { GooglePayConfig } from "../src/GooglePay/types";

type GoldenRequest = {
  apiVersion: number;
  apiVersionMinor: number;
  emailRequired: boolean;
  allowedPaymentMethods: Array<{
    type: string;
    parameters: Record<string, unknown>;
    tokenizationSpecification: Record<string, unknown>;
  }>;
  merchantInfo: { merchantName: string };
  transactionInfo: Record<string, unknown>;
};

const merchant = {
  id: "merchant_123",
  name: "Test Merchant",
} as MerchantDetail;

const transaction = {
  type: "payment" as const,
  amount: 5499,
  currency: "EUR",
  country: "IE",
  merchantId: merchant.id,
  domain: "shop.example.com",
  lineItems: [{ label: "Shell Jacket", amount: 5000 }],
};

function loadFixture(name: string): GoldenRequest {
  return JSON.parse(
    readFileSync(
      new URL(`./fixtures/google-pay/${name}.json`, import.meta.url),
      "utf8"
    )
  );
}

function comparableRequest(config: GooglePayConfig): GoldenRequest {
  const request = buildPaymentRequest(config, merchant);
  const { merchantName } = request.merchantInfo;

  return {
    apiVersion: request.apiVersion,
    apiVersionMinor: request.apiVersionMinor,
    emailRequired: request.emailRequired,
    allowedPaymentMethods: request.allowedPaymentMethods,
    merchantInfo: { merchantName },
    transactionInfo: request.transactionInfo,
  } as unknown as GoldenRequest;
}

describe("Google Pay golden requests", () => {
  it("matches the web default request fixture", () => {
    expect(
      comparableRequest({
        transaction,
        type: "buy",
        color: "black",
        borderRadius: 12,
      })
    ).toEqual(loadFixture("default"));
  });

  it("matches the shared enabled-billing request fixture", () => {
    expect(
      comparableRequest({
        transaction,
        type: "buy",
        color: "black",
        borderRadius: 12,
        billingAddress: true,
      })
    ).toEqual(loadFixture("enabled-billing"));
  });

  it("matches the configured request fixture", () => {
    expect(
      comparableRequest({
        transaction: { ...transaction, priceLabel: "Subscription" },
        type: "buy",
        color: "black",
        borderRadius: 12,
        emailRequired: true,
        allowedAuthMethods: ["PAN_ONLY"],
        allowedCardNetworks: ["INTERAC"],
        billingAddress: { format: "MIN", phoneNumber: true },
      })
    ).toEqual(loadFixture("custom"));
  });

  it("matches Android's disabled-billing-address request shape", () => {
    expect(
      comparableRequest({
        transaction,
        type: "buy",
        color: "black",
        borderRadius: 12,
        billingAddress: false,
      })
    ).toEqual(loadFixture("billing-disabled"));
  });
});
