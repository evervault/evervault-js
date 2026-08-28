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

describe("GooglePay onLoad GET concurrency", () => {
  beforeEach(() => {
    getMerchantMock.mockReset();
    getAppSDKConfigMock.mockReset();
    (globalThis as unknown as { google: unknown }).google = {
      payments: { api: { PaymentsClient: MockPaymentsClient } },
    };
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete (globalThis as { google?: unknown }).google;
  });

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
  });

  async function renderAndGetRadius(borderRadius?: number) {
    render(<GooglePay config={{ ...config, borderRadius }} />);
    getInjectedScript()!.dispatchEvent(new Event("load"));
    await waitFor(() => expect(createButtonMock).toHaveBeenCalled());
    return (createButtonMock.mock.calls[0][0] as { buttonRadius: number })
      .buttonRadius;
  }

  it("defaults to 12, matching the Android SDK", async () => {
    expect(await renderAndGetRadius(undefined)).toBe(12);
  });

  it("uses the configured radius", async () => {
    expect(await renderAndGetRadius(20)).toBe(20);
  });

  it("honours a radius of 0 rather than falling back to the default", async () => {
    expect(await renderAndGetRadius(0)).toBe(0);
  });
});
