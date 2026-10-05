import { userEvent, waitFor } from "@testing-library/react-native";
import { vi } from "vitest";
import { lastPayload, renderCard } from "../../test/helpers/card";
import { CardField } from "./Field";
import { invalidPattern } from "./developerMessages";
import { encryptedValue } from "../__mocks__/NativeEvervault";

describe("field settings", () => {
  describe("defaultValue", () => {
    const postcode = (defaultValue: string) => (
      <CardField
        testID="postcode"
        name="postcode"
        defaultValue={defaultValue}
      />
    );

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
