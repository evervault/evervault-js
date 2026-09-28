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

it("shares its width between the fields inside it", async () => {
  const { getByTestId, getByText } = await render(
    <Card>
      <CardRow>
        <CardNumber testID="number" style={{ height: 40 }} />
        <CardCvc testID="cvc" label="CVC" />
      </CardRow>
    </Card>,
    { wrapper }
  );

  expect(getByTestId("number")).toHaveStyle({ flex: 1, height: 40 });
  expect(getByText("CVC").parent).toHaveStyle({ flex: 1 });
});

it("leaves the style of a field outside a row as given", async () => {
  const { getByTestId } = await render(
    <Card>
      <CardNumber testID="number" style={{ height: 40 }} />
    </Card>,
    { wrapper }
  );

  expect(getByTestId("number")).toHaveProp("style", { height: 40 });
});
