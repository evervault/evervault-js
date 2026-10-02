/**
 * @vitest-environment happy-dom
 */

import * as React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, type CardRef } from ".";
import { fakeClient, settle } from "./testing";

describe("Card from its options", () => {
  it("mounts the card from its options by default", async () => {
    const { card, wrapper } = fakeClient();

    render(<Card />, { wrapper });
    await settle();

    expect(card.mount).toHaveBeenCalledOnce();
    expect(card.preload).not.toHaveBeenCalled();
  });

  it("preloads the card from its options instead of mounting it", async () => {
    const { card, wrapper } = fakeClient();

    render(<Card preload />, { wrapper });
    await settle();

    expect(card.preload).toHaveBeenCalledOnce();
    expect(card.mount).not.toHaveBeenCalled();
  });

  it("shows a preloaded card through its ref", async () => {
    const { card, wrapper } = fakeClient();
    const ref = React.createRef<CardRef>();

    render(<Card preload ref={ref} />, { wrapper });
    await settle();
    ref.current?.show();

    expect(card.show).toHaveBeenCalledOnce();
  });
});
