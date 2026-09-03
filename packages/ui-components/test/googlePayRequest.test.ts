import { describe, expect, it } from "vitest";
import { MerchantDetail } from "types";
import { buildPaymentRequest } from "../src/GooglePay/utilities";
import { GooglePayConfig } from "../src/GooglePay/types";

/**
 * Unit tests for `buildPaymentRequest` behaviour that isn't about matching a
 * fixed request shape.
 */

const merchant: MerchantDetail = {
  id: "merchant_123",
  name: "Test Merchant",
};

const baseConfig: GooglePayConfig = {
  transaction: {
    type: "payment",
    amount: 5499,
    currency: "EUR",
    country: "IE",
    merchantId: merchant.id,
    domain: "shop.example.com",
    lineItems: [{ label: "Shell Jacket", amount: 5000 }],
  },
  type: "buy",
  color: "black",
  borderRadius: 12,
};

describe("Google Pay display item category mapping", () => {
  it("maps every line item category to the matching Google Pay display item type", () => {
    const request = buildPaymentRequest(
      {
        ...baseConfig,
        transaction: {
          ...baseConfig.transaction,
          lineItems: [
            { label: "Shell Jacket", amount: 5000, category: "line_item" },
            { label: "Subtotal", amount: 5000, category: "subtotal" },
            { label: "VAT", amount: 499, category: "tax" },
            { label: "Promo", amount: 100, category: "discount" },
            { label: "Delivery", amount: 0, category: "shipping_option" },
          ],
        },
      },
      merchant
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
