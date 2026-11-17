/**
 * @vitest-environment happy-dom
 */

import * as React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, type CardRef } from ".";
import { fakeClient, settle } from "../../../test/helpers/card";

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

  it("creates the card with 3DS profiling", async () => {
    const { evervault, wrapper } = fakeClient();

    render(<Card threeDSProfiling />, { wrapper });
    await settle();

    expect(evervault.ui.card).toHaveBeenCalledWith(
      expect.objectContaining({ threeDSProfiling: true })
    );
  });

  it("updates the card when 3DS profiling is turned on later", async () => {
    const { card, wrapper } = fakeClient();

    const { rerender } = render(<Card />, { wrapper });
    await settle();

    rerender(<Card threeDSProfiling />);
    await settle();

    expect(card.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ threeDSProfiling: true })
    );
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
