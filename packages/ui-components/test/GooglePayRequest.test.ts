import { describe, expect, it } from "vitest";
import {
  buildPaymentRequest,
  callbackIntents,
} from "../src/GooglePay/utilities";
import type { GooglePayConfig } from "../src/GooglePay/types";
import type { MerchantDetail } from "types";

/**
 * Unit tests for `buildPaymentRequest`/`callbackIntents` behaviour that isn't
 * about matching a fixed request shape (that's `googlePayGoldenRequest.test.ts`).
 */

const MERCHANT = { id: "merchant_abc", name: "Acme Co" } as MerchantDetail;
const BASE_CONFIG: GooglePayConfig = {
  transaction: {
    type: "payment",
    amount: 1000,
    currency: "USD",
    country: "US",
    merchantId: "merchant_abc",
    domain: "shop.example.com",
  },
  type: "plain",
  color: "black",
};
const SHIPPING_OPTIONS = {
  options: [
    { id: "standard", label: "Standard", description: "3-5 days" },
    { id: "express", label: "Express" },
  ],
  defaultSelectedOptionId: "express",
};

function build(config: Partial<GooglePayConfig> = {}) {
  return buildPaymentRequest({ ...BASE_CONFIG, ...config }, MERCHANT);
}

describe("buildPaymentRequest shipping fields", () => {
  it("omits shipping when it is not configured", () => {
    expect(build()).not.toEqual(
      expect.objectContaining({
        shippingAddressRequired: expect.anything(),
        shippingOptionRequired: expect.anything(),
      })
    );
  });

  it("passes address parameters through", () => {
    const shippingAddress = {
      allowedCountryCodes: ["US", "CA"],
      phoneNumberRequired: true,
      format: "FULL-ISO3166" as const,
    };

    expect(build({ shippingAddress }).shippingAddressParameters).toEqual(
      shippingAddress
    );
  });

  it("makes options imply address collection", () => {
    expect(build({ shippingOptions: SHIPPING_OPTIONS })).toMatchObject({
      shippingAddressRequired: true,
      shippingAddressParameters: {},
      shippingOptionRequired: true,
      shippingOptionParameters: {
        shippingOptions: [
          { id: "standard", label: "Standard", description: "3-5 days" },
          { id: "express", label: "Express", description: "" },
        ],
        defaultSelectedOptionId: "express",
      },
    });
  });
});

describe("callbackIntents", () => {
  it.each([
    [{}, ["PAYMENT_AUTHORIZATION"]],
    [{ shippingAddress: true }, ["SHIPPING_ADDRESS", "PAYMENT_AUTHORIZATION"]],
    [
      { shippingOptions: SHIPPING_OPTIONS },
      ["SHIPPING_ADDRESS", "SHIPPING_OPTION", "PAYMENT_AUTHORIZATION"],
    ],
  ] as const)("derives intents from %o", (config, expected) => {
    expect(callbackIntents({ ...BASE_CONFIG, ...config })).toEqual(expected);
  });
});

describe("Google Pay display item category mapping", () => {
  it("maps every line item category to the matching Google Pay display item type", () => {
    const request = buildPaymentRequest(
      {
        ...BASE_CONFIG,
        transaction: {
          ...BASE_CONFIG.transaction,
          lineItems: [
            { label: "Shell Jacket", amount: 5000, category: "line_item" },
            { label: "Subtotal", amount: 5000, category: "subtotal" },
            { label: "VAT", amount: 499, category: "tax" },
            { label: "Promo", amount: 100, category: "discount" },
            { label: "Delivery", amount: 0, category: "shipping_option" },
          ],
        },
      },
      MERCHANT
    );

    expect(request.transactionInfo.displayItems).toEqual([
      { label: "Shell Jacket", type: "LINE_ITEM", price: "50.00" },
      { label: "Subtotal", type: "SUBTOTAL", price: "50.00" },
      { label: "VAT", type: "TAX", price: "4.99" },
      { label: "Promo", type: "DISCOUNT", price: "1.00" },
      { label: "Delivery", type: "SHIPPING_OPTION", price: "0.00" },
    ]);
  });
});
