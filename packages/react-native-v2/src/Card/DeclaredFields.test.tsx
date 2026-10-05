import { vi } from "vitest";
import { renderCard } from "../../test/helpers/card";
import { CardNumber } from "./Number";
import { CardExpiry } from "./Expiry";
import { CardExpiryMonth, CardExpiryYear } from "./ExpiryHalf";
import {
  COMBINED_EXPIRY_WITH_HALF,
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
