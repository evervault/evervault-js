import { describe, expect, it } from "vitest";
import {
  buildPaymentRequest,
  callbackIntents,
  offerInfo,
  shippingOptionParameters,
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
};

function build(config: Partial<GooglePayConfig> = {}) {
  return buildPaymentRequest({ ...BASE_CONFIG, ...config }, MERCHANT);
}

describe("buildPaymentRequest shipping fields", () => {
  it("omits every shipping field when shipping is not configured", () => {
    const request = build();

    expect(request).not.toHaveProperty("shippingAddressRequired");
    expect(request).not.toHaveProperty("shippingAddressParameters");
    expect(request).not.toHaveProperty("shippingOptionRequired");
    expect(request).not.toHaveProperty("shippingOptionParameters");
  });

  it("requests an address with no restrictions for shippingAddress: true", () => {
    const request = build({ shippingAddress: true });

    expect(request.shippingAddressRequired).toBe(true);
    expect(request.shippingAddressParameters).toEqual({});
  });

  it("passes allowedCountryCodes and phoneNumberRequired through", () => {
    const request = build({
      shippingAddress: {
        allowedCountryCodes: ["US", "CA"],
        phoneNumberRequired: true,
      },
    });

    expect(request.shippingAddressParameters).toEqual({
      allowedCountryCodes: ["US", "CA"],
      phoneNumberRequired: true,
    });
  });

  it("treats shippingAddress: false as no shipping", () => {
    const request = build({ shippingAddress: false });

    expect(request).not.toHaveProperty("shippingAddressRequired");
  });

  it("declares shipping options when they are configured", () => {
    const request = build({
      shippingAddress: true,
      shippingOptions: SHIPPING_OPTIONS,
    });

    expect(request.shippingOptionRequired).toBe(true);
    expect(request.shippingOptionParameters).toEqual({
      shippingOptions: [
        { id: "standard", label: "Standard", description: "3-5 days" },
        { id: "express", label: "Express", description: "" },
      ],
    });
  });

  it("keeps a default selection when one is given", () => {
    expect(
      shippingOptionParameters({
        ...SHIPPING_OPTIONS,
        defaultSelectedOptionId: "express",
      }).defaultSelectedOptionId
    ).toBe("express");
  });

  it("omits defaultSelectedOptionId so Google's own default applies", () => {
    expect(shippingOptionParameters(SHIPPING_OPTIONS)).not.toHaveProperty(
      "defaultSelectedOptionId"
    );
  });
});

const OFFERS = [
  { redemptionCode: "SAVE10", description: "10% off your order" },
];

describe("buildPaymentRequest offers", () => {
  it("omits offerInfo when no offers are configured", () => {
    expect(build()).not.toHaveProperty("offerInfo");
  });

  it("omits offerInfo for an empty offer list", () => {
    expect(build({ offers: [] })).not.toHaveProperty("offerInfo");
  });

  it("declares the configured offers", () => {
    expect(build({ offers: OFFERS }).offerInfo).toEqual({ offers: OFFERS });
  });

  it("keeps only the fields Google accepts per offer", () => {
    expect(
      offerInfo([
        {
          redemptionCode: "SAVE10",
          description: "10% off your order",
        },
      ]).offers[0]
    ).toEqual({ redemptionCode: "SAVE10", description: "10% off your order" });
  });
});

describe("callbackIntents", () => {
  it("asks only for authorization when shipping is not configured", () => {
    expect(callbackIntents(BASE_CONFIG)).toEqual(["PAYMENT_AUTHORIZATION"]);
  });

  it("adds SHIPPING_ADDRESS when an address is collected", () => {
    expect(callbackIntents({ ...BASE_CONFIG, shippingAddress: true })).toEqual([
      "SHIPPING_ADDRESS",
      "PAYMENT_AUTHORIZATION",
    ]);
  });

  it("adds OFFER when offers are configured", () => {
    expect(callbackIntents({ ...BASE_CONFIG, offers: OFFERS })).toEqual([
      "OFFER",
      "PAYMENT_AUTHORIZATION",
    ]);
  });

  it("does not add OFFER for an empty offer list", () => {
    expect(callbackIntents({ ...BASE_CONFIG, offers: [] })).toEqual([
      "PAYMENT_AUTHORIZATION",
    ]);
  });

  it("adds SHIPPING_OPTION when options are offered", () => {
    expect(
      callbackIntents({
        ...BASE_CONFIG,
        shippingAddress: true,
        shippingOptions: SHIPPING_OPTIONS,
      })
    ).toEqual(["SHIPPING_ADDRESS", "SHIPPING_OPTION", "PAYMENT_AUTHORIZATION"]);
  });
});
