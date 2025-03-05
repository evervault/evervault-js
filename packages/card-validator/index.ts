import { luhn10 } from "./lunh";
import type {
  CardCVCValidationResult,
  CardExpiryValidationResult,
  CardNumberValidationResult,
} from "./types";
import defaultBrands from "./brands";
import { type CardBrandName } from "types";

export * from "./types";

function matchesRange(cardNumber: string, min: number, max: number): boolean {
  const maxLengthToCheck = String(min).length;
  const substr = cardNumber.substring(0, maxLengthToCheck);
  const integerRepresentationOfCardNumber = parseInt(substr, 10);

  if (substr.length < maxLengthToCheck) {
    return false;
  }

  min = parseInt(String(min).substring(0, substr.length), 10);
  max = parseInt(String(max).substring(0, substr.length), 10);

  return (
    integerRepresentationOfCardNumber >= min &&
    integerRepresentationOfCardNumber <= max
  );
}

function matchesPrefix(cardNumber: string, prefix: number): boolean {
  return cardNumber.startsWith(String(prefix));
}

function getBin(cardNumber: string): string {
  if (cardNumber.length < 16) {
    return cardNumber.substring(0, 6);
  } else {
    return cardNumber.substring(0, 8);
  }
}

export function validateNumber(cardNumber: string): CardNumberValidationResult {
  // Remove all spaces from the card number
  const sanitizedCardNumber = String(cardNumber).replace(/\s/g, "");

  // Check if the card number only contains numbers
  if (!/^\d*$/.test(sanitizedCardNumber)) {
    return {
      brand: null,
      localBrands: [],
      bin: null,
      lastFour: null,
      isValid: false,
    };
  }

  // Filter out brands where the card number does not match any of the ranges
  const cardBrands = defaultBrands.filter((brand) => {
    return brand.numberValidationRules.ranges.some((range) => {
      if (Array.isArray(range)) {
        if (range[0] && range[1]) {
          return matchesRange(sanitizedCardNumber, range[0], range[1]);
        }
      } else {
        return matchesPrefix(sanitizedCardNumber, range);
      }

      return false;
    });
  });

  const globalBrands = cardBrands.filter((brand) => !brand.isLocal);
  const localBrands = cardBrands.filter((brand) => brand.isLocal);

  // Check if the card number is valid based on:
  // 1. The card number belongs to at least one card brand range
  // 2. The length of the card number is supported, based on all supported card brands
  // 3. The Luhn check passes, based on all supported card brands
  const isValid =
    cardBrands.length > 0 &&
    cardBrands.every((creditCardBrand) => {
      const { lengths, luhnCheck } = creditCardBrand.numberValidationRules;

      // Check if the length of the sanitized card number is supported
      const isLengthValid = lengths.includes(sanitizedCardNumber.length);

      // If a Luhn check is required, perform the check
      // Otherwise, if no Luhn check is required, consider it valid
      const isLuhnValid = !luhnCheck || luhn10(sanitizedCardNumber);

      // Return true if both length and Luhn check conditions are met
      return isLengthValid && isLuhnValid;
    });

  return {
    brand: globalBrands.length > 0 ? globalBrands[0].name : null,
    localBrands: localBrands.map((brand) => brand.name),
    bin: isValid ? getBin(cardNumber) : null,
    lastFour: isValid
      ? sanitizedCardNumber.substring(sanitizedCardNumber.length - 4)
      : null,
    isValid: isValid,
  };
}

export function validateCVC(
  cvc: string,
  cardNumber?: string
): CardCVCValidationResult {
  // Check if the CVC only contains numbers with 3 or 4 digits
  if (!/^\d{3,4}$/.test(cvc)) {
    return {
      cvc: null,
      isValid: false,
    };
  }

  if (!cardNumber) {
    return {
      cvc: cvc,
      isValid: true,
    };
  }

  const validatedCard = validateNumber(cardNumber);
  if (!validatedCard.isValid) {
    return {
      cvc: null,
      isValid: false,
    };
  }

  const brands: CardBrandName[] = [];
  if (validatedCard.brand) {
    brands.push(validatedCard.brand);
  }
  if (validatedCard.localBrands) {
    brands.push(...validatedCard.localBrands);
  }

  const isCVCValid = defaultBrands
    .filter((brand) => brands.includes(brand.name))
    .some((brand) => {
      return brand.securityCodeValidationRules.lengths.includes(cvc.length);
    });

  return {
    cvc: isCVCValid ? cvc : null,
    isValid: isCVCValid,
  };
}

export function validateExpiry(expiry: string): CardExpiryValidationResult {
  const month_regex = /^(0[1-9]|1[[0-2]).*$/;
  const month_match = expiry.match(month_regex);
  const month = month_match ? parseInt(month_match[1].toString(), 10) : null;

  const year_regex = /^(0[1-9]|1[[0-2])(\d{2})$/;
  const year_match = expiry.match(year_regex);
  const year = year_match ? parseInt(year_match[2].toString(), 10) : null;

  if (month) {
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    const invalid =
      !year ||
      year < currentYear ||
      (year === currentYear && month < currentMonth);

    return {
      month: month.toString().padStart(2, "0"),
      year: year?.toString()?.padStart(2, "0") ?? null,
      isValid: !invalid,
    };
  }

  return {
    month: null,
    year: null,
    isValid: false,
  };
}
