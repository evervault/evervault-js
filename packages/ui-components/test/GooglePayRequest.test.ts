import { describe, expect, it } from "vitest";
import {
  buildPaymentRequest,
  callbackIntents,
} from "../src/GooglePay/utilities";
import type { GooglePayConfig } from "../src/GooglePay/types";
import type { MerchantDetail } from "types";

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
    expect(
      build({
        shippingAddress: {
          allowedCountryCodes: ["US", "CA"],
          phoneNumberRequired: true,
        },
      }).shippingAddressParameters
    ).toEqual({
      allowedCountryCodes: ["US", "CA"],
      phoneNumberRequired: true,
    });
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
