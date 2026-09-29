import {
  fireEvent,
  render,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { vi } from "vitest";
import { lastPayload, renderCard, wrapper } from "../../test/helpers/card";
import { Card } from "./Root";
import { CardHolder } from "./Holder";
import { CardNumber } from "./Number";
import { CardExpiry } from "./Expiry";
import { CardExpiryMonth, CardExpiryYear } from "./ExpiryPart";
import { CardCvc } from "./Cvc";
import { CardField } from "./Field";
import { duplicateFieldName, unreportableFieldName } from "./developerMessages";

const AMEX = "378282246310005";
const VISA = "4242424242424242";

async function typeAndLeave(
  field: Parameters<typeof fireEvent>[0],
  value: string
) {
  const user = userEvent.setup();
  await user.type(field, value);
  fireEvent(field, "blur");
}

describe("errorMessage", () => {
  it("replaces a card field's error text", async () => {
    const { onChange, getByTestId } = await renderCard(
      <CardNumber testID="number" errorMessage="Check the number" />
    );

    await typeAndLeave(getByTestId("number"), "4242");

    await waitFor(() =>
      expect(lastPayload(onChange).errors.number).toBe("Check the number")
    );
  });

  it("replaces the expiry's error text from either half", async () => {
    const { onChange, getByTestId } = await renderCard(
      <>
        <CardExpiryMonth testID="month" />
        <CardExpiryYear testID="year" errorMessage="Check the date" />
      </>
    );

    const user = userEvent.setup();
    await user.type(getByTestId("month"), "13");
    await typeAndLeave(getByTestId("year"), "30");

    await waitFor(() =>
      expect(lastPayload(onChange).errors.expiry).toBe("Check the date")
    );
  });

  it("keeps the default text for a field that declares none", async () => {
    const { onChange, getByTestId } = await renderCard(
      <CardExpiry testID="expiry" />
    );

    await typeAndLeave(getByTestId("expiry"), "1310");

    await waitFor(() =>
      expect(lastPayload(onChange).errors.expiry).toBe("Invalid expiry")
    );
  });
});

describe("Card.Number unsupportedBrandMessage", () => {
  it("replaces the error for a brand the card does not accept", async () => {
    const { onChange, getByTestId } = await renderCard(
      <CardNumber
        testID="number"
        errorMessage="Check the number"
        unsupportedBrandMessage="Visa only"
      />,
      { acceptedBrands: ["visa"] }
    );

    await typeAndLeave(getByTestId("number"), AMEX);

    await waitFor(() =>
      expect(lastPayload(onChange).errors.number).toBe("Visa only")
    );
  });
});

describe("Card.Holder pattern", () => {
  it("reports a name that does not match as invalid", async () => {
    const { onChange, getByTestId } = await renderCard(
      <CardHolder testID="name" pattern="[A-Za-z ]+" />
    );

    await typeAndLeave(getByTestId("name"), "J0hn");

    await waitFor(() =>
      expect(lastPayload(onChange)).toMatchObject({
        errors: { name: "Invalid name" },
        isComplete: false,
      })
    );
  });

  it("completes the card with a name that matches", async () => {
    const { onChange, getByTestId } = await renderCard(
      <CardHolder testID="name" pattern="[A-Za-z ]+" />
    );

    await typeAndLeave(getByTestId("name"), "Jane Doe");

    await waitFor(() =>
      expect(lastPayload(onChange)).toMatchObject({
        errors: {},
        isComplete: true,
      })
    );
  });
});

describe("Card.Cvc optional", () => {
  it("completes the card without a security code", async () => {
    const { onChange, getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" />
        <CardExpiry testID="expiry" />
        <CardCvc testID="cvc" optional />
      </>
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), VISA);
    await user.type(getByTestId("expiry"), "1230");
    fireEvent(getByTestId("cvc"), "blur");

    await waitFor(() =>
      expect(lastPayload(onChange)).toMatchObject({
        card: { cvc: null },
        errors: {},
        isComplete: true,
      })
    );
  });

  it("still requires a security code by default", async () => {
    const { onChange, getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" />
        <CardExpiry testID="expiry" />
        <CardCvc testID="cvc" />
      </>
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), VISA);
    await user.type(getByTestId("expiry"), "1230");

    await waitFor(() => expect(lastPayload(onChange).isComplete).toBe(false));
  });
});

describe("Card.Cvc allow3DigitAmex", () => {
  it("accepts a 3-digit Amex security code by default", async () => {
    const { onChange, getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" />
        <CardCvc testID="cvc" />
      </>
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), AMEX);
    await typeAndLeave(getByTestId("cvc"), "123");

    await waitFor(() =>
      expect(lastPayload(onChange)).toMatchObject({
        errors: {},
        isComplete: true,
      })
    );
  });

  it("refuses a 3-digit Amex security code when set to false", async () => {
    const { onChange, getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" />
        <CardCvc testID="cvc" allow3DigitAmex={false} />
      </>
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), AMEX);
    await typeAndLeave(getByTestId("cvc"), "123");

    await waitFor(() =>
      expect(lastPayload(onChange)).toMatchObject({
        card: { cvc: null },
        errors: { cvc: "Invalid CVC" },
        isComplete: false,
      })
    );
  });

  it("accepts a 4-digit Amex security code when set to false", async () => {
    const { onChange, getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" />
        <CardCvc testID="cvc" allow3DigitAmex={false} />
      </>
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), AMEX);
    await typeAndLeave(getByTestId("cvc"), "1234");

    await waitFor(() =>
      expect(lastPayload(onChange)).toMatchObject({
        errors: {},
        isComplete: true,
      })
    );
  });
});

describe("security code checked against the number", () => {
  it("clears a refused Amex security code once the number changes", async () => {
    const { onChange, getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" />
        <CardCvc testID="cvc" allow3DigitAmex={false} />
      </>
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), AMEX);
    await typeAndLeave(getByTestId("cvc"), "123");
    await waitFor(() =>
      expect(lastPayload(onChange).errors.cvc).toBe("Invalid CVC")
    );

    await user.clear(getByTestId("number"));
    await user.type(getByTestId("number"), VISA);

    await waitFor(() =>
      expect(lastPayload(onChange)).toMatchObject({
        errors: {},
        isValid: true,
      })
    );
  });

  it("refuses a security code left before the number became an Amex", async () => {
    const { onChange, getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" />
        <CardCvc testID="cvc" allow3DigitAmex={false} />
      </>
    );

    const user = userEvent.setup();
    await typeAndLeave(getByTestId("cvc"), "123");
    await user.type(getByTestId("number"), AMEX);

    await waitFor(() =>
      expect(lastPayload(onChange).errors.cvc).toBe("Invalid CVC")
    );
  });
});

describe("settings changed on a mounted card", () => {
  it("shows a field's new error text while it shows an error", async () => {
    const onChange = vi.fn();
    const card = (message: string) => (
      <Card onChange={onChange}>
        <CardNumber testID="number" errorMessage={message} />
      </Card>
    );
    const { getByTestId, rerender } = await render(card("First"), {
      wrapper,
    });

    await typeAndLeave(getByTestId("number"), "4242");
    await waitFor(() =>
      expect(lastPayload(onChange).errors.number).toBe("First")
    );

    await rerender(card("Second"));

    await waitFor(() =>
      expect(lastPayload(onChange).errors.number).toBe("Second")
    );
  });

  it("keeps the first expiry half's text when that half's text changes", async () => {
    const onChange = vi.fn();
    const card = (month: string) => (
      <Card onChange={onChange}>
        <CardExpiryMonth testID="month" errorMessage={month} />
        <CardExpiryYear testID="year" errorMessage="Year" />
      </Card>
    );
    const { getByTestId, rerender } = await render(card("Month"), {
      wrapper,
    });

    const user = userEvent.setup();
    await user.type(getByTestId("month"), "13");
    await typeAndLeave(getByTestId("year"), "30");
    await waitFor(() =>
      expect(lastPayload(onChange).errors.expiry).toBe("Month")
    );

    await rerender(card("Changed month"));

    await waitFor(() =>
      expect(lastPayload(onChange).errors.expiry).toBe("Changed month")
    );
  });
});

describe("autoProgress", () => {
  it("is offered only on the fields with a fixed length", async () => {
    await renderCard(
      <>
        {/* @ts-expect-error a holder has no fixed length to advance from */}
        <CardHolder autoProgress />
        {/* @ts-expect-error a customer's field has no fixed length to advance from */}
        <CardField name="postcode" autoProgress />
      </>
    );
  });
});

describe("Card.Field names", () => {
  it("warns about a name the payload cannot report", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await renderCard(<CardField name="billing.zip" />);

    expect(warn).toHaveBeenCalledWith(unreportableFieldName("billing.zip"));
    warn.mockRestore();
  });

  it("warns about a name declared twice", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await renderCard(
      <>
        <CardField name="postcode" />
        <CardField name="postcode" />
      </>
    );

    expect(warn).toHaveBeenCalledWith(duplicateFieldName("postcode"));
    warn.mockRestore();
  });
});
