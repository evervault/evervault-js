import { render } from "@testing-library/react-native";
import { vi } from "vitest";
import { renderCard, wrapper } from "../../test/helpers/card";
import { Card } from "./Root";
import { CardNumber } from "./Number";
import { CardExpiry } from "./Expiry";
import { CardExpiryMonth, CardExpiryYear } from "./ExpiryPart";
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

  it("renders the second once the first is gone", async () => {
    const { queryByTestId, rerender } = await render(
      <Card>
        <CardNumber testID="first" />
        <CardNumber testID="second" />
      </Card>,
      { wrapper }
    );

    await rerender(
      <Card>
        <CardNumber testID="second" />
      </Card>
    );

    expect(queryByTestId("second")).toBeTruthy();
  });

  it("warns only once while the card renders again", async () => {
    const { rerender } = await render(
      <Card>
        <CardNumber />
        <CardNumber />
      </Card>,
      { wrapper }
    );

    await rerender(
      <Card>
        <CardNumber />
        <CardNumber />
      </Card>
    );

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
    const { queryByTestId, rerender } = await render(
      <Card>
        <CardNumber testID="number" />
        <CardExpiry testID="expiry" />
      </Card>,
      { wrapper }
    );

    await rerender(
      <Card>
        <CardNumber testID="number" />
        <CardExpiry testID="expiry" />
        <CardExpiryYear testID="year" />
      </Card>
    );

    expect(queryByTestId("number")).toBeTruthy();
    expect(queryByTestId("expiry")).toBeTruthy();
    expect(queryByTestId("year")).toBeNull();
    expect(error).toHaveBeenCalledWith(COMBINED_EXPIRY_WITH_HALF);
  });

  it("renders the halves once both are declared", async () => {
    const { queryByTestId, rerender } = await render(
      <Card>
        <CardExpiryMonth testID="month" />
      </Card>,
      { wrapper }
    );

    await rerender(
      <Card>
        <CardExpiryMonth testID="month" />
        <CardExpiryYear testID="year" />
      </Card>
    );

    expect(queryByTestId("month")).toBeTruthy();
    expect(queryByTestId("year")).toBeTruthy();
  });
});
