import { describe, expect, it } from "vitest";
import { MerchantDetail } from "types";
import { buildPaymentRequest } from "../src/GooglePay/utilities";
import { GooglePayConfig } from "../src/GooglePay/types";

const merchant = { id: "merchant_123", name: "Acme" } as MerchantDetail;

function buildConfig(
  currency: string,
  amount: number,
  lineItemAmount: number
): GooglePayConfig {
  return {
    transaction: {
      type: "payment",
      amount,
      currency,
      country: "US",
      merchantId: merchant.id,
      domain: "acme.com",
      lineItems: [{ label: "Widget", amount: lineItemAmount }],
    },
    type: "buy",
    color: "black",
    borderRadius: 0,
  } as GooglePayConfig;
}

describe("buildPaymentRequest", () => {
  it("converts minor units using the currency's exponent", () => {
    const cases = [
      { currency: "USD", amount: 1000, expected: "10.00" },
      { currency: "EUR", amount: 1999, expected: "19.99" },
      { currency: "JPY", amount: 1000, expected: "1000" },
      { currency: "KRW", amount: 5, expected: "5" },
      { currency: "KWD", amount: 1000, expected: "1.000" },
      { currency: "USD", amount: 0, expected: "0.00" },
      { currency: "USD", amount: 5, expected: "0.05" },
    ];

    for (const { currency, amount, expected } of cases) {
      const { transactionInfo } = buildPaymentRequest(
        buildConfig(currency, amount, amount),
        merchant
      );

      expect(transactionInfo.totalPrice).toEqual(expected);
      expect(transactionInfo.displayItems?.[0].price).toEqual(expected);
    }
  });

  it("falls back to two decimal places for an unknown currency", () => {
    const { transactionInfo } = buildPaymentRequest(
      buildConfig("XYZ", 1000, 1000),
      merchant
    );

    expect(transactionInfo.totalPrice).toEqual("10.00");
  });
});
