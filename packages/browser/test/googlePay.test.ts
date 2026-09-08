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
  options: [
    { id: "standard", label: "Standard", amount: 500 },
    { id: "express", label: "Express", amount: 800 },
  ],
  defaultSelectedOptionId: "standard",
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
    amount: 1000,
    lineItems: undefined,
    shippingOptions: SHIPPING_OPTIONS,
    shippingAddress: null,
    selectedShippingOption: SHIPPING_OPTIONS.options[0],
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

it.each([
  [{ options: [] }, "must contain at least one option"],
  [
    { options: [{ id: "", label: "Standard" }] },
    "option ids must not be empty",
  ],
  [
    { options: [{ id: "standard", label: "" }] },
    "option labels must not be empty",
  ],
  [
    {
      options: [
        { id: "standard", label: "Standard" },
        { id: "standard", label: "Standard again" },
      ],
    },
    "option ids must be unique",
  ],
  [
    {
      options: [{ id: "standard", label: "Standard" }],
      defaultSelectedOptionId: "express",
    },
    "defaultSelectedOptionId must match a shipping option id",
  ],
])("rejects invalid shipping options: %s", (shippingOptions, message) => {
  expect(() => mount({ shippingOptions })).toThrow(message);
});

describe("GooglePay data change callbacks", () => {
  beforeEach(() => {
    handlers.clear();
    sent.length = 0;
  });

  it("passes context to a synchronous address callback and preserves the request id", async () => {
    const onShippingAddressChange = vi.fn().mockReturnValue({
      id: "merchant-supplied-id",
      amount: 1500,
    });
    mount({ shippingAddress: true, onShippingAddressChange });

    const reply = await raiseDataChange({
      trigger: "SHIPPING_ADDRESS",
      shippingAddress: ADDRESS,
    });

    expect(onShippingAddressChange).toHaveBeenCalledOnce();
    expect(onShippingAddressChange).toHaveBeenCalledWith(
      ADDRESS,
      expect.objectContaining({
        trigger: "SHIPPING_ADDRESS",
        shippingAddress: ADDRESS,
        selectedShippingOption: SHIPPING_OPTIONS.options[0],
        amount: 1000,
        shippingOptions: SHIPPING_OPTIONS,
      })
    );
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
      selectedShippingOption: SHIPPING_OPTIONS.options[1],
    });

    expect(onShippingOptionChange).toHaveBeenCalledWith(
      SHIPPING_OPTIONS.options[1],
      expect.objectContaining({
        trigger: "SHIPPING_OPTION",
        selectedShippingOption: SHIPPING_OPTIONS.options[1],
        amount: 1000,
      })
    );
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

  it("turns a callback timeout into an inline sheet error", async () => {
    vi.useFakeTimers();
    try {
      mount({
        shippingAddress: true,
        onShippingAddressChange: vi.fn().mockReturnValue(new Promise(() => {})),
      });

      const replyPromise = raiseDataChange({
        trigger: "SHIPPING_ADDRESS",
        shippingAddress: ADDRESS,
      });
      await vi.advanceTimersByTimeAsync(10_000);

      expect((await replyPromise)?.payload).toMatchObject({
        id: "gpay-data-change-1",
        error: { reason: "OTHER_ERROR" },
      });
    } finally {
      vi.useRealTimers();
    }
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

  it("rejects an empty shipping option update", async () => {
    mount({
      shippingAddress: true,
      onShippingAddressChange: vi.fn().mockResolvedValue({
        shippingOptions: { options: [] },
      }),
    });

    const reply = await raiseDataChange({
      trigger: "SHIPPING_ADDRESS",
      shippingAddress: ADDRESS,
    });

    expect(reply?.payload).toMatchObject({
      id: "gpay-data-change-1",
      error: { reason: "OTHER_ERROR" },
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
