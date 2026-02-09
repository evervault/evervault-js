import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { EvervaultInput, EvervaultInputContext, mask } from "./Input";
import { FieldErrors, FormProvider, Resolver, useForm } from "react-hook-form";
import { PropsWithChildren } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

  it("should account for obfuscation", () => {
    expect(mask("[9999 9999] 9999")).toEqual([
      [/\d/],
      [/\d/],
      [/\d/],
      [/\d/],
      " ",
      [/\d/],
      [/\d/],
      [/\d/],
      [/\d/],
      " ",
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
    setError: vi.fn(),
  };

  interface FormProps {
    resolver?: Resolver<any>;
  }

  function Form({ children, resolver }: PropsWithChildren<FormProps>) {
    const methods = useForm({
      resolver,
    });
    const setValue = (...args: Parameters<typeof methods.setValue>) => {
      methodMocks.setValue(...args);
      methods.setValue(...args);
    };
    const setError = (...args: Parameters<typeof methods.setError>) => {
      methodMocks.setError(...args);
      methods.setError(...args);
    };
    return (
      <FormProvider {...methods} setValue={setValue} setError={setError}>
        {children}
      </FormProvider>
    );
  }

  function createForm(options: FormProps) {
    return function (props: PropsWithChildren<FormProps>) {
      return <Form {...options} {...props} />;
    };
  }

  it("should render", async () => {
    await render(<EvervaultInput testID="phone" name="phone" />, {
      wrapper: Form,
    });

    const input = screen.getByTestId("phone");
    expect(input).toBeOnTheScreen();
    expect(input).toHaveProp("id", "phone");
    expect(input).toHaveProp("value", "");
    expect(input).toHaveProp("editable", true);
  });

  it("uses the mask if provided", async () => {
    await render(
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
    await render(<EvervaultInput testID="phone" name="phone" />, {
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
    await render(<EvervaultInput testID="phone" name="phone" />, {
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
    await render(<EvervaultInput testID="phone" name="phone" />, {
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

  it("only validates the field when blurred if validationMode=onBlur", async () => {
    await render(
      <EvervaultInputContext.Provider value={{ validationMode: "onBlur" }}>
        <EvervaultInput testID="phone" name="phone" />
      </EvervaultInputContext.Provider>,
      {
        wrapper: Form,
      }
    );

    const input = screen.getByTestId("phone");

    fireEvent(input, "blur");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith("phone", undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    const user = userEvent.setup();
    await user.type(input, "1234567890", { skipBlur: true });
    expect(input).toHaveProp("value", "1234567890");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith(
      "phone",
      "1234567890",
      {
        shouldDirty: true,
        shouldValidate: false,
      }
    );
  });

  it("only validates the field after first touch if validationMode=onTouched", async () => {
    await render(
      <EvervaultInputContext.Provider value={{ validationMode: "onTouched" }}>
        <EvervaultInput testID="phone" name="phone" />
      </EvervaultInputContext.Provider>,
      {
        wrapper: Form,
      }
    );

    const input = screen.getByTestId("phone");

    const user = userEvent.setup();
    await user.type(input, "1234", { skipBlur: true });
    expect(input).toHaveProp("value", "1234");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith("phone", "1234", {
      shouldDirty: true,
      shouldValidate: false,
    });

    fireEvent(input, "blur");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith("phone", "1234", {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    await user.type(input, "567890", { skipBlur: true });
    expect(input).toHaveProp("value", "1234567890");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith(
      "phone",
      "1234567890",
      { shouldDirty: true, shouldValidate: true }
    );
  });

  it("only validates the field when changed if validationMode=onChange and the field is touched", async () => {
    await render(
      <EvervaultInputContext.Provider value={{ validationMode: "onChange" }}>
        <EvervaultInput testID="phone" name="phone" />
      </EvervaultInputContext.Provider>,
      {
        wrapper: Form,
      }
    );

    const input = screen.getByTestId("phone");

    const user = userEvent.setup();
    await user.type(input, "1234567890", { skipBlur: true });
    expect(input).toHaveProp("value", "1234567890");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith(
      "phone",
      "1234567890",
      { shouldDirty: true, shouldValidate: false }
    );

    fireEvent(input, "blur");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith(
      "phone",
      "1234567890",
      { shouldDirty: true, shouldTouch: true, shouldValidate: false }
    );

    await user.type(input, "1", { skipBlur: true });
    expect(input).toHaveProp("value", "12345678901");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith(
      "phone",
      "12345678901",
      { shouldDirty: true, shouldValidate: true }
    );
  });

  it("only validates the field when changed if validationMode=onChange and the field has errors", async () => {
    await render(
      <EvervaultInputContext.Provider value={{ validationMode: "onChange" }}>
        <EvervaultInput testID="phone" name="phone" />
      </EvervaultInputContext.Provider>,
      {
        wrapper: createForm({
          resolver: zodResolver(z.object({ phone: z.string().min(10) })),
        }),
      }
    );

    const input = screen.getByTestId("phone");

    const user = userEvent.setup();
    await user.type(input, "1234", { skipBlur: true });
    expect(input).toHaveProp("value", "1234");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith("phone", "1234", {
      shouldDirty: true,
      shouldValidate: false,
    });

    fireEvent(input, "blur");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith("phone", "1234", {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: false,
    });

    await user.type(input, "5", { skipBlur: true });
    expect(input).toHaveProp("value", "12345");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith("phone", "12345", {
      shouldDirty: true,
      shouldValidate: true,
    });
  });

  it("validates on blur, touch, and change if validationMode=all", async () => {
    await render(
      <EvervaultInputContext.Provider value={{ validationMode: "all" }}>
        <EvervaultInput testID="phone" name="phone" />
      </EvervaultInputContext.Provider>,
      {
        wrapper: createForm({
          resolver: zodResolver(z.object({ phone: z.string().min(10) })),
        }),
      }
    );

    const input = screen.getByTestId("phone");

    const user = userEvent.setup();
    await user.type(input, "1234", { skipBlur: true });
    expect(input).toHaveProp("value", "1234");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith("phone", "1234", {
      shouldDirty: true,
      shouldValidate: false,
    });

    fireEvent(input, "blur");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith("phone", "1234", {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    await user.type(input, "567890", { skipBlur: true });
    expect(input).toHaveProp("value", "1234567890");
    expect(methodMocks.setValue).toHaveBeenLastCalledWith(
      "phone",
      "1234567890",
      { shouldDirty: true, shouldValidate: true }
    );
  });

  it("should obfuscate the value when obfuscateValue=true", async () => {
    const phoneMask = mask("[(999) 999]-9999");
    const { rerender } = await render(
      <EvervaultInput testID="phone" mask={phoneMask} name="phone" />,
      {
        wrapper: Form,
      }
    );

    const input = screen.getByTestId("phone");
    const user = userEvent.setup();

    await user.type(input, "1234567890");
    expect(input).toHaveProp("value", "(123) 456-7890");

    await rerender(
      <EvervaultInput
        testID="phone"
        mask={phoneMask}
        name="phone"
        obfuscateValue
      />
    );

    await user.type(input, "1234567890");
    expect(input).toHaveProp("value", "(•••) •••-7890");

    await rerender(
      <EvervaultInput
        testID="phone"
        mask={phoneMask}
        name="phone"
        obfuscateValue="#"
      />
    );

    await user.type(input, "1234567890");
    expect(input).toHaveProp("value", "(###) ###-7890");

    await rerender(
      <EvervaultInput
        testID="phone"
        mask={phoneMask}
        name="phone"
        obfuscateValue="🤔"
      />
    );

    await user.type(input, "1234567890");
    expect(input).toHaveProp("value", "(🤔🤔🤔) 🤔🤔🤔-7890");

    const unobfuscatedMask = mask("(999) 999-9999");
    await rerender(
      <EvervaultInput
        testID="phone"
        mask={unobfuscatedMask}
        name="phone"
        obfuscateValue
      />
    );

    await user.type(input, "1234567890");
    expect(input).toHaveProp("value", "(123) 456-7890");
  });
});
