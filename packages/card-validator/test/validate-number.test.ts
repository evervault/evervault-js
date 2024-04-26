import { describe, assert, it, beforeEach, expect } from "vitest";
import { validateNumber } from "../index";
import { CardNumberValidationResult } from "../types";

interface TestCase {
  cardNumber: string;
  expectedResult: CardNumberValidationResult;
}

interface CardTestData {
  scope: string;
  testCases: TestCase[];
}

const testData: CardTestData[] = [
  {
    scope: "Visa cards",
    testCases: [
      {
        cardNumber: "4012888888881881",
        expectedResult: { brand: 'visa', localBrands: [], bin: '40128888', lastFour: '1881', isValid: true },
      },
      {
        cardNumber: "4012888888881881",
        expectedResult: { brand: 'visa', localBrands: [], bin: '40128888', lastFour: '1881', isValid: true },
      },
    ],
  },
  {
    scope: "Mastercard cards",
    testCases: [
      {
        cardNumber: "2",
        expectedResult: { brand: null, localBrands: [], bin: null, lastFour: null, isValid: false }
      },
      {
        cardNumber: "27",
        expectedResult: { brand: null, localBrands: [], bin: null, lastFour: null, isValid: false }
      },
      {
        cardNumber: "272",
        expectedResult: { brand: null, localBrands: [], bin: null, lastFour: null, isValid: false }
      },
      {
        cardNumber: "2720",
        expectedResult: { brand: 'mastercard', localBrands: [], bin: null, lastFour: null, isValid: false }
      },
      {
        cardNumber: "55555555",
        expectedResult: { brand: 'mastercard', localBrands: [], bin: null, lastFour: null, isValid: false }
      },
      {
        cardNumber: "5555555555554444",
        expectedResult: { brand: 'mastercard', localBrands: [], bin: '55555555', lastFour: '4444', isValid: true }
      },
      {
        cardNumber: "5555555555554446",
        expectedResult: { brand: 'mastercard', localBrands: [], bin: null, lastFour: null, isValid: false }
      },
    ]
  },

  {
    scope: "UnionPay cards",
    testCases: [
      {
        cardNumber: "6212345678901232",
        expectedResult: { brand: 'unionpay', localBrands: [], bin: '62123456', lastFour: '1232', isValid: true }
      },
      {
        cardNumber: "6212345678901233", // Luhn check failed
        expectedResult: { brand: 'unionpay', localBrands: [], bin: '62123456', lastFour: '1233', isValid: true }
      }
    ]
  },
  {
    scope: "Discover cards",
    testCases: [
      {
        cardNumber: "6011111",
        expectedResult: { brand: 'discover', localBrands: [], bin: null, lastFour: null, isValid: false }
      },
      {
        cardNumber: "6011111111111117",
        expectedResult: { brand: 'discover', localBrands: [], bin: '60111111', lastFour: '1117', isValid: true }
      }
    ]
  },
  {
    scope: "Szep cards",
    testCases: [
      {
        cardNumber: "3086782573431230",
        expectedResult: { brand: null, localBrands: ['szep'], bin: '30867825', lastFour: '1230', isValid: true }
      },
      {
        cardNumber: "308678257343", // 12 characters 
        expectedResult: { brand: null, localBrands: ['szep'], bin: null, lastFour: null, isValid: false }
      },
      {
        cardNumber: "3086782573431231", // Invalid luhn check 
        expectedResult: { brand: null, localBrands: ['szep'], bin: null, lastFour: null, isValid: false }
      },
      {
        cardNumber: "6101317017183727",
        expectedResult: { brand: 'maestro', localBrands: ['szep'], bin: '61013170', lastFour: '3727', isValid: true }
      },
      {
        cardNumber: "6101324281374396",
        expectedResult: { brand: 'maestro', localBrands: ['szep'], bin: '61013242', lastFour: '4396', isValid: true }
      },
      {
        cardNumber: "610131701712", // 12 characters
        expectedResult: { brand: 'maestro', localBrands: ['szep'], bin: null, lastFour: null, isValid: false }
      }
    ]
  }
];

describe('validateNumber function tests', () => {
  testData.forEach(({ scope, testCases }) => {
    describe(`${scope} tests`, () => {
      testCases.forEach(({ cardNumber, expectedResult }) => {
        it(`should correctly validate ${cardNumber}`, () => {
          const result = validateNumber(cardNumber);
          expect(result).toEqual(expectedResult);
        });
      });
    });
  });
});