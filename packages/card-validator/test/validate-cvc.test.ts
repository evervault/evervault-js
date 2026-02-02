import { describe, it, expect } from "vitest";
import { validateCVC } from "../index";
import { CardCVCValidationResult } from "../types";

interface TestCase {
  scope: string;
  cardNumber: string;
  cvc: string;
  expectedResult: CardCVCValidationResult;
}

const testCases: TestCase[] = [
  {
    scope: "Invalid card number",
    cardNumber: "123",
    cvc: "123",
    expectedResult: { cvc: null, isValid: false, reason: "invalid_number" },
  },
  {
    scope: "Non digit CVC",
    cardNumber: "4242424242424242",
    cvc: "abc",
    expectedResult: { cvc: null, isValid: false, reason: "invalid_cvc" },
  },
  {
    scope: "CVC with spaces",
    cardNumber: "4242424242424242",
    cvc: "123  ",
    expectedResult: { cvc: null, isValid: false, reason: "invalid_cvc" },
  },
  {
    scope: "CVC with wrong length mastercard",
    cardNumber: "5555555555554444",
    cvc: "1234",
    expectedResult: { cvc: null, isValid: false, reason: "invalid_brand_cvc" },
  },
  {
    scope: "CVC with wrong length amex",
    cardNumber: "378282246310005",
    cvc: "12",
    expectedResult: { cvc: null, isValid: false, reason: "invalid_brand_cvc" },
  },
  {
    scope: "Valid CVC Mastercard",
    cardNumber: "5555555555554444",
    cvc: "123",
    expectedResult: { cvc: "123", isValid: true },
  },
  {
    scope: "Valid CVC Amex",
    cardNumber: "378282246310005",
    cvc: "1234",
    expectedResult: { cvc: "1234", isValid: true },
  },
  {
    scope: "3 digit CVC Amex",
    cardNumber: "378282246310005",
    cvc: "123",
    expectedResult: { cvc: "123", isValid: true },
  },
  {
    scope: "Valid CVC Mastercard with empty card number",
    cardNumber: "",
    cvc: "123",
    expectedResult: { cvc: "123", isValid: true },
  },
  {
    scope: "Valid CVC Amex with empty card number",
    cardNumber: "",
    cvc: "1234",
    expectedResult: { cvc: "1234", isValid: true },
  },
  {
    scope: "Valid CVC Mastercard with no card number",
    cardNumber: undefined as unknown as string,
    cvc: "123",
    expectedResult: { cvc: "123", isValid: true },
  },
  {
    scope: "Valid CVC Amex with no card number",
    cardNumber: undefined as unknown as string,
    cvc: "1234",
    expectedResult: { cvc: "1234", isValid: true },
  },
  {
    scope: "2 digit CVC",
    cardNumber: "",
    cvc: "12",
    expectedResult: { cvc: null, isValid: false, reason: "invalid_cvc" },
  },
  {
    scope: "5 digit CVC",
    cardNumber: "",
    cvc: "12345",
    expectedResult: { cvc: null, isValid: false, reason: "invalid_cvc" },
  },
];

describe("validateCvc function tests", () => {
  testCases.forEach(({ scope, cardNumber, cvc, expectedResult }) => {
    describe(`${scope}`, () => {
      it(`should validate the cvc`, () => {
        const result = validateCVC(cvc, cardNumber);
        expect(result).toEqual(expectedResult);
      });
    });
  });
});
