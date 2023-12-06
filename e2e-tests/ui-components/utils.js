import * as crypto from "crypto";
import { test as baseTest } from "@playwright/test";
import { expect as baseExpect } from "@playwright/test";

const EV_STRING_REGEX =
  /((ev(:|%3A))(debug(:|%3A))?(([A-z0-9+/=%]+)(:|%3A))?((number|boolean|string)(:|%3A))?(([A-z0-9+/=%]+)(:|%3A)){3}(\$|%24))|(((eyJ[A-z0-9+=.]+){2})([\w]{8}(-[\w]{4}){3}-[\w]{12}))/;

export const expect = baseExpect.extend({
  toBeEncrypted(locator) {
    let pass = false;

    try {
      baseExpect(locator).toMatch(EV_STRING_REGEX);
      pass = true;
    } catch (e) {
      pass = false;
    }

    return {
      pass,
      name: "toBeEncrypted",
      message: () => `expected ${locator} to be encrypted`,
    };
  },
});

export function generateUUID() {
  return crypto.randomBytes(16).toString("hex");
}

export const test = baseTest.extend({});

export const VALID_CARDS = {
  visa: {
    number: "4242424242424242",
    month: "01",
    year: "35",
    cvc: "123",
    brand: "visa",
    last4: "4242",
    bin: "42424242",
  },
  mastercard: {
    number: "5555555555554444",
    month: "01",
    year: "35",
    cvc: "123",
    brand: "mastercard",
    last4: "4444",
    bin: "55555555",
  },
  amex: {
    number: "378282246310005",
    month: "01",
    year: "35",
    cvc: "1234",
    brand: "american-express",
    last4: "0005",
    bin: "37828224",
  },
  discover: {
    number: "6011111111111117",
    month: "01",
    year: "35",
    cvc: "123",
    brand: "discover",
    last4: "1117",
    bin: "60111111",
  },
  diners: {
    number: "30569309025904",
    month: "01",
    year: "35",
    cvc: "123",
    brand: "diners-club",
    last4: "5904",
    bin: "30569309",
  },
  jcb: {
    number: "3530111333300000",
    month: "01",
    year: "35",
    cvc: "123",
    brand: "jcb",
    last4: "0000",
    bin: "35301113",
  },
  unionpay: {
    number: "6200000000000005",
    month: "01",
    year: "35",
    cvc: "123",
    brand: "unionpay",
    last4: "0005",
    bin: "62000000",
  },
  maestro: {
    number: "6759649826438453",
    month: "01",
    year: "35",
    cvc: "123",
    brand: "maestro",
    last4: "8453",
    bin: "67596498",
  },
};

export const INVALID_CARDS = {
  invalidNumber: {
    number: "4242424242424241",
    month: "01",
    year: "35",
    cvc: "123",
    brand: "visa",
    last4: "4241",
    bin: "42424242",
  },
  invalidExpiry: {
    number: "4242424242424242",
    month: "01",
    year: "20",
    cvc: "123",
    brand: "visa",
    last4: "4242",
    bin: "42424242",
  },
  invalidCVC: {
    number: "4242424242424242",
    month: "01",
    year: "35",
    cvc: "12",
    brand: "visa",
    last4: "4242",
    bin: "42424242",
  },
};
