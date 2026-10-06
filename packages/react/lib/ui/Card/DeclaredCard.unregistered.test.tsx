/**
 * @vitest-environment happy-dom
 */

import * as React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, type CardRef } from ".";
import { EvervaultContext } from "../../context";
import type { PromisifiedEvervaultClient } from "../../load/client";

// No `<ev-card>` is registered here, as before the SDK script has loaded.
describe("Card before the SDK registers <ev-card>", () => {
  it("validates without throwing", () => {
    const loading = new Promise(() => {}) as PromisifiedEvervaultClient;
    const ref = React.createRef<CardRef>();

    render(
      <EvervaultContext.Provider value={loading}>
        <Card ref={ref}>
          <Card.Number />
        </Card>
      </EvervaultContext.Provider>
    );

    expect(() => ref.current?.validate()).not.toThrow();
  });
});
