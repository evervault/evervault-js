import { describe, assert, it, beforeEach, expect } from "vitest";
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
    expectedResult: { cvc: null, isValid: false },
  },
  {
    scope: "Non digit CVC",
    cardNumber: "4242424242424242",
    cvc: "abc",
    expectedResult: { cvc: null, isValid: false },
  },
  {
    scope: "CVC with spaces",
    cardNumber: "4242424242424242",
    cvc: "123  ",
    expectedResult: { cvc: null, isValid: false },
  },
  {
    scope: "CVC with wrong length mastercard",
    cardNumber: "5555555555554444",
    cvc: "1234",
    expectedResult: { cvc: null, isValid: false },
  },
  {
    scope: "CVC with wrong length amex",
    cardNumber: "378282246310005",
    cvc: "123",
    expectedResult: { cvc: null, isValid: false },
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
  }
];

describe('validateCvc function tests', () => {
  testCases.forEach(({ scope, cardNumber, cvc, expectedResult }) => {
    describe(`${scope}`, () => {
      it(`should validate the expiry`, () => {
        const result = validateCVC(cvc, cardNumber);
        expect(result).toEqual(expectedResult);
      });
    });
  });
});