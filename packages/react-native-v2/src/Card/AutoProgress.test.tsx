import { render, userEvent } from "@testing-library/react-native";
import { forwardRef, useImperativeHandle } from "react";
import { View } from "react-native";
import { vi } from "vitest";
import { wrapper } from "../../test/helpers/card";
import { Card } from "./Root";
import { CardHolder } from "./Holder";
import { CardNumber } from "./Number";
import { CardExpiry } from "./Expiry";
import { CardExpiryMonth, CardExpiryYear } from "./ExpiryPart";
import { CardCvc } from "./Cvc";
import { CardField } from "./Field";

const focused = vi.hoisted(() => vi.fn<(testID?: string) => void>());

// The test renderer's inputs cannot take focus; each records being given it.
vi.mock("react-native-mask-input", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("react-native-mask-input")
  >();
  const MaskInput = actual.default;

  return {
    ...actual,
    default: forwardRef<unknown, { testID?: string }>(
      function RecordingMaskInput(props, ref) {
        useImperativeHandle(ref, () => ({
          focus: () => focused(props.testID),
        }));

        return <MaskInput {...(props as object)} />;
      }
    ),
  };
});

afterEach(() => {
  focused.mockReset();
});

it("keeps focus where it is unless asked to advance", async () => {
  const { getByTestId } = await render(
    <Card>
      <CardNumber testID="number" />
      <CardCvc testID="cvc" />
    </Card>,
    { wrapper }
  );

  const user = userEvent.setup();
  await user.type(getByTestId("number"), "4242424242424242");

  expect(focused).not.toHaveBeenCalled();
});

it("advances along the fields in the order they render", async () => {
  const { getByTestId } = await render(
    <Card autoProgress>
      <CardCvc testID="cvc" />
      <CardNumber testID="number" />
      <CardExpiry testID="expiry" />
    </Card>,
    { wrapper }
  );

  const user = userEvent.setup();
  await user.type(getByTestId("number"), "4242424242424242");
  expect(focused).toHaveBeenLastCalledWith("expiry");

  await user.type(getByTestId("cvc"), "123");
  expect(focused).toHaveBeenLastCalledWith("number");
});

it("advances through fields wrapped in the app's own views", async () => {
  const { getByTestId } = await render(
    <Card autoProgress>
      <View>
        <CardExpiryMonth testID="month" />
      </View>
      <View>
        <View>
          <CardExpiryYear testID="year" />
        </View>
      </View>
    </Card>,
    { wrapper }
  );

  const user = userEvent.setup();
  await user.type(getByTestId("month"), "12");

  expect(focused).toHaveBeenLastCalledWith("year");
});

it("advances only once the field is filled", async () => {
  const { getByTestId } = await render(
    <Card autoProgress>
      <CardNumber testID="number" />
      <CardCvc testID="cvc" />
    </Card>,
    { wrapper }
  );

  const user = userEvent.setup();
  await user.type(getByTestId("number"), "424242424242424");

  expect(focused).not.toHaveBeenCalled();
});

it("advances from an American Express number at 15 digits", async () => {
  const { getByTestId } = await render(
    <Card autoProgress>
      <CardNumber testID="number" />
      <CardCvc testID="cvc" />
    </Card>,
    { wrapper }
  );

  const user = userEvent.setup();
  await user.type(getByTestId("number"), "371449635398431");

  expect(focused).toHaveBeenLastCalledWith("cvc");
});

it("stops at the last field", async () => {
  const { getByTestId } = await render(
    <Card autoProgress>
      <CardCvc testID="cvc" />
    </Card>,
    { wrapper }
  );

  const user = userEvent.setup();
  await user.type(getByTestId("cvc"), "123");

  expect(focused).not.toHaveBeenCalled();
});

it("never advances from fields without a fixed length", async () => {
  const { getByTestId } = await render(
    <Card autoProgress>
      <CardHolder testID="holder" />
      <CardField testID="postcode" name="postcode" maxLength={4} />
      <CardCvc testID="cvc" />
    </Card>,
    { wrapper }
  );

  const user = userEvent.setup();
  await user.type(getByTestId("holder"), "Jo");
  await user.type(getByTestId("postcode"), "SW1A");

  expect(focused).not.toHaveBeenCalled();
});

it("adds a field rendered later to the end of the order", async () => {
  const { getByTestId, rerender } = await render(
    <Card autoProgress>
      <CardNumber key="number" testID="number" />
    </Card>,
    { wrapper }
  );

  await rerender(
    <Card autoProgress>
      <CardCvc key="cvc" testID="cvc" />
      <CardNumber key="number" testID="number" />
    </Card>
  );

  const user = userEvent.setup();
  await user.type(getByTestId("number"), "4242424242424242");

  expect(focused).toHaveBeenLastCalledWith("cvc");
});

it("keeps the order when the card turns auto-progress on", async () => {
  const { getByTestId, rerender } = await render(
    <Card>
      <CardNumber key="number" testID="number" />
    </Card>,
    { wrapper }
  );

  await rerender(
    <Card>
      <CardCvc key="cvc" testID="cvc" />
      <CardNumber key="number" testID="number" />
    </Card>
  );

  await rerender(
    <Card autoProgress>
      <CardCvc key="cvc" testID="cvc" />
      <CardNumber key="number" testID="number" />
    </Card>
  );

  const user = userEvent.setup();
  await user.type(getByTestId("number"), "4242424242424242");

  expect(focused).toHaveBeenLastCalledWith("cvc");
});
