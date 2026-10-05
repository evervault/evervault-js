import { vi } from "vitest";
import { renderCard } from "../../test/helpers/card";
import { CardNumber } from "./Number";
import { duplicateField } from "./developerMessages";

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
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
});
