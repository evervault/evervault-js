import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GooglePayOptions } from "types";
import GooglePay from "../lib/ui/googlePay";
import { Transaction } from "../lib/resources/transaction";
import type EvervaultClient from "../lib/main";

type Handler = (payload: unknown) => unknown;

const handlers = new Map<string, Handler>();
const sent: Array<{ type: string; payload: unknown }> = [];

vi.mock("../lib/ui/evervaultFrame", () => ({
  EvervaultFrame: class {
    on(type: string, handler: Handler) {
      handlers.set(type, handler);
    }

    send(type: string, payload: unknown) {
      sent.push({ type, payload });
    }

    mount() {
      return this;
    }

    unmount() {
      return this;
    }
  },
}));

const client = {} as EvervaultClient;
const transaction = new Transaction({
  amount: 1000,
  currency: "USD",
  country: "US",
  merchantId: "merchant_abc",
});

const SHIPPING_OPTIONS = {
  options: [{ id: "standard", label: "Standard" }],
};

const ADDRESS = {
  countryCode: "US",
  postalCode: "94043",
  administrativeArea: "CA",
  locality: "Mountain View",
};

function mount(options: Partial<GooglePayOptions> = {}) {
  return new GooglePay(client, transaction, {
    process: vi.fn(),
    ...options,
  } as GooglePayOptions);
}

/** Drives one data change the way the frame does, and returns the reply. */
async function raiseDataChange(payload: Record<string, unknown>) {
  await handlers.get("EV_GOOGLE_PAY_DATA_CHANGE")!({
    id: "gpay-data-change-1",
    ...payload,
  });
  return sent.at(-1);
}

it("passes shipping configuration to the frame", () => {
  const shippingAddress = { allowedCountryCodes: ["US"] };
  expect(
    mount({ shippingAddress, shippingOptions: SHIPPING_OPTIONS }).config.config
  ).toMatchObject({ shippingAddress, shippingOptions: SHIPPING_OPTIONS });
});

describe("GooglePay data change callbacks", () => {
  beforeEach(() => {
    handlers.clear();
    sent.length = 0;
  });

  it("calls onShippingAddressChange and returns its update", async () => {
    const onShippingAddressChange = vi.fn().mockResolvedValue({ amount: 1500 });
    mount({ shippingAddress: true, onShippingAddressChange });

    const reply = await raiseDataChange({
      trigger: "SHIPPING_ADDRESS",
      shippingAddress: ADDRESS,
    });

    expect(onShippingAddressChange).toHaveBeenCalledOnce();
    expect(onShippingAddressChange).toHaveBeenCalledWith(ADDRESS);
    expect(reply).toEqual({
      type: "EV_GOOGLE_PAY_DATA_CHANGE_RESULT",
      payload: { id: "gpay-data-change-1", amount: 1500 },
    });
  });

  it("routes option changes only to the option callback", async () => {
    const onShippingAddressChange = vi.fn();
    const onShippingOptionChange = vi.fn().mockResolvedValue({ amount: 1200 });
    mount({ onShippingAddressChange, onShippingOptionChange });

    await raiseDataChange({
      trigger: "SHIPPING_OPTION",
      shippingOptionId: "express",
    });

    expect(onShippingOptionChange).toHaveBeenCalledWith("express");
    expect(onShippingAddressChange).not.toHaveBeenCalled();
  });

  it("replies with only the id when no callback is configured", async () => {
    mount({ shippingAddress: true });

    const reply = await raiseDataChange({
      trigger: "SHIPPING_ADDRESS",
      shippingAddress: ADDRESS,
    });

    expect(reply?.payload).toEqual({ id: "gpay-data-change-1" });
  });

  it("replies with only the id for an INITIALIZE trigger with no address", async () => {
    const onShippingAddressChange = vi.fn().mockResolvedValue({ amount: 1500 });
    mount({ shippingAddress: true, onShippingAddressChange });

    const reply = await raiseDataChange({ trigger: "INITIALIZE" });

    expect(onShippingAddressChange).not.toHaveBeenCalled();
    expect(reply?.payload).toEqual({ id: "gpay-data-change-1" });
  });

  it("turns a thrown callback into an inline sheet error", async () => {
    mount({
      shippingAddress: true,
      onShippingAddressChange: vi.fn().mockRejectedValue(new Error("boom")),
    });

    const reply = await raiseDataChange({
      trigger: "SHIPPING_ADDRESS",
      shippingAddress: ADDRESS,
    });

    expect(reply?.payload).toEqual({
      id: "gpay-data-change-1",
      error: {
        reason: "OTHER_ERROR",
        message: "Something went wrong, please try again",
      },
    });
  });

  it("passes a merchant error through untouched", async () => {
    mount({
      shippingAddress: true,
      onShippingAddressChange: vi.fn().mockResolvedValue({
        error: { message: "We do not ship there" },
      }),
    });

    const reply = await raiseDataChange({
      trigger: "SHIPPING_ADDRESS",
      shippingAddress: ADDRESS,
    });

    expect(reply?.payload).toEqual({
      id: "gpay-data-change-1",
      error: { message: "We do not ship there" },
    });
  });
});
