import { CardForm } from "./types";
import { changePayload } from "./utilities";

function getFutureExpiry() {
  const futureExpiry = new Date();
  futureExpiry.setFullYear(futureExpiry.getFullYear() + 4);
  const month = futureExpiry.getMonth() + 1;
  const year = futureExpiry.getFullYear() % 100;
  if (month < 10) {
    return `0${month}${year}`;
  }
  return `${month}${year}`;
}

it("Ignores the card number if it is not included in the fields", async () => {
  const mockEncrypt = jest.fn();
  const expiry = getFutureExpiry();
  const sampleFormPayload = {
    name: "John Doe",
    expiry,
    cvc: "123",
  } as CardForm;

  mockEncrypt.mockImplementation((value: string) => `ev:${value}`);
  const result = await changePayload(
    mockEncrypt,
    {
      values: sampleFormPayload,
      isValid: true,
      errors: {},
      setValues: jest.fn(),
      setValue: jest.fn(),
      setError: jest.fn(),
      validate: jest.fn(),
      register: jest.fn(),
    },
    ["name", "expiry", "cvc"]
  );

  expect(result.card.number).toBeNull();
  expect(result.card.cvc).toBe(`ev:${sampleFormPayload.cvc}`);
  expect(result.isValid).toBe(true);
  expect(result.isComplete).toBe(true);
});

it("Ignores the name if it is not included in the fields", async () => {
  const mockEncrypt = jest.fn();
  const expiry = getFutureExpiry();
  const sampleFormPayload = {
    number: "4242 4242 4242 4242",
    expiry,
    cvc: "123",
  } as CardForm;

  mockEncrypt.mockImplementation((value: string) => `ev:${value}`);
  const result = await changePayload(
    mockEncrypt,
    {
      values: sampleFormPayload,
      isValid: true,
      errors: {},
      setValues: jest.fn(),
      setValue: jest.fn(),
      setError: jest.fn(),
      validate: jest.fn(),
      register: jest.fn(),
    },
    ["number", "expiry", "cvc"]
  );

  expect(result.card.name).toBeFalsy();
  expect(result.card.number).toBe(
    `ev:${sampleFormPayload.number.replaceAll(" ", "")}`
  );
  expect(result.card.cvc).toBe(`ev:${sampleFormPayload.cvc}`);
  expect(result.isValid).toBe(true);
  expect(result.isComplete).toBe(true);
});

it("Ignores the cvc if it is not included in the fields", async () => {
  const mockEncrypt = jest.fn();
  const expiry = getFutureExpiry();
  const sampleFormPayload = {
    number: "4242 4242 4242 4242",
    expiry,
    name: "John Doe",
  } as CardForm;

  mockEncrypt.mockImplementation((value: string) => `ev:${value}`);
  const result = await changePayload(
    mockEncrypt,
    {
      values: sampleFormPayload,
      isValid: true,
      errors: {},
      setValues: jest.fn(),
      setValue: jest.fn(),
      setError: jest.fn(),
      validate: jest.fn(),
      register: jest.fn(),
    },
    ["number", "expiry", "name"]
  );

  expect(result.card.name).toBe(sampleFormPayload.name);
  expect(result.card.number).toBe(
    `ev:${sampleFormPayload.number.replaceAll(" ", "")}`
  );
  expect(result.card.cvc).toBeFalsy();
  expect(result.isValid).toBe(true);
  expect(result.isComplete).toBe(true);
});
