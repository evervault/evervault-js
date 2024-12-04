import { describe, assert, it, beforeEach, expect } from "vitest";
import { validateExpiry } from "../index";
import { CardExpiryValidationResult } from "../types";

interface TestCase {
  scope: string;
  expiry: string;
  expectedResult: CardExpiryValidationResult;
}

const testCases: TestCase[] = [
  {
    scope: "Valid expiry",
    expiry: "1239",
    expectedResult: { month: "12", year: "39", isValid: true },
  },
  {
    scope: "Invalid month",
    expiry: "1319",
    expectedResult: { month: null, year: null, isValid: false },
  },
  {
    scope: "Invalid year",
    expiry: "122",
    expectedResult: { month: null, year: null, isValid: false },
  },
  {
    scope: "Previous year",
    expiry: "1220",
    expectedResult: { month: null, year: null, isValid: false },
  },
  {
    scope: "Invalid format",
    expiry: "12/20",
    expectedResult: { month: null, year: null, isValid: false },
  },
];

describe("validateExpiry function tests", () => {
  testCases.forEach(({ scope, expiry, expectedResult }) => {
    describe(`${scope}`, () => {
      it(`should validate the expiry`, () => {
        const result = validateExpiry(expiry);
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe("Expires at the end of the year", () => {
    it("should validate the expiry", () => {
      const currentYear = new Date().getFullYear();
      const lastTwoDigitsCurrentYear = currentYear.toString().slice(-2);
      const expiry = `12${lastTwoDigitsCurrentYear}`;
      const result = validateExpiry(expiry);
      expect(result).toEqual({
        month: "12",
        year: lastTwoDigitsCurrentYear,
        isValid: true,
      });
    });
  });

  describe("Expires at the beginning of next year", () => {
    it("should validate the expiry", () => {
      const nextYear = new Date().getFullYear() + 1;
      const lastTwoDigitsNextYear = nextYear.toString().slice(-2);
      const expiry = `01${lastTwoDigitsNextYear}`;
      const result = validateExpiry(expiry);
      expect(result).toEqual({
        month: "01",
        year: lastTwoDigitsNextYear,
        isValid: true,
      });
    });
  });

  describe("Expires this month", () => {
    it("should validate the expiry", () => {
      const currentYear = new Date().getFullYear();
      const lastTwoDigitsCurrentYear = currentYear.toString().slice(-2);
      const currentMonth = new Date().getMonth() + 1;
      const formattedExpiryMonth =
        currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
      const expiry = `${formattedExpiryMonth}${lastTwoDigitsCurrentYear}`;
      const result = validateExpiry(expiry);
      expect(result).toEqual({
        month: formattedExpiryMonth,
        year: lastTwoDigitsCurrentYear,
        isValid: true,
      });
    });
  });

  describe("Expires next month", () => {
    it("should validate the expiry", () => {
      let currentYear = new Date().getFullYear();
      let nextMonth = new Date().getMonth() + 2;

      if (nextMonth > 12) {
        nextMonth = nextMonth - 12;
        currentYear = currentYear + 1;
      }

      const lastTwoDigitsCurrentYear = currentYear.toString().slice(-2);
      const formattedExpiryMonth =
        nextMonth < 10 ? `0${nextMonth}` : `${nextMonth}`;
      const expiry = `${formattedExpiryMonth}${lastTwoDigitsCurrentYear}`;
      const result = validateExpiry(expiry);
      expect(result).toEqual({
        month: formattedExpiryMonth,
        year: lastTwoDigitsCurrentYear,
        isValid: true,
      });
    });
  });
});
