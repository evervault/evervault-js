import { createRef } from "react";
import {
  act,
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
import { CardExpiryMonth, CardExpiryYear } from "./ExpiryHalf";
import { CardCvc } from "./Cvc";
import { CardField } from "./Field";
import { invalidPattern } from "./developerMessages";
import { encryptedValue } from "../__mocks__/NativeEvervault";

const AMEX = "378282246310005";
const VISA = "4242424242424242";

async function typeAndLeave(
  field: Parameters<typeof fireEvent>[0],
  value: string
) {
  const user = userEvent.setup();
  await user.type(field, value);
  await fireEvent(field, "blur");
}

describe("field settings", () => {
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
      await fireEvent(getByTestId("cvc"), "blur");

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

  describe("settings changed on a mounted card", () => {
    it("shows a field's new error text while it shows an error", async () => {
      const number = (message: string) => (
        <CardNumber testID="number" errorMessage={message} />
      );
      const { onChange, getByTestId, rerenderCard } = await renderCard(
        number("First")
      );

      await typeAndLeave(getByTestId("number"), "4242");
      await waitFor(() =>
        expect(lastPayload(onChange).errors.number).toBe("First")
      );

      await rerenderCard(number("Second"));

      await waitFor(() =>
        expect(lastPayload(onChange).errors.number).toBe("Second")
      );
    });

    it("gives the expiry the later half's text first, as the web card does", async () => {
      const halves = (year?: string) => (
        <>
          <CardExpiryMonth testID="month" errorMessage="Month" />
          <CardExpiryYear testID="year" errorMessage={year} />
        </>
      );
      const { onChange, getByTestId, rerenderCard } = await renderCard(
        halves("Year")
      );

      const user = userEvent.setup();
      await user.type(getByTestId("month"), "12");
      await typeAndLeave(getByTestId("year"), "10");
      await waitFor(() =>
        expect(lastPayload(onChange).errors.expiry).toBe("Year")
      );

      await rerenderCard(halves());

      await waitFor(() =>
        expect(lastPayload(onChange).errors.expiry).toBe("Month")
      );
    });
  });

  describe("defaultValue", () => {
    const holder = (defaultValue: string) => (
      <CardHolder testID="holder" defaultValue={defaultValue} />
    );

    const postcode = (defaultValue: string) => (
      <CardField
        testID="postcode"
        name="postcode"
        defaultValue={defaultValue}
      />
    );

    it("starts the holder with its default", async () => {
      const { getByTestId } = await renderCard(holder("Jo"));

      expect(getByTestId("holder")).toHaveDisplayValue("Jo");
    });

    it("replaces a holder default the shopper hasn't changed", async () => {
      const { getByTestId, rerenderCard } = await renderCard(holder("Jo"));

      await rerenderCard(holder("Ann"));

      expect(getByTestId("holder")).toHaveDisplayValue("Ann");
    });

    it("keeps a name the shopper typed when the default changes", async () => {
      const { getByTestId, rerenderCard } = await renderCard(holder("Jo"));

      const user = userEvent.setup();
      await user.clear(getByTestId("holder"));
      await user.type(getByTestId("holder"), "Kim");
      await rerenderCard(holder("Ann"));

      expect(getByTestId("holder")).toHaveDisplayValue("Kim");
    });

    it("starts a Card.Field with its default, reported encrypted", async () => {
      const { onChange, getByTestId } = await renderCard(postcode("SW1A"));

      expect(getByTestId("postcode")).toHaveDisplayValue("SW1A");
      await waitFor(() =>
        expect(lastPayload(onChange).fields).toEqual({
          postcode: encryptedValue,
        })
      );
    });

    it("keeps a Card.Field value the shopper typed when the default changes", async () => {
      const { getByTestId, rerenderCard } = await renderCard(postcode("SW1A"));

      const user = userEvent.setup();
      await user.clear(getByTestId("postcode"));
      await user.type(getByTestId("postcode"), "EC1A");
      await rerenderCard(postcode("N1"));

      expect(getByTestId("postcode")).toHaveDisplayValue("EC1A");
    });

    it("fills the holder and Card.Field defaults in again on reset", async () => {
      const ref = createRef<Card>();
      const { getByTestId } = await render(
        <Card ref={ref}>
          <CardHolder testID="holder" defaultValue="Jo" />
          <CardField testID="postcode" name="postcode" defaultValue="SW1A" />
        </Card>,
        { wrapper }
      );

      const user = userEvent.setup();
      await user.clear(getByTestId("holder"));
      await user.type(getByTestId("holder"), "Kim");
      await user.clear(getByTestId("postcode"));
      await user.type(getByTestId("postcode"), "EC1A");
      await act(() => ref.current?.reset());

      await waitFor(() =>
        expect(getByTestId("holder")).toHaveDisplayValue("Jo")
      );
      expect(getByTestId("postcode")).toHaveDisplayValue("SW1A");
    });
  });

  describe("Card.Field names", () => {
    it("reports a name with a dot under that name", async () => {
      const { onChange, getByTestId } = await renderCard(
        <CardField testID="zip" name="billing.zip" />
      );

      const user = userEvent.setup();
      await user.type(getByTestId("zip"), "SW1A");

      await waitFor(() =>
        expect(lastPayload(onChange).fields).toEqual({
          "billing.zip": encryptedValue,
        })
      );
    });
  });

  describe("Card.Field pattern", () => {
    it("warns about a pattern that is not a regular expression", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      await renderCard(<CardField name="postcode" pattern="[A-Z" />);

      expect(warn).toHaveBeenCalledWith(invalidPattern("postcode", "[A-Z"));
      warn.mockRestore();
    });
  });
});
