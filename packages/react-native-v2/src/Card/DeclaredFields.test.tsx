import { waitFor } from "@testing-library/react-native";
import { vi } from "vitest";
import { lastPayload, renderCard } from "../../test/helpers/card";
import { CardNumber } from "./Number";
import { CardExpiry } from "./Expiry";
import { CardExpiryMonth, CardExpiryYear } from "./ExpiryHalf";
import { CardField } from "./Field";
import {
  COMBINED_EXPIRY_WITH_HALF,
  NAMELESS_CUSTOM_FIELD,
  duplicateCustomField,
  duplicateField,
  loneExpiryHalf,
} from "./developerMessages";

let warn: ReturnType<typeof vi.spyOn>;
let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  error = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("declared fields", () => {
  describe("a field declared twice", () => {
    it("renders only the first of a card field", async () => {
      const { getByTestId, queryByTestId } = await renderCard(
        <>
          <CardNumber testID="first" />
          <CardNumber testID="second" />
        </>
      );

      expect(getByTestId("first")).toBeTruthy();
      expect(queryByTestId("second")).toBeNull();
      expect(warn).toHaveBeenCalledWith(duplicateField("number"));
    });

    it("renders only the first of an expiry half", async () => {
      const { getByTestId, queryByTestId } = await renderCard(
        <>
          <CardExpiryMonth testID="first" />
          <CardExpiryMonth testID="second" />
          <CardExpiryYear testID="year" />
        </>
      );

      expect(getByTestId("first")).toBeTruthy();
      expect(queryByTestId("second")).toBeNull();
      expect(getByTestId("year")).toBeTruthy();
      expect(warn).toHaveBeenCalledWith(duplicateField("expiryMonth"));
    });

    it("renders only the first Card.Field of a name", async () => {
      const { getByTestId, queryByTestId } = await renderCard(
        <>
          <CardField testID="first" name="postcode" />
          <CardField testID="second" name="postcode" />
        </>
      );

      expect(getByTestId("first")).toBeTruthy();
      expect(queryByTestId("second")).toBeNull();
      expect(warn).toHaveBeenCalledWith(duplicateCustomField("postcode"));
    });

    it("takes the rules of the first Card.Field declaring a name", async () => {
      const { onChange } = await renderCard(
        <>
          <CardField name="postcode" required />
          <CardField name="postcode" />
        </>
      );

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      expect(lastPayload(onChange)).toMatchObject({
        fields: { postcode: null },
        isComplete: false,
      });
    });

    it("keeps reporting a Card.Field's name once the other is gone", async () => {
      const { onChange, rerenderCard } = await renderCard(
        <>
          <CardField name="postcode" required />
          <CardField name="postcode" />
        </>
      );

      await rerenderCard(<CardField name="postcode" required />);

      await waitFor(() =>
        expect(lastPayload(onChange)).toMatchObject({
          fields: { postcode: null },
          isComplete: false,
        })
      );
    });

    it("renders the second once the first is gone", async () => {
      const { queryByTestId, rerenderCard } = await renderCard(
        <>
          <CardNumber testID="first" />
          <CardNumber testID="second" />
        </>
      );

      await rerenderCard(<CardNumber testID="second" />);

      expect(queryByTestId("second")).toBeTruthy();
    });

    it("warns only once while the card renders again", async () => {
      const fields = (
        <>
          <CardNumber />
          <CardNumber />
        </>
      );
      const { rerenderCard } = await renderCard(fields);

      await rerenderCard(fields);

      expect(warn).toHaveBeenCalledTimes(1);
    });
  });

  it("leaves out a Card.Field without a name", async () => {
    const { queryByTestId } = await renderCard(
      <CardField testID="nameless" name="" />
    );

    expect(queryByTestId("nameless")).toBeNull();
    expect(warn).toHaveBeenCalledWith(NAMELESS_CUSTOM_FIELD);
  });

  describe("an expiry the card cannot render", () => {
    it("renders nothing for one half without the other", async () => {
      const { queryByTestId } = await renderCard(
        <>
          <CardNumber testID="number" />
          <CardExpiryMonth testID="month" />
        </>
      );

      expect(queryByTestId("number")).toBeNull();
      expect(queryByTestId("month")).toBeNull();
      expect(error).toHaveBeenCalledWith(loneExpiryHalf("expiryMonth"));
    });

    it("keeps the last fields it could render", async () => {
      const { queryByTestId, rerenderCard } = await renderCard(
        <>
          <CardNumber testID="number" />
          <CardExpiry testID="expiry" />
        </>
      );

      await rerenderCard(
        <>
          <CardNumber testID="number" />
          <CardExpiry testID="expiry" />
          <CardExpiryYear testID="year" />
        </>
      );

      expect(queryByTestId("number")).toBeTruthy();
      expect(queryByTestId("expiry")).toBeTruthy();
      expect(queryByTestId("year")).toBeNull();
      expect(error).toHaveBeenCalledWith(COMBINED_EXPIRY_WITH_HALF);
    });

    it("renders the halves once both are declared", async () => {
      const { queryByTestId, rerenderCard } = await renderCard(
        <CardExpiryMonth testID="month" />
      );

      await rerenderCard(
        <>
          <CardExpiryMonth testID="month" />
          <CardExpiryYear testID="year" />
        </>
      );

      expect(queryByTestId("month")).toBeTruthy();
      expect(queryByTestId("year")).toBeTruthy();
    });
  });
});
