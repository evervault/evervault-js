import { describe, it, expect } from "vitest";
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
        cardNumber: "4",
        expectedResult: {
          brand: "visa",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "411",
        expectedResult: {
          brand: "visa",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "4111111111111111",
        expectedResult: {
          brand: "visa",
          localBrands: [],
          bin: "41111111",
          lastFour: "1111",
          isValid: true,
        },
      },
      {
        cardNumber: "4012888888881881",
        expectedResult: {
          brand: "visa",
          localBrands: [],
          bin: "40128888",
          lastFour: "1881",
          isValid: true,
        },
      },
      {
        cardNumber: "4222222222222",
        expectedResult: {
          brand: "visa",
          localBrands: [],
          bin: "422222",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "4462030000000000",
        expectedResult: {
          brand: "visa",
          localBrands: [],
          bin: "44620300",
          lastFour: "0000",
          isValid: true,
        },
      },
      {
        cardNumber: "44620300000000002", // 17-digit card number
        expectedResult: {
          brand: "visa",
          localBrands: [],
          bin: "44620300",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "446203000000000026",
        expectedResult: {
          brand: "visa",
          localBrands: [],
          bin: "44620300",
          lastFour: "0026",
          isValid: true,
        },
      },
      {
        cardNumber: "4462030000000000267",
        expectedResult: {
          brand: "visa",
          localBrands: [],
          bin: "44620300",
          lastFour: "0267",
          isValid: true,
        },
      },
      {
        cardNumber: "4462030000000000266", // Invalid luhn check
        expectedResult: {
          brand: "visa",
          localBrands: [],
          bin: "44620300",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "44620300000000002675", // 20-digit card number
        expectedResult: {
          brand: "visa",
          localBrands: [],
          bin: "44620300",
          lastFour: null,
          isValid: false,
        },
      },
    ],
  },
  {
    scope: "Mastercard cards",
    testCases: [
      {
        cardNumber: "2",
        expectedResult: {
          brand: null,
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "27",
        expectedResult: {
          brand: null,
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "272",
        expectedResult: {
          brand: null,
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "2720",
        expectedResult: {
          brand: "mastercard",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "55555555",
        expectedResult: {
          brand: "mastercard",
          localBrands: [],
          bin: "555555",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "5555555555554444",
        expectedResult: {
          brand: "mastercard",
          localBrands: [],
          bin: "55555555",
          lastFour: "4444",
          isValid: true,
        },
      },
      {
        cardNumber: "5555555555554446",
        expectedResult: {
          brand: "mastercard",
          localBrands: [],
          bin: "55555555",
          lastFour: null,
          isValid: false,
        },
      },
    ],
  },
  {
    scope: "American Express cards",
    testCases: [
      {
        cardNumber: "34",
        expectedResult: {
          brand: "american-express",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "37",
        expectedResult: {
          brand: "american-express",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "341",
        expectedResult: {
          brand: "american-express",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "34343434343434", // too short
        expectedResult: {
          brand: "american-express",
          localBrands: [],
          bin: "343434",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "343434343434344", // invalid luhn check
        expectedResult: {
          brand: "american-express",
          localBrands: [],
          bin: "343434",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "343434343434343",
        expectedResult: {
          brand: "american-express",
          localBrands: [],
          bin: "343434",
          lastFour: "4343",
          isValid: true,
        },
      },
      {
        cardNumber: "378282246310005",
        expectedResult: {
          brand: "american-express",
          localBrands: [],
          bin: "378282",
          lastFour: "0005",
          isValid: true,
        },
      },
      {
        cardNumber: "371449635398431",
        expectedResult: {
          brand: "american-express",
          localBrands: [],
          bin: "371449",
          lastFour: "8431",
          isValid: true,
        },
      },
      {
        cardNumber: "378734493671000",
        expectedResult: {
          brand: "american-express",
          localBrands: [],
          bin: "378734",
          lastFour: "1000",
          isValid: true,
        },
      },
    ],
  },
  {
    scope: "Diners Club cards",
    testCases: [
      {
        cardNumber: "30",
        expectedResult: {
          brand: null,
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "300",
        expectedResult: {
          brand: "diners-club",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "36",
        expectedResult: {
          brand: "diners-club",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "38",
        expectedResult: {
          brand: "diners-club",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "39",
        expectedResult: {
          brand: "diners-club",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "30569309025904",
        expectedResult: {
          brand: "diners-club",
          localBrands: [],
          bin: "305693",
          lastFour: "5904",
          isValid: true,
        },
      },
      {
        cardNumber: "38520000023237",
        expectedResult: {
          brand: "diners-club",
          localBrands: [],
          bin: "385200",
          lastFour: "3237",
          isValid: true,
        },
      },
      {
        cardNumber: "36700102000000",
        expectedResult: {
          brand: "diners-club",
          localBrands: [],
          bin: "367001",
          lastFour: "0000",
          isValid: true,
        },
      },
      {
        cardNumber: "36148900647913",
        expectedResult: {
          brand: "diners-club",
          localBrands: [],
          bin: "361489",
          lastFour: "7913",
          isValid: true,
        },
      },
      {
        cardNumber: "36148900647914",
        expectedResult: {
          brand: "diners-club",
          localBrands: [],
          bin: "361489",
          lastFour: null,
          isValid: false,
        },
      },
    ],
  },
  {
    scope: "UnionPay cards",
    testCases: [
      {
        cardNumber: "6212345678901232",
        expectedResult: {
          brand: "unionpay",
          localBrands: [],
          bin: "62123456",
          lastFour: "1232",
          isValid: true,
        },
      },
      {
        cardNumber: "6212345678901233", // Luhn check failed
        expectedResult: {
          brand: "unionpay",
          localBrands: [],
          bin: "62123456",
          lastFour: "1233",
          isValid: true,
        },
      },
    ],
  },
  {
    scope: "Discover cards",
    testCases: [
      {
        cardNumber: "6011",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "644",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "645",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "646",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "647",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "648",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "649",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "6011111",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: "601111",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "6011111111111117",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: "60111111",
          lastFour: "1117",
          isValid: true,
        },
      },
      {
        cardNumber: "6011000400000000",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: "60110004",
          lastFour: "0000",
          isValid: true,
        },
      },
      {
        cardNumber: "6011111111111117",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: "60111111",
          lastFour: "1117",
          isValid: true,
        },
      },
      {
        cardNumber: "6011000990139424",
        expectedResult: {
          brand: "discover",
          localBrands: [],
          bin: "60110009",
          lastFour: "9424",
          isValid: true,
        },
      },
    ],
  },
  {
    scope: "JCB cards",
    testCases: [
      {
        cardNumber: "0",
        expectedResult: {
          brand: null,
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "35",
        expectedResult: {
          brand: null,
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "3528",
        expectedResult: {
          brand: "jcb",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "2131",
        expectedResult: {
          brand: "jcb",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "21312",
        expectedResult: {
          brand: "jcb",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "1800",
        expectedResult: {
          brand: "jcb",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "18002",
        expectedResult: {
          brand: "jcb",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "3530111333300000",
        expectedResult: {
          brand: "jcb",
          localBrands: [],
          bin: "35301113",
          lastFour: "0000",
          isValid: true,
        },
      },
      {
        cardNumber: "3566002020360505",
        expectedResult: {
          brand: "jcb",
          localBrands: [],
          bin: "35660020",
          lastFour: "0505",
          isValid: true,
        },
      },
      {
        cardNumber: "35308796121637357",
        expectedResult: {
          brand: "jcb",
          localBrands: [],
          bin: "35308796",
          lastFour: "7357",
          isValid: true,
        },
      },
      {
        cardNumber: "353445444300732639",
        expectedResult: {
          brand: "jcb",
          localBrands: [],
          bin: "35344544",
          lastFour: "2639",
          isValid: true,
        },
      },
      {
        cardNumber: "3537286818376838569",
        expectedResult: {
          brand: "jcb",
          localBrands: [],
          bin: "35372868",
          lastFour: "8569",
          isValid: true,
        },
      },
    ],
  },
  {
    scope: "Szep cards",
    testCases: [
      {
        cardNumber: "3086782573431230",
        expectedResult: {
          brand: null,
          localBrands: ["szep"],
          bin: "30867825",
          lastFour: "1230",
          isValid: true,
        },
      },
      {
        cardNumber: "308678257343", // 12 characters
        expectedResult: {
          brand: null,
          localBrands: ["szep"],
          bin: "308678",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "3086782573431231", // Invalid luhn check
        expectedResult: {
          brand: null,
          localBrands: ["szep"],
          bin: "30867825",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "6101317017183727",
        expectedResult: {
          brand: "maestro",
          localBrands: ["szep"],
          bin: "61013170",
          lastFour: "3727",
          isValid: true,
        },
      },
      {
        cardNumber: "6101324281374396",
        expectedResult: {
          brand: "maestro",
          localBrands: ["szep"],
          bin: "61013242",
          lastFour: "4396",
          isValid: true,
        },
      },
      {
        cardNumber: "610131701712", // 12 characters
        expectedResult: {
          brand: "maestro",
          localBrands: ["szep"],
          bin: "610131",
          lastFour: null,
          isValid: false,
        },
      },
    ],
  },
  {
    scope: "Elo cards",
    testCases: [
      {
        cardNumber: "431274",
        expectedResult: {
          brand: "visa",
          localBrands: ["elo"],
          bin: "431274",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "451416",
        expectedResult: {
          brand: "visa",
          localBrands: ["elo"],
          bin: "451416",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "457393",
        expectedResult: {
          brand: "visa",
          localBrands: ["elo"],
          bin: "457393",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "401178",
        expectedResult: {
          brand: "visa",
          localBrands: ["elo"],
          bin: "401178",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "401179",
        expectedResult: {
          brand: "visa",
          localBrands: ["elo"],
          bin: "401179",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "438935",
        expectedResult: {
          brand: "visa",
          localBrands: ["elo"],
          bin: "438935",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "457631",
        expectedResult: {
          brand: "visa",
          localBrands: ["elo"],
          bin: "457631",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "457632",
        expectedResult: {
          brand: "visa",
          localBrands: ["elo"],
          bin: "457632",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "4576321111111111", // Invalid lunh check
        expectedResult: {
          brand: "visa",
          localBrands: ["elo"],
          bin: "45763211",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "4576321111111114",
        expectedResult: {
          brand: "visa",
          localBrands: ["elo"],
          bin: "45763211",
          lastFour: "1114",
          isValid: true,
        },
      },
      {
        cardNumber: "5066991111111118",
        expectedResult: {
          brand: null,
          localBrands: ["elo"],
          bin: "50669911",
          lastFour: "1118",
          isValid: true,
        },
      },
      {
        cardNumber: "504175",
        expectedResult: {
          brand: null,
          localBrands: ["elo"],
          bin: "504175",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "6277809",
        expectedResult: {
          brand: null,
          localBrands: ["elo"],
          bin: "627780",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "6277809990229178",
        expectedResult: {
          brand: null,
          localBrands: ["elo"],
          bin: "62778099",
          lastFour: "9178",
          isValid: true,
        },
      },
      {
        cardNumber: "650033",
        expectedResult: {
          brand: "discover",
          localBrands: ["elo"],
          bin: "650033",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "6500331111111111", // Invalid lunh check
        expectedResult: {
          brand: "discover",
          localBrands: ["elo"],
          bin: "65003311",
          lastFour: null,
          isValid: false,
        },
      },
    ],
  },
  {
    scope: "UATP cards",
    testCases: [
      {
        cardNumber: "1",
        expectedResult: {
          brand: "uatp",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "101",
        expectedResult: {
          brand: "uatp",
          localBrands: [],
          bin: null,
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "135410014004955",
        expectedResult: {
          brand: "uatp",
          localBrands: [],
          bin: "135410",
          lastFour: "4955",
          isValid: true,
        },
      },
      {
        cardNumber: "123456789012345", // 15 digits, invalid
        expectedResult: {
          brand: "uatp",
          localBrands: [],
          bin: "123456",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "12345678901234567", // 17 digits, invalid
        expectedResult: {
          brand: "uatp",
          localBrands: [],
          bin: "12345678",
          lastFour: null,
          isValid: false,
        },
      },
      {
        cardNumber: "1234567890123458", // Invalid Luhn check
        expectedResult: {
          brand: "uatp",
          localBrands: [],
          bin: "12345678",
          lastFour: null,
          isValid: false,
        },
      },
    ],
  },
  {
    scope: "Rupay cards",
    testCases: [
      {
        cardNumber: "6047315126933708",
        expectedResult: {
          brand: "rupay",
          localBrands: [],
          bin: "60473151",
          lastFour: "3708",
          isValid: true,
        },
      },
      {
        cardNumber: "6521089478322290",
        expectedResult: {
          brand: "rupay",
          localBrands: [],
          bin: "65210894",
          lastFour: "2290",
          isValid: true,
        },
      },
      {
        cardNumber: "6069850000000006", // Invalid Luhn check
        expectedResult: {
          brand: "rupay",
          localBrands: [],
          bin: "60698500",
          lastFour: null,
          isValid: false,
        },
      },
    ],
  },
];

describe("validateNumber function tests", () => {
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
