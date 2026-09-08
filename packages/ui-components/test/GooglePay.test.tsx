/**
 * @vitest-environment jsdom
 */

import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GooglePay } from "../src/GooglePay";
import type { GooglePayConfig } from "../src/GooglePay/types";

const getMerchantMock = vi.fn();
const getAppSDKConfigMock = vi.fn();

vi.mock("../src/utilities/useMerchant", () => ({
  getMerchant: (...args: unknown[]) => getMerchantMock(...args),
}));

vi.mock("shared", () => ({
  getAppSDKConfig: (...args: unknown[]) => getAppSDKConfigMock(...args),
}));

vi.mock("../src/utilities/useSearchParams", () => ({
  useSearchParams: () => ({ app: "app_test123", id: "frame1" }),
}));

const createButtonMock = vi.fn();

class MockPaymentsClient {
  isReadyToPay = vi.fn().mockResolvedValue({ result: true });
  createButton = (...args: unknown[]) => {
    createButtonMock(...args);
    return document.createElement("div");
  };
  loadPaymentData = vi.fn();
}

const config: GooglePayConfig = {
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

function getInjectedScript() {
  return document.querySelector<HTMLScriptElement>(
    'script[src="https://pay.google.com/gp/p/js/pay.js"]'
  );
}

beforeEach(() => {
  createButtonMock.mockReset();
  getMerchantMock.mockReset();
  getAppSDKConfigMock.mockReset();
  getMerchantMock.mockResolvedValue({ id: "merchant_abc", name: "Acme Co" });
  getAppSDKConfigMock.mockResolvedValue({ is_sandbox: false });
  (globalThis as unknown as { google: unknown }).google = {
    payments: { api: { PaymentsClient: MockPaymentsClient } },
  };
});

afterEach(() => {
  document.body.innerHTML = "";
  delete (globalThis as { google?: unknown }).google;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GooglePay onLoad GET concurrency", () => {
  it("issues getAppSDKConfig and getMerchant concurrently, not sequentially", async () => {
    let resolveAppConfig: (value: { is_sandbox: boolean }) => void = () => {};
    const appConfigGate = new Promise<{ is_sandbox: boolean }>((resolve) => {
      resolveAppConfig = resolve;
    });
    getAppSDKConfigMock.mockReturnValue(appConfigGate);
    getMerchantMock.mockResolvedValue({ id: "merchant_abc", name: "Acme Co" });

    render(<GooglePay config={config} />);

    const script = getInjectedScript();
    expect(script).not.toBeNull();
    script!.dispatchEvent(new Event("load"));

    // If the two calls were sequential, getMerchant would never be invoked
    // while getAppSDKConfig's request is still gated open.
    await waitFor(() => {
      expect(getMerchantMock).toHaveBeenCalledWith(
        "app_test123",
        "merchant_abc"
      );
    });

    resolveAppConfig({ is_sandbox: false });

    await waitFor(() => {
      expect(getAppSDKConfigMock).toHaveBeenCalledWith(
        "app_test123",
        expect.any(String)
      );
    });
  });
});

describe("GooglePay button radius", () => {
  async function renderAndGetRadius(borderRadius?: number) {
    render(<GooglePay config={{ ...config, borderRadius }} />);
    getInjectedScript()!.dispatchEvent(new Event("load"));
    await waitFor(() => expect(createButtonMock).toHaveBeenCalled());
    return (createButtonMock.mock.calls[0][0] as { buttonRadius: number })
      .buttonRadius;
  }

  it.each([
    [undefined, 12],
    [20, 20],
    [0, 0],
  ])("maps a radius of %s to %s", async (configured, expected) => {
    expect(await renderAndGetRadius(configured)).toBe(expected);
  });
});

describe("GooglePay shipping data changes", () => {
  let callbacks: google.payments.api.PaymentDataCallbacks;

  class CapturingPaymentsClient extends MockPaymentsClient {
    constructor(options: google.payments.api.PaymentOptions) {
      super();
      callbacks = options.paymentDataCallbacks ?? {};
    }
  }

  const ADDRESS = {
    countryCode: "US",
    postalCode: "94043",
    administrativeArea: "CA",
    locality: "Mountain View",
  } as google.payments.api.IntermediateAddress;
  const SHIPPING_OPTIONS = {
    options: [
      { id: "standard", label: "Standard", amount: 500 },
      { id: "express", label: "Express", amount: 800 },
    ],
    defaultSelectedOptionId: "standard",
  };

  beforeEach(() => {
    (globalThis as unknown as { google: unknown }).google = {
      payments: { api: { PaymentsClient: CapturingPaymentsClient } },
    };
  });

  async function mountWithShipping() {
    render(
      <GooglePay
        config={{
          ...config,
          shippingAddress: true,
          shippingOptions: SHIPPING_OPTIONS,
        }}
      />
    );
    getInjectedScript()!.dispatchEvent(new Event("load"));
    await waitFor(() => expect(callbacks.onPaymentDataChanged).toBeDefined());
  }

  async function openPaymentSheet() {
    const options = createButtonMock.mock.calls.at(-1)?.[0] as {
      onClick: () => Promise<void>;
    };
    await options.onClick();
  }

  /**
   * Answers the frame's outgoing data-change message the way the host SDK
   * would, echoing back the id it was sent.
   */
  function replyToDataChange(
    update: Record<string, unknown> | Record<string, unknown>[]
  ) {
    const updates = Array.isArray(update) ? [...update] : [update];
    return vi
      .spyOn(window.parent, "postMessage")
      .mockImplementation((message: unknown) => {
        const { type, payload } = message as {
          type: string;
          payload: { id: string };
        };
        if (type !== "EV_GOOGLE_PAY_DATA_CHANGE") return;
        window.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: "EV_GOOGLE_PAY_DATA_CHANGE_RESULT",
              payload: { id: payload.id, ...(updates.shift() ?? {}) },
            },
          })
        );
      });
  }

  it("sends the buyer's address to the host and applies the new total", async () => {
    await mountWithShipping();
    const postMessage = replyToDataChange({ amount: 1500 });

    const result = await callbacks.onPaymentDataChanged!({
      callbackTrigger: "SHIPPING_ADDRESS",
      shippingAddress: ADDRESS,
    } as google.payments.api.IntermediatePaymentData);

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "EV_GOOGLE_PAY_DATA_CHANGE",
        payload: expect.objectContaining({
          trigger: "SHIPPING_ADDRESS",
          shippingAddress: ADDRESS,
          selectedShippingOption: SHIPPING_OPTIONS.options[0],
          amount: 1000,
          shippingOptions: SHIPPING_OPTIONS,
        }),
      }),
      "*"
    );
    expect(result.newTransactionInfo?.totalPrice).toBe("15.00");
  });

  it("reports the chosen option and current state when it changes", async () => {
    await mountWithShipping();
    const postMessage = replyToDataChange({ amount: 1200 });

    await callbacks.onPaymentDataChanged!({
      callbackTrigger: "SHIPPING_OPTION",
      shippingOptionData: { id: "express" },
    } as google.payments.api.IntermediatePaymentData);

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          trigger: "SHIPPING_OPTION",
          selectedShippingOption: SHIPPING_OPTIONS.options[1],
          amount: 1000,
          shippingOptions: SHIPPING_OPTIONS,
        }),
      }),
      "*"
    );
  });

  it("preserves prior values across partial transaction updates", async () => {
    await mountWithShipping();
    const postMessage = replyToDataChange([
      {
        amount: 1500,
        lineItems: [{ label: "Shipping", amount: 500 }],
      },
      { amount: 1800 },
      { lineItems: [{ label: "Express", amount: 800 }] },
    ]);
    const change = () =>
      callbacks.onPaymentDataChanged!({
        callbackTrigger: "SHIPPING_OPTION",
        shippingOptionData: { id: "express" },
      } as google.payments.api.IntermediatePaymentData);

    await change();
    expect((await change()).newTransactionInfo).toMatchObject({
      totalPrice: "18.00",
      displayItems: [{ label: "Shipping", price: "5.00" }],
    });
    expect((await change()).newTransactionInfo).toMatchObject({
      totalPrice: "18.00",
      displayItems: [{ label: "Express", price: "8.00" }],
    });
    expect(postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          amount: 1800,
          lineItems: [{ label: "Shipping", amount: 500 }],
        }),
      }),
      "*"
    );
  });

  it("resets partial transaction state when the sheet reopens", async () => {
    await mountWithShipping();
    replyToDataChange([
      {
        amount: 1500,
        lineItems: [{ label: "Shipping", amount: 500 }],
      },
      { lineItems: [{ label: "Express", amount: 800 }] },
    ]);
    const change = () =>
      callbacks.onPaymentDataChanged!({
        callbackTrigger: "SHIPPING_OPTION",
        shippingOptionData: { id: "express" },
      } as google.payments.api.IntermediatePaymentData);

    await openPaymentSheet();
    await change();
    await openPaymentSheet();

    expect((await change()).newTransactionInfo).toMatchObject({
      totalPrice: "10.00",
      displayItems: [{ label: "Express", price: "8.00" }],
    });
  });

  it("returns no update when the merchant returns nothing", async () => {
    await mountWithShipping();
    replyToDataChange({});

    const result = await callbacks.onPaymentDataChanged!({
      callbackTrigger: "SHIPPING_ADDRESS",
      shippingAddress: ADDRESS,
    } as google.payments.api.IntermediatePaymentData);

    expect(result).toEqual({});
  });

  it.each([
    {
      data: { callbackTrigger: "SHIPPING_ADDRESS", shippingAddress: ADDRESS },
      message: "We do not ship there",
      reason: "SHIPPING_ADDRESS_UNSERVICEABLE",
      intent: "SHIPPING_ADDRESS",
    },
    {
      data: {
        callbackTrigger: "SHIPPING_OPTION",
        shippingOptionData: { id: "express" },
      },
      message: "That option is no longer available",
      reason: "SHIPPING_OPTION_INVALID",
      intent: "SHIPPING_OPTION",
    },
  ] as const)(
    "uses a $intent error for an invalid selection",
    async (testCase) => {
      await mountWithShipping();
      replyToDataChange({ error: { message: testCase.message } });

      const result = await callbacks.onPaymentDataChanged!(
        testCase.data as google.payments.api.IntermediatePaymentData
      );

      expect(result.error).toEqual({
        reason: testCase.reason,
        intent: testCase.intent,
        message: testCase.message,
      });
    }
  );

  it("replaces the sheet's options and uses them in later context", async () => {
    await mountWithShipping();
    const postMessage = replyToDataChange({
      shippingOptions: { options: [{ id: "next-day", label: "Next day" }] },
    });

    const result = await callbacks.onPaymentDataChanged!({
      callbackTrigger: "SHIPPING_ADDRESS",
      shippingAddress: ADDRESS,
    } as google.payments.api.IntermediatePaymentData);

    expect(result.newShippingOptionParameters).toEqual({
      shippingOptions: [{ id: "next-day", label: "Next day", description: "" }],
    });

    await callbacks.onPaymentDataChanged!({
      callbackTrigger: "SHIPPING_OPTION",
      shippingOptionData: { id: "next-day" },
    } as google.payments.api.IntermediatePaymentData);
    expect(postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          selectedShippingOption: { id: "next-day", label: "Next day" },
          shippingOptions: {
            options: [{ id: "next-day", label: "Next day" }],
          },
        }),
      }),
      "*"
    );
  });

  it("surfaces the buyer's shipping choice on the authorized payload", async () => {
    await mountWithShipping();
    const postMessage = vi
      .spyOn(window.parent, "postMessage")
      .mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: async () => ({ card: {} }) })
    );
    const shippingAddress = { ...ADDRESS, name: "Ada Lovelace" };

    void callbacks.onPaymentAuthorized!({
      paymentMethodData: {
        tokenizationData: { token: JSON.stringify({}) },
      },
      shippingAddress,
      shippingOptionData: { id: "standard" },
    } as unknown as google.payments.api.PaymentData);

    await waitFor(() =>
      expect(postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "EV_GOOGLE_PAY_AUTH",
          payload: expect.objectContaining({
            shippingAddress,
            shippingOption: SHIPPING_OPTIONS.options[0],
          }),
        }),
        "*"
      )
    );
  });

  it("ignores a reply meant for a different data change", async () => {
    await mountWithShipping();
    vi.spyOn(window.parent, "postMessage").mockImplementation(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            type: "EV_GOOGLE_PAY_DATA_CHANGE_RESULT",
            payload: { id: "gpay-data-change-does-not-exist", amount: 9999 },
          },
        })
      );
    });

    const pending = Promise.resolve(
      callbacks.onPaymentDataChanged!({
        callbackTrigger: "SHIPPING_ADDRESS",
        shippingAddress: ADDRESS,
      } as google.payments.api.IntermediatePaymentData)
    );

    const settled = await Promise.race([
      pending.then(() => "resolved"),
      new Promise((resolve) => setTimeout(() => resolve("pending"), 20)),
    ]);

    expect(settled).toBe("pending");
  });
});
