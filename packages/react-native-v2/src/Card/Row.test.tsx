import { renderCard } from "../../test/helpers/card";
import { CardRow } from "./Row";
import { CardNumber } from "./Number";
import { CardCvc } from "./Cvc";

describe("Card.Row", () => {
  it("places its fields side by side", async () => {
    const { getByTestId } = await renderCard(
      <CardRow testID="row" style={{ gap: 12 }}>
        <CardCvc />
      </CardRow>
    );

    expect(getByTestId("row")).toHaveStyle({ flexDirection: "row", gap: 12 });
  });

  it("gives each child an equal share of its width", async () => {
    const { getByTestId } = await renderCard(
      <CardRow>
        <CardNumber testID="number" />
        <CardCvc testID="cvc" />
      </CardRow>
    );

    expect(getByTestId("number").parent).toHaveStyle({ flex: 1 });
    expect(getByTestId("cvc").parent).toHaveStyle({ flex: 1 });
  });

  it("leaves the style of the fields inside it as given", async () => {
    const { getByTestId } = await renderCard(
      <CardRow>
        <CardNumber testID="number" style={{ height: 40 }} />
      </CardRow>
    );

    expect(getByTestId("number")).toHaveProp("style", { height: 40 });
  });

  it("leaves no cell for a child that renders nothing", async () => {
    const showCvc = false;
    const { getByTestId } = await renderCard(
      <CardRow testID="row">
        <CardNumber testID="number" />
        {showCvc && <CardCvc testID="cvc" />}
      </CardRow>
    );

    expect(getByTestId("row").children).toHaveLength(1);
  });
});
