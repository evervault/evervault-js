import { render, within } from "@testing-library/react-native";
import { wrapper } from "../../test/helpers/card";
import { Card } from "./Root";
import { CardNumber } from "./Number";

it("renders the label above the field", async () => {
  const { getByText } = await render(
    <Card>
      <CardNumber
        testID="number"
        label="Card number"
        labelStyle={{ color: "red" }}
      />
    </Card>,
    { wrapper }
  );

  const label = getByText("Card number");
  expect(label).toHaveStyle({ color: "red" });

  const wrapped = label.parent;
  if (!wrapped) throw new Error("label rendered without a wrapper");
  expect(within(wrapped).getByTestId("number")).toBeOnTheScreen();
  expect(wrapped.children[0]).toBe(label);
});

it("reads the label out as the field's accessibility label", async () => {
  const { getByLabelText } = await render(
    <Card>
      <CardNumber testID="number" label="Card number" />
    </Card>,
    { wrapper }
  );

  expect(getByLabelText("Card number")).toHaveProp("testID", "number");
});

it("leaves the label text for the field to read out", async () => {
  const { getByText } = await render(
    <Card>
      <CardNumber label="Card number" />
    </Card>,
    { wrapper }
  );

  expect(getByText("Card number")).toHaveProp("accessible", false);
});

it("keeps an accessibility label given alongside the label", async () => {
  const { getByTestId } = await render(
    <Card>
      <CardNumber
        testID="number"
        label="Card number"
        accessibilityLabel="Long card number"
      />
    </Card>,
    { wrapper }
  );

  expect(getByTestId("number")).toHaveProp(
    "accessibilityLabel",
    "Long card number"
  );
});

it("renders no text without a label", async () => {
  const { toJSON } = await render(
    <Card>
      <CardNumber testID="number" />
    </Card>,
    { wrapper }
  );

  expect(JSON.stringify(toJSON())).not.toContain('"Text"');
});
