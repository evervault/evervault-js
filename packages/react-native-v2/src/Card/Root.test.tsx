import { PropsWithChildren } from "react";
import { EvervaultProvider } from "../EvervaultProvider";
import {
  act,
  fireEvent,
  render,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { Card } from "./Root";
import { ErrorBoundary } from "../utils";
import { CardHolder } from "./Holder";
import { CardNumber } from "./Number";
import { CardExpiry } from "./Expiry";
import { CardCvc } from "./Cvc";
import { encryptedValue } from "../__mocks__/NativeEvervault";

function wrapper({ children }: PropsWithChildren) {
  return (
    <EvervaultProvider teamId="team_123" appId="app_123">
      {children}
    </EvervaultProvider>
  );
}

it("fails if not wrapped in an EvervaultProvider", async () => {
  const onError = vi.fn();
  await render(
    <ErrorBoundary onError={onError}>
      <Card />
    </ErrorBoundary>
  );

  expect(onError).toHaveBeenCalledWith(
    new Error("`useEvervault` must be used within an `EvervaultProvider`.")
  );
});

it("calls onChange when mounted", async () => {
  const onChange = vi.fn();
  await render(<Card onChange={onChange} />, { wrapper });

  await waitFor(() => {
    expect(onChange).toHaveBeenCalledWith({
      card: {
        name: null,
        brand: null,
        localBrands: [],
        number: null,
        lastFour: null,
        bin: null,
        expiry: null,
        cvc: null,
      },
      isValid: true,
      isComplete: true,
      errors: {},
    });
  });
});

it("renders card components", async () => {
  const onChange = vi.fn();
  const { getByTestId } = await render(
    <Card onChange={onChange}>
      <CardHolder testID="holder" />
    </Card>,
    { wrapper }
  );

  const holder = getByTestId("holder");
  expect(holder).toBeOnTheScreen();
  expect(holder).toHaveProp("placeholder", "Johnny Appleseed");

  const user = userEvent.setup();
  await user.type(holder, "John Doe");
  expect(holder).toHaveProp("value", "John Doe");

  expect(onChange).toHaveBeenLastCalledWith({
    card: {
      name: "John Doe",
      brand: null,
      localBrands: [],
      number: null,
      lastFour: null,
      bin: null,
      expiry: null,
      cvc: null,
    },
    isValid: true,
    isComplete: true,
    errors: {},
  });
});

it("calls onChange when the user types", async () => {
  const onChange = vi.fn();
  const { getByTestId } = await render(
    <Card onChange={onChange}>
      <CardHolder testID="holder" />
      <CardNumber testID="number" />
      <CardExpiry testID="expiry" />
      <CardCvc testID="cvc" />
    </Card>,
    { wrapper }
  );

  const holder = getByTestId("holder");
  const number = getByTestId("number");
  const expiry = getByTestId("expiry");
  const cvc = getByTestId("cvc");

  const user = userEvent.setup();
  await user.type(holder, "John Doe");
  await user.type(number, "4242 4242 4242 4242");
  await user.type(expiry, "12 / 34");
  await user.type(cvc, "123");

  expect(onChange).toHaveBeenLastCalledWith({
    card: {
      name: "John Doe",
      brand: "visa",
      localBrands: [],
      number: encryptedValue,
      lastFour: "4242",
      bin: "42424242",
      expiry: {
        month: "12",
        year: "34",
      },
      cvc: encryptedValue,
    },
    isValid: true,
    isComplete: true,
    errors: {},
  });
});

it("resets all fields when reset is called", async () => {
  const ref = { current: null as any };
  const onChange = vi.fn();
  const { getByTestId } = await render(
    <Card ref={ref} onChange={onChange}>
      <CardHolder testID="holder" />
    </Card>,
    { wrapper }
  );

  const holder = getByTestId("holder");
  const user = userEvent.setup();

  await user.type(holder, "John Doe");
  expect(holder).toHaveProp("value", "John Doe");
  expect(onChange).toHaveBeenLastCalledWith({
    card: {
      name: "John Doe",
      brand: null,
      localBrands: [],
      number: null,
      lastFour: null,
      bin: null,
      expiry: null,
      cvc: null,
    },
    isValid: true,
    isComplete: true,
    errors: {},
  });

  await act(() => ref.current?.reset());

  expect(holder).toHaveProp("value", "");
  expect(onChange).toHaveBeenCalledWith({
    card: {
      name: null,
      brand: null,
      localBrands: [],
      number: null,
      lastFour: null,
      bin: null,
      expiry: null,
      cvc: null,
    },
    isValid: false,
    isComplete: false,
    errors: {},
  });
});

it("adds Required error when input is blurred without a value", async () => {
  const onChange = vi.fn();
  const { getByTestId } = await render(
    <Card onChange={onChange}>
      <CardNumber testID="number" />
    </Card>,
    { wrapper }
  );

  const number = getByTestId("number");

  const user = userEvent.setup();
  await user.type(number, "");
  fireEvent(number, "blur");

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith({
      card: {
        name: null,
        brand: null,
        localBrands: [],
        number: null,
        lastFour: null,
        bin: null,
        expiry: null,
        cvc: null,
      },
      isValid: false,
      isComplete: false,
      errors: {
        number: "Required",
      },
    });
  });
});

it("adds Invalid error when input is blurred with an invalid value", async () => {
  const onChange = vi.fn();
  const { getByTestId } = await render(
    <Card onChange={onChange}>
      <CardNumber testID="number" />
    </Card>,
    { wrapper }
  );

  const number = getByTestId("number");

  const user = userEvent.setup();
  await user.type(number, "4242");
  fireEvent(number, "blur");

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith({
      card: {
        name: null,
        brand: "visa",
        localBrands: [],
        number: null,
        lastFour: null,
        bin: null,
        expiry: null,
        cvc: null,
      },
      isValid: false,
      isComplete: false,
      errors: {
        number: "Invalid card number",
      },
    });
  });
});

it("adds 'Brand not accepted' error when brand is not accepted", async () => {
  const onChange = vi.fn();
  const { getByTestId } = await render(
    <Card onChange={onChange} acceptedBrands={["american-express"]}>
      <CardNumber testID="number" />
    </Card>,
    { wrapper }
  );

  const number = getByTestId("number");

  const user = userEvent.setup();
  await user.type(number, "4242");
  fireEvent(number, "blur");

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith({
      card: {
        name: null,
        brand: "visa",
        localBrands: [],
        number: null,
        lastFour: null,
        bin: null,
        expiry: null,
        cvc: null,
      },
      isValid: false,
      isComplete: false,
      errors: {
        number: "Invalid card number",
      },
    });
  });

  await user.type(number, "4242 4242 4242");
  fireEvent(number, "blur");

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith({
      card: {
        name: null,
        brand: "visa",
        localBrands: [],
        number: expect.any(String),
        lastFour: "4242",
        bin: "42424242",
        expiry: null,
        cvc: null,
      },
      isValid: false,
      isComplete: true,
      errors: {
        number: "Brand not accepted",
      },
    });
  });

  await user.clear(number);
  await user.type(number, "3782 822463 10005");
  fireEvent(number, "blur");

  await waitFor(() => {
    expect(onChange).toHaveBeenLastCalledWith({
      card: {
        name: null,
        brand: "american-express",
        localBrands: [],
        number: expect.any(String),
        lastFour: "0005",
        bin: "378282",
        expiry: null,
        cvc: null,
      },
      isValid: true,
      isComplete: true,
      errors: {},
    });
  });
});
