/**
 * @vitest-environment happy-dom
 */

import * as React from "react";
import { render, waitFor } from "@testing-library/react";
import { vi, expect, describe, it } from "vitest";
import { EvervaultContext } from "../context";
import { PromisifiedEvervaultClient } from "../load/client";
import { Card, type CardRef } from "./Card";

function withMockClient(cardInstance: unknown) {
  const evervault = new PromisifiedEvervaultClient((resolve) => {
    resolve({ ui: { card: () => cardInstance } } as never);
  });

  return function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <EvervaultContext.Provider value={evervault}>
        {children}
      </EvervaultContext.Provider>
    );
  };
}

function mockCardInstance() {
  return {
    mount: vi.fn(),
    preload: vi.fn(),
    reveal: vi.fn(),
    validate: vi.fn(),
    update: vi.fn(),
    on: vi.fn(() => () => {}),
  };
}

describe("Card", () => {
  it("mounts by default", async () => {
    const instance = mockCardInstance();
    render(<Card />, { wrapper: withMockClient(instance) });

    await waitFor(() => expect(instance.mount).toHaveBeenCalledTimes(1));
    expect(instance.preload).not.toHaveBeenCalled();
  });

  it("preloads instead of mounting when preload is set", async () => {
    const instance = mockCardInstance();
    render(<Card preload />, { wrapper: withMockClient(instance) });

    await waitFor(() => expect(instance.preload).toHaveBeenCalledTimes(1));
    expect(instance.mount).not.toHaveBeenCalled();
  });

  it("reveals the card via the ref", async () => {
    const instance = mockCardInstance();
    const ref = React.createRef<CardRef>();
    render(<Card preload ref={ref} />, { wrapper: withMockClient(instance) });

    await waitFor(() => expect(instance.preload).toHaveBeenCalledTimes(1));
    ref.current?.reveal();

    expect(instance.reveal).toHaveBeenCalledTimes(1);
  });
});
