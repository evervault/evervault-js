import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { EvervaultInput, mask } from "./Input";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { PropsWithChildren } from "react";
import { Text, View } from "react-native";

describe("mask", () => {
  it("should convert a mask to an array of regex", () => {
    expect(mask("999-999-9999")).toEqual([
      /\d/,
      /\d/,
      /\d/,
      "-",
      /\d/,
      /\d/,
      /\d/,
      "-",
      /\d/,
      /\d/,
      /\d/,
      /\d/,
    ]);
  });
});

describe("EvervaultInput", () => {
  const methodMocks = {
    setValue: vi.fn(),
  };

  function Form({ children }: PropsWithChildren) {
    const methods = useForm();
    const setValue = (...args: Parameters<typeof methods.setValue>) => {
      methodMocks.setValue(...args);
      methods.setValue(...args);
    };
    return (
      <FormProvider {...methods} setValue={setValue}>
        {children}
      </FormProvider>
    );
  }

  it("should render", async () => {
    render(<EvervaultInput testID="phone" name="phone" />, {
      wrapper: Form,
    });

    const input = screen.getByTestId("phone");
    expect(input).toBeOnTheScreen();
    expect(input).toHaveProp("id", "phone");
    expect(input).toHaveProp("value", "");
    expect(input).toHaveProp("editable", true);
  });

  it("uses the mask if provided", async () => {
    render(
      <EvervaultInput
        testID="phone"
        name="phone"
        mask={mask("999-999-9999")}
      />,
      {
        wrapper: Form,
      }
    );
    const input = screen.getByTestId("phone");
    const user = userEvent.setup();

    expect(input).toHaveProp("value", "");
    await user.type(input, "1234567890");
    expect(input).toHaveProp("value", "123-456-7890");

    expect(methodMocks.setValue).toHaveBeenCalledWith("phone", "1234567890", {
      shouldDirty: true,
      shouldValidate: false,
    });
  });

  it("dirties the field when the user types", async () => {
    render(<EvervaultInput testID="phone" name="phone" />, {
      wrapper: Form,
    });

    const input = screen.getByTestId("phone");
    const user = userEvent.setup();

    await user.type(input, "1234567890");
    expect(methodMocks.setValue).toHaveBeenCalledWith("phone", "1234567890", {
      shouldDirty: true,
      shouldValidate: false,
    });
  });

  it("dirties and validates the field when the user types if touched", async () => {
    render(<EvervaultInput testID="phone" name="phone" />, {
      wrapper: Form,
    });

    const input = screen.getByTestId("phone");

    // Blur the input to trigger touch
    fireEvent(input, "blur");
    expect(methodMocks.setValue).toHaveBeenCalledWith("phone", undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    const user = userEvent.setup();
    await user.type(input, "1234567890");
    expect(input).toHaveProp("value", "1234567890");
    expect(methodMocks.setValue).toHaveBeenCalledWith("phone", "1234567890", {
      shouldDirty: true,
      shouldValidate: true,
    });
  });

  it("dirties, touches, and validates the field when blurred", async () => {
    render(<EvervaultInput testID="phone" name="phone" />, {
      wrapper: Form,
    });

    const input = screen.getByTestId("phone");

    fireEvent(input, "blur");
    expect(methodMocks.setValue).toHaveBeenCalledWith("phone", undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  });
});
