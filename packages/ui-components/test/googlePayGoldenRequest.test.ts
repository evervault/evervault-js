import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MerchantDetail } from "types";
import { buildPaymentRequest } from "../src/GooglePay/utilities";
import { GooglePayConfig } from "../src/GooglePay/types";
import { apiConfig } from "../src/utilities/config";

/**
 * Fixture tests for the whole Google Pay payment request.
 *
 * The fixtures are shared with the Android SDK's
 * `android/googlepay/src/test/resources/google-pay` in evervault/evervault-pay.
 * Keep the two copies identical so a default that drifts on one platform fails
 * here.
 */

type PaymentRequest = ReturnType<typeof buildPaymentRequest>;

/**
 * The request fields web and Android share.
 *
 * `merchantId`, `merchantOrigin`, and `callbackIntents` are required by the
 * Google Pay web client and have no Android equivalent, so they are covered by
 * their own test rather than by the shared fixtures.
 */
type GoldenRequest = Pick<
  PaymentRequest,
  | "apiVersion"
  | "apiVersionMinor"
  | "emailRequired"
  | "allowedPaymentMethods"
  | "transactionInfo"
> & {
  merchantInfo: Pick<PaymentRequest["merchantInfo"], "merchantName">;
};

const merchant: MerchantDetail = {
  id: "merchant_123",
  name: "Test Merchant",
};

const transaction = {
  type: "payment" as const,
  amount: 5499,
  currency: "EUR",
  country: "IE",
  merchantId: merchant.id,
  domain: "shop.example.com",
  lineItems: [{ label: "Shell Jacket", amount: 5000 }],
};

const baseConfig: GooglePayConfig = {
  transaction,
  type: "buy",
  color: "black",
  borderRadius: 12,
};

function loadFixture(name: string): unknown {
  return JSON.parse(
    readFileSync(
      new URL(`./fixtures/google-pay/${name}.json`, import.meta.url),
      "utf8"
    )
  );
}

function comparableRequest(config: GooglePayConfig): GoldenRequest {
  const {
    apiVersion,
    apiVersionMinor,
    emailRequired,
    allowedPaymentMethods,
    merchantInfo,
    transactionInfo,
  } = buildPaymentRequest(config, merchant);

  return {
    apiVersion,
    apiVersionMinor,
    emailRequired,
    allowedPaymentMethods,
    merchantInfo: { merchantName: merchantInfo.merchantName },
    transactionInfo,
  };
}

describe("Google Pay golden requests", () => {
  it("matches the disabled-billing fixture by default", () => {
    expect(comparableRequest(baseConfig)).toEqual(
      loadFixture("billing-disabled")
    );
  });

  it("matches the disabled-billing fixture when billing is explicitly disabled", () => {
    expect(comparableRequest({ ...baseConfig, billingAddress: false })).toEqual(
      loadFixture("billing-disabled")
    );
  });

  it("matches the enabled-billing fixture when billing is enabled", () => {
    expect(comparableRequest({ ...baseConfig, billingAddress: true })).toEqual(
      loadFixture("billing-enabled")
    );
  });

  it("matches the custom fixture when every option is set", () => {
    expect(
      comparableRequest({
        ...baseConfig,
        transaction: { ...transaction, priceLabel: "Subscription" },
        emailRequired: true,
        allowedAuthMethods: ["PAN_ONLY"],
        allowedCardNetworks: ["INTERAC"],
        billingAddress: { format: "MIN", phoneNumber: true },
      })
    ).toEqual(loadFixture("custom"));
  });

  it("includes the web-only request fields", () => {
    const request = buildPaymentRequest(baseConfig, merchant);

    expect(request.merchantInfo).toMatchObject({
      merchantId: apiConfig.googlePayMerchantId,
      merchantOrigin: transaction.domain,
    });
    expect(request.callbackIntents).toEqual(["PAYMENT_AUTHORIZATION"]);
  });
});
