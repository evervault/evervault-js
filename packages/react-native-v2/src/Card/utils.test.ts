import { encryptedValue } from "../__mocks__/NativeEvervault";
import { EncryptFn } from "../context";
import {
  areValuesComplete,
  formatExpiry,
  formatPayload,
  isAcceptedBrand,
} from "./utils";

describe("formatPayload", () => {
  const setValue = vi.fn();

  const encrypt = vi.fn<EncryptFn>(
    () => Promise.resolve(encryptedValue) as any
  );

  it("should format the payload", async () => {
    const result = await formatPayload(
      {
        name: "John Doe",
        number: "4242424242424242",
        expiry: "1234",
        cvc: "123",
      },
      {
        encrypt,
        form: {
          setValue,
          formState: {
            errors: {},
          },
        } as any,
      }
    );

    expect(result).toEqual({
      card: {
        name: "John Doe",
        brand: "visa",
        localBrands: [],
        bin: "42424242",
        lastFour: "4242",
        expiry: {
          month: "12",
          year: "34",
        },
        number: encryptedValue,
        cvc: encryptedValue,
      },
      isComplete: true,
      isValid: true,
      errors: {},
    });
  });

  it("should slice the CVC to 3 characters if brand isn't American Express", async () => {
    await formatPayload(
      {
        name: "John Doe",
        number: "4242424242424242",
        expiry: "1234",
        cvc: "1234",
      },
      {
        encrypt,
        form: {
          setValue,
          formState: {
            errors: {},
          },
        } as any,
      }
    );

    expect(setValue).toHaveBeenCalledWith("cvc", "123");
  });

  it("should return isValid=false if any errors are present", async () => {
    const result = await formatPayload(
      {
        name: "",
      },
      {
        encrypt,
        form: {
          setValue,
          formState: {
            errors: {
              name: {
                message: "Required",
              },
            },
          },
        } as any,
      }
    );

    expect(result).toEqual({
      card: {
        name: "",
        brand: null,
        localBrands: [],
        bin: null,
        lastFour: null,
        expiry: null,
        number: null,
        cvc: null,
      },
      isComplete: false,
      isValid: false,
      errors: {
        name: "Required",
      },
    });
  });

  it("should ignore values if they are not provided", async () => {
    const result = await formatPayload(
      {
        name: "John Doe",
      },
      {
        encrypt,
        form: {
          setValue,
          formState: {
            errors: {},
          },
        } as any,
      }
    );

    expect(result).toEqual({
      card: {
        name: "John Doe",
        brand: null,
        localBrands: [],
        bin: null,
        lastFour: null,
        expiry: null,
        number: null,
        cvc: null,
      },
      isComplete: true,
      isValid: true,
      errors: {},
    });
  });
});

describe("areValuesComplete", () => {
  it("should return true if all values are complete and valid", () => {
    const result = areValuesComplete({
      name: "John Doe",
      number: "4242424242424242",
      expiry: "1234",
      cvc: "123",
    });
    expect(result).toBe(true);
  });

  it("should return true if all _provided_ values are complete", () => {
    const result = areValuesComplete({
      name: "John Doe",
    });
    expect(result).toBe(true);

    const result2 = areValuesComplete({
      number: "4242424242424242",
      expiry: "1234",
      cvc: "123",
    });
    expect(result2).toBe(true);
  });

  it("should return false if any value is missing", () => {
    const result = areValuesComplete({
      name: "John Doe",
      number: "",
      expiry: "",
      cvc: "",
    });
    expect(result).toBe(false);
  });

  it("should return false if any value is invalid", () => {
    const result = areValuesComplete({
      number: "1234567890",
    });
    expect(result).toBe(false);

    const result2 = areValuesComplete({
      expiry: "123",
    });
    expect(result2).toBe(false);

    const result3 = areValuesComplete({
      cvc: "1",
    });
    expect(result3).toBe(false);
  });
});

describe("isAcceptedBrand", () => {
  it("should return true if no accepted brands are provided", () => {
    const undef = isAcceptedBrand(undefined, {
      brand: "visa",
      bin: "123456",
      lastFour: "1234",
      localBrands: [],
      isValid: true,
    });
    expect(undef).toBe(true);

    const emptyArr = isAcceptedBrand([], {
      brand: "visa",
      bin: "123456",
      lastFour: "1234",
      localBrands: [],
      isValid: true,
    });
    expect(emptyArr).toBe(true);
  });

  it("should return true if the brand is accepted", () => {
    const result = isAcceptedBrand(["visa"], {
      brand: "visa",
      bin: "123456",
      lastFour: "1234",
      localBrands: [],
      isValid: true,
    });
    expect(result).toBe(true);
  });

  it("should return true if the local brand is accepted", () => {
    const result = isAcceptedBrand(["hiper"], {
      brand: "visa",
      bin: "123456",
      lastFour: "1234",
      localBrands: ["hiper"],
      isValid: true,
    });
    expect(result).toBe(true);
  });

  it("should return false if the brand is not accepted", () => {
    const result = isAcceptedBrand(["visa"], {
      brand: "mastercard",
      bin: "123456",
      lastFour: "1234",
      localBrands: [],
      isValid: true,
    });
    expect(result).toBe(false);
  });
});

describe("formatExpiry", () => {
  it("should return null if the expiry date is invalid", () => {
    const expiry = "123";
    const formatted = formatExpiry(expiry);
    expect(formatted).toBeNull();
  });

  it("should format the expiry date", () => {
    const expiry = "1234";
    const formatted = formatExpiry(expiry);
    expect(formatted).toEqual({ month: "12", year: "34" });
  });
});
