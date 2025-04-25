import { type CardBrand } from "./types";

const brands = [
  {
    name: "visa",
    isLocal: false,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [4],
      lengths: [16, 18, 19],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "mastercard",
    isLocal: false,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [[51, 55], [2221, 2229], [223, 229], [23, 26], [270, 271], 2720],
      lengths: [16],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "american-express",
    isLocal: false,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [34, 37],
      lengths: [15],
    },
    securityCodeValidationRules: {
      lengths: [3, 4],
    },
  },
  {
    name: "diners-club",
    isLocal: false,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [[300, 305], 3095, 36, 38, 39],
      lengths: [14, 16, 19],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "discover",
    isLocal: false,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [6011, [644, 649], [650000, 651999], [653150, 659999], 622],
      lengths: [16, 19],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "jcb",
    isLocal: false,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [
        2131,
        1800,
        [3088, 3094],
        [3096, 3102],
        [3112, 3120],
        [3158, 3159],
        [3337, 3349],
        [3528, 3589],
      ],
      lengths: [16, 17, 18, 19],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "unionpay",
    isLocal: false,
    numberValidationRules: {
      luhnCheck: false,
      ranges: [
        620,
        [62100, 62182],
        [62184, 62187],
        [62185, 62197],
        [62200, 62205],
        [622010, 622999],
        622018,
        [62207, 62209],
        [623, 626],
        6270,
        6272,
        6276,
        [627700, 627779],
        [627781, 627799],
        [6282, 6289],
        6291,
        6292,
        810,
        [8110, 8131],
        [8132, 8151],
        [8152, 8163],
        [8164, 8171],
      ],
      lengths: [14, 15, 16, 17, 18, 19],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "maestro",
    isLocal: false,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [
        5018,
        5020,
        5038,
        5893,
        6101,
        6304,
        6759,
        6761,
        6762,
        6763,
        493698,
        [500000, 504174],
        [504176, 506698],
        [506779, 508999],
      ],
      lengths: [12, 13, 14, 15, 16, 17, 18, 19],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "elo",
    isLocal: true,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [
        401178,
        401179,
        438935,
        457631,
        457632,
        431274,
        451416,
        457393,
        504175,
        [506699, 506778],
        [509000, 509999],
        627780,
        636297,
        636368,
        [650031, 650033],
        [650035, 650051],
        [650405, 650439],
        [650485, 650538],
        [650541, 650598],
        [650700, 650718],
        [650720, 650727],
        [650901, 650978],
        [651652, 651679],
        [655000, 655019],
        [655021, 655058],
      ],
      lengths: [16],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "mir",
    isLocal: true,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [[2200, 2204]],
      lengths: [16, 17, 18, 19],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "hiper",
    isLocal: true,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [637095, 63737423, 63743358, 637568, 637599, 637609, 637612],
      lengths: [16],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "hipercard",
    isLocal: true,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [606282],
      lengths: [16],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "szep",
    isLocal: true,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [30867825, 61013170, 61013242],
      lengths: [16],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
  {
    name: "uatp",
    isLocal: false,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [1],
      lengths: [15],
    },
    securityCodeValidationRules: {
      lengths: [0],
    },
  },
  {
    name: "rupay",
    isLocal: false,
    numberValidationRules: {
      luhnCheck: true,
      ranges: [60, 81, 82, 508, [652100, 653149], [817200, 819899]],
      lengths: [16],
    },
    securityCodeValidationRules: {
      lengths: [3],
    },
  },
] as CardBrand[];

export default brands;
