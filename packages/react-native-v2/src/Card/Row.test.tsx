import { render } from "@testing-library/react-native";
import { wrapper } from "../../test/helpers/card";
import { Card } from "./Root";
import { CardRow } from "./Row";
import { CardNumber } from "./Number";
import { CardCvc } from "./Cvc";

it("places its fields side by side", async () => {
  const { getByTestId } = await render(
    <Card>
      <CardRow testID="row" style={{ gap: 12 }}>
        <CardCvc />
      </CardRow>
    </Card>,
    { wrapper }
  );

  expect(getByTestId("row")).toHaveStyle({ flexDirection: "row", gap: 12 });
});

it("gives each child an equal share of its width", async () => {
  const { getByTestId } = await render(
    <Card>
      <CardRow>
        <CardNumber testID="number" />
        <CardCvc testID="cvc" />
      </CardRow>
    </Card>,
    { wrapper }
  );

  expect(getByTestId("number").parent).toHaveStyle({ flex: 1 });
  expect(getByTestId("cvc").parent).toHaveStyle({ flex: 1 });
});

it("leaves the style of the fields inside it as given", async () => {
  const { getByTestId } = await render(
    <Card>
      <CardRow>
        <CardNumber testID="number" style={{ height: 40 }} />
      </CardRow>
    </Card>,
    { wrapper }
  );

  expect(getByTestId("number")).toHaveProp("style", { height: 40 });
});

it("leaves no cell for a child that renders nothing", async () => {
  const showCvc = false;
  const { getByTestId } = await render(
    <Card>
      <CardRow testID="row">
        <CardNumber testID="number" />
        {showCvc && <CardCvc testID="cvc" />}
      </CardRow>
    </Card>,
    { wrapper }
  );

  expect(getByTestId("row").children).toHaveLength(1);
});
