import { render, userEvent } from "@testing-library/react-native";
import { PropsWithChildren } from "react";
import { Card } from "./Root";
import { EvervaultProvider } from "../EvervaultProvider";
import { CardNumber } from "./Number";

function wrapper({ children }: PropsWithChildren) {
  return (
    <EvervaultProvider teamId="team_123" appId="app_123">
      {children}
    </EvervaultProvider>
  );
}

it("uses 16 digits for mask by default", async () => {
  const { rerender, getByTestId } = await render(
    <Card>
      <CardNumber testID="number" />
    </Card>,
    { wrapper }
  );
  const number = getByTestId("number");

  const user = userEvent.setup();
  await user.type(number, "4242424242424242");
  expect(number).toHaveProp("value", "4242 4242 4242 4242");

  await rerender(
    <Card>
      <CardNumber testID="number" obfuscateValue />
    </Card>
  );
  expect(number).toHaveProp("value", "4242 42•• •••• ••••");
});

it("uses 19 digits for mask for unionpay", async () => {
  const { rerender, getByTestId } = await render(
    <Card>
      <CardNumber testID="number" />
    </Card>,
    { wrapper }
  );
  const number = getByTestId("number");

  const user = userEvent.setup();
  await user.type(number, "6205500000000000004");
  expect(number).toHaveProp("value", "6205 5000 0000 0000 004");

  await rerender(
    <Card>
      <CardNumber testID="number" obfuscateValue />
    </Card>
  );
  expect(number).toHaveProp("value", "6205 50•• •••• •••• •••");
});

it("uses 15 digits for mask for american express", async () => {
  const { rerender, getByTestId } = await render(
    <Card>
      <CardNumber testID="number" />
    </Card>,
    { wrapper }
  );
  const number = getByTestId("number");

  const user = userEvent.setup();
  await user.type(number, "371449635398431");
  expect(number).toHaveProp("value", "3714 496353 98431");

  await rerender(
    <Card>
      <CardNumber testID="number" obfuscateValue />
    </Card>
  );
  expect(number).toHaveProp("value", "3714 49•••• •••••");
});
