import { render, userEvent } from "@testing-library/react-native";
import { PropsWithChildren } from "react";
import { Card } from "./Root";
import { EvervaultProvider } from "../EvervaultProvider";
import { CardCvc } from "./Cvc";

function wrapper({ children }: PropsWithChildren) {
  return (
    <EvervaultProvider teamId="team_123" appId="app_123">
      {children}
    </EvervaultProvider>
  );
}

it("uses 3 digits for mask by default", async () => {
  const { getByTestId } = render(
    <Card>
      <CardCvc testID="cvc" />
    </Card>,
    { wrapper }
  );
  const cvc = getByTestId("cvc");

  const user = userEvent.setup();
  await user.type(cvc, "12345");
  expect(cvc).toHaveProp("value", "123");
});

it("uses 4 digits for mask for american express", async () => {
  const { getByTestId } = render(
    <Card initialValue={{ number: "378282246310005" }}>
      <CardCvc testID="cvc" />
    </Card>,
    { wrapper }
  );
  const cvc = getByTestId("cvc");

  const user = userEvent.setup();
  await user.type(cvc, "12345");
  expect(cvc).toHaveProp("value", "1234");
});
