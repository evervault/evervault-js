/**
 * @vitest-environment happy-dom
 */

import * as React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from ".";
import {
  FakeEvCard,
  evCard,
  fakeClient,
  registerFakeEvCard,
  settle,
} from "./testing";

registerFakeEvCard();

describe("Card", () => {
  it("renders the card from its options when it declares no fields", async () => {
    const { evervault, card, wrapper } = fakeClient();

    render(<Card fields={["number", "cvc"]} autoProgress />, { wrapper });
    await settle();

    expect(evervault.ui.card).toHaveBeenCalledWith(
      expect.objectContaining({ fields: ["number", "cvc"], autoProgress: true })
    );
    expect(card.mount).toHaveBeenCalledOnce();
    expect(FakeEvCard.cards).toHaveLength(0);
  });

  it("takes the props of a wrapper that extends them and passes children on", async () => {
    interface WrapperProps extends React.ComponentProps<typeof Card> {
      heading: string;
    }

    function Wrapper({ heading, ...props }: WrapperProps) {
      return (
        <section aria-label={heading}>
          <Card fields={["number"]} {...props} />
        </section>
      );
    }

    const { evervault, wrapper } = fakeClient();

    render(<Wrapper heading="Pay" redactCVC />, { wrapper });
    await settle();

    expect(evervault.ui.card).toHaveBeenCalledWith(
      expect.objectContaining({ fields: ["number"], redactCVC: true })
    );
  });

  it("renders the declared fields as the <ev-card> elements", async () => {
    const { evervault, wrapper } = fakeClient();

    const { container } = render(
      <Card>
        <Card.Number label="Card number" />
        <Card.Row>
          <Card.ExpiryMonth />
          <Card.ExpiryYear />
          <Card.Cvc redact />
        </Card.Row>
        <Card.Field name="postcode" required />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(container.innerHTML).toBe(
      "<ev-card>" +
        '<ev-card-number label="Card number"></ev-card-number>' +
        "<ev-row>" +
        "<ev-card-expiry-month></ev-card-expiry-month>" +
        "<ev-card-expiry-year></ev-card-expiry-year>" +
        '<ev-card-cvc redact=""></ev-card-cvc>' +
        "</ev-row>" +
        '<ev-field name="postcode" required=""></ev-field>' +
        "</ev-card>"
    );
    expect(evervault.ui.card).not.toHaveBeenCalled();
  });

  it.each([
    ["null", null],
    ["an empty list", []],
  ])("renders the <ev-card> for children of %s", async (_, children) => {
    const { evervault, wrapper } = fakeClient();

    render(<Card fields={["number"]}>{children}</Card>, { wrapper });
    await settle();

    expect(evCard().client).toBe(evervault);
    expect(evervault.ui.card).not.toHaveBeenCalled();
  });

  it("renders the declared children in place of fields", async () => {
    const { evervault, wrapper } = fakeClient();

    const { container } = render(
      <Card fields={["number", "expiry"]}>
        <Card.Cvc />
      </Card>,
      { wrapper }
    );
    await settle();

    expect(container.innerHTML).toBe(
      "<ev-card><ev-card-cvc></ev-card-cvc></ev-card>"
    );
    expect(evervault.ui.card).not.toHaveBeenCalled();
  });

  it("keeps the <ev-card> while its children render nothing", async () => {
    const { evervault, wrapper } = fakeClient();

    const { rerender } = render(
      <Card>
        <Card.Number />
      </Card>,
      { wrapper }
    );
    await settle();
    const card = evCard();

    rerender(<Card>{false}</Card>);
    await settle();

    expect(evCard()).toBe(card);
    expect(evervault.ui.card).not.toHaveBeenCalled();
  });
});
