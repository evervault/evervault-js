import { userEvent } from "@testing-library/react-native";
import { forwardRef, useImperativeHandle } from "react";
import { View } from "react-native";
import { vi } from "vitest";
import { renderCard } from "../../test/helpers/card";
import { CardHolder } from "./Holder";
import { CardNumber } from "./Number";
import { CardExpiry } from "./Expiry";
import { CardExpiryMonth, CardExpiryYear } from "./ExpiryHalf";
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

describe("auto-advance", () => {
  it("keeps focus where it is unless asked to advance", async () => {
    const { getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" />
        <CardCvc testID="cvc" />
      </>
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), "4242424242424242");

    expect(focused).not.toHaveBeenCalled();
  });

  it("advances along the fields in the order they render", async () => {
    const { getByTestId } = await renderCard(
      <>
        <CardCvc testID="cvc" />
        <CardNumber testID="number" />
        <CardExpiry testID="expiry" />
      </>,
      { autoProgress: true }
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), "4242424242424242");
    expect(focused).toHaveBeenLastCalledWith("expiry");

    await user.type(getByTestId("cvc"), "123");
    expect(focused).toHaveBeenLastCalledWith("number");
  });

  it("advances through fields wrapped in the app's own views", async () => {
    const { getByTestId } = await renderCard(
      <>
        <View>
          <CardExpiryMonth testID="month" />
        </View>
        <View>
          <View>
            <CardExpiryYear testID="year" />
          </View>
        </View>
      </>,
      { autoProgress: true }
    );

    const user = userEvent.setup();
    await user.type(getByTestId("month"), "12");

    expect(focused).toHaveBeenLastCalledWith("year");
  });

  it("advances only once the field is filled", async () => {
    const { getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" />
        <CardCvc testID="cvc" />
      </>,
      { autoProgress: true }
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), "424242424242424");

    expect(focused).not.toHaveBeenCalled();
  });

  it("advances from an American Express number at 15 digits", async () => {
    const { getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" />
        <CardCvc testID="cvc" />
      </>,
      { autoProgress: true }
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), "371449635398431");

    expect(focused).toHaveBeenLastCalledWith("cvc");
  });

  it("stops at the last field", async () => {
    const { getByTestId } = await renderCard(<CardCvc testID="cvc" />, {
      autoProgress: true,
    });

    const user = userEvent.setup();
    await user.type(getByTestId("cvc"), "123");

    expect(focused).not.toHaveBeenCalled();
  });

  it("never advances from fields without a fixed length", async () => {
    const { getByTestId } = await renderCard(
      <>
        <CardHolder testID="holder" />
        <CardField testID="note" name="note" />
        <CardCvc testID="cvc" />
      </>,
      { autoProgress: true }
    );

    const user = userEvent.setup();
    await user.type(getByTestId("holder"), "Jo");
    await user.type(getByTestId("note"), "Leave at the door");

    expect(focused).not.toHaveBeenCalled();
  });

  it("advances from the month once a single digit fills it", async () => {
    const { getByTestId } = await renderCard(
      <>
        <CardExpiryMonth testID="month" />
        <CardExpiryYear testID="year" />
      </>,
      { autoProgress: true }
    );

    const user = userEvent.setup();
    await user.type(getByTestId("month"), "4");

    expect(focused).toHaveBeenLastCalledWith("year");
  });

  it("advances from a custom field once it holds its maxLength", async () => {
    const { getByTestId } = await renderCard(
      <>
        <CardField testID="postcode" name="postcode" maxLength={4} />
        <CardCvc testID="cvc" />
      </>,
      { autoProgress: true }
    );

    const user = userEvent.setup();
    await user.type(getByTestId("postcode"), "SW1");
    expect(focused).not.toHaveBeenCalled();

    await user.type(getByTestId("postcode"), "A");
    expect(focused).toHaveBeenCalledWith("cvc");
  });

  it("lets a custom field turn off the auto-progress the card turns on", async () => {
    const { getByTestId } = await renderCard(
      <>
        <CardField
          testID="postcode"
          name="postcode"
          maxLength={4}
          autoProgress={false}
        />
        <CardCvc testID="cvc" />
      </>,
      { autoProgress: true }
    );

    const user = userEvent.setup();
    await user.type(getByTestId("postcode"), "SW1A");

    expect(focused).not.toHaveBeenCalled();
  });

  it("adds a field rendered later to the end of the order", async () => {
    const { getByTestId, rerenderCard } = await renderCard(
      <CardNumber key="number" testID="number" />,
      { autoProgress: true }
    );

    await rerenderCard(
      <>
        <CardCvc key="cvc" testID="cvc" />
        <CardNumber key="number" testID="number" />
      </>
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), "4242424242424242");

    expect(focused).toHaveBeenLastCalledWith("cvc");
  });

  it("keeps the order when the card turns auto-progress on", async () => {
    const { getByTestId, rerenderCard } = await renderCard(
      <CardNumber key="number" testID="number" />
    );

    const fields = (
      <>
        <CardCvc key="cvc" testID="cvc" />
        <CardNumber key="number" testID="number" />
      </>
    );

    await rerenderCard(fields);
    await rerenderCard(fields, { autoProgress: true });

    const user = userEvent.setup();
    await user.type(getByTestId("number"), "4242424242424242");

    expect(focused).toHaveBeenLastCalledWith("cvc");
  });

  it("lets a field turn off the auto-progress the card turns on", async () => {
    const { getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" />
        <CardCvc testID="cvc" autoProgress={false} />
        <CardExpiry testID="expiry" />
      </>,
      { autoProgress: true }
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), "4242424242424242");
    await user.type(getByTestId("cvc"), "123");

    expect(focused.mock.calls).toEqual([["cvc"]]);
  });

  it("advances from a field that turns auto-progress on for itself", async () => {
    const { getByTestId } = await renderCard(
      <>
        <CardNumber testID="number" autoProgress />
        <CardCvc testID="cvc" />
      </>
    );

    const user = userEvent.setup();
    await user.type(getByTestId("number"), "4242424242424242");

    expect(focused).toHaveBeenCalledWith("cvc");
  });
});
