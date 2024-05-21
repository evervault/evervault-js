import { luhn10 } from "./lunh";
import { CardCVCValidationResult, CardExpiryValidationResult, CardNumberValidationResult } from "./types";
import defaultBrands from "./brands";
import { CardBrandName } from "types";

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
    }
  }

  // Filter out brands where the card number does not match any of the ranges
  const cardBrands = defaultBrands.filter(brand => {
    return brand.numberValidationRules.ranges.some(range => {
      if (Array.isArray(range)) {
        return matchesRange(sanitizedCardNumber, range[0], range[1]);
      }

      return matchesPrefix(sanitizedCardNumber, range);
    });
  });

  const globalBrands = cardBrands.filter(brand => !brand.isLocal);
  const localBrands = cardBrands.filter(brand => brand.isLocal);

  // Check if the card number is valid based on:
  // 1. The card number belongs to at least one card brand range
  // 2. The length of the card number is supported, based on all supported card brands
  // 3. The Luhn check passes, based on all supported card brands
  let isValid = cardBrands.length > 0 && cardBrands.every(creditCardBrand => {
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
    localBrands: localBrands.map(brand => brand.name),
    bin: isValid ? getBin(cardNumber) : null,
    lastFour: isValid ? sanitizedCardNumber.substring(sanitizedCardNumber.length - 4) : null,
    isValid: isValid
  }
}

export function validateCVC(cvc: string, cardNumber: string): CardCVCValidationResult {
  const validatedCard = validateNumber(cardNumber);
  if (!validatedCard.isValid) {
    return {
      cvc: null,
      isValid: false
    };
  }

  // Check if the CVC only contains numbers
  if (!/^\d*$/.test(cvc)) {
    return {
      cvc: null,
      isValid: false
    }
  }

  let brands: CardBrandName[] = [];
  if (validatedCard.brand) {
    brands.push(validatedCard.brand);
  }
  if (validatedCard.localBrands) {
    brands.push(...validatedCard.localBrands);
  }

  const isCVCValid = defaultBrands.filter(brand => brands.includes(brand.name)).some(brand => {
    return brand.securityCodeValidationRules.length === cvc.length;
  });

  return {
    cvc: isCVCValid ? cvc : null,
    isValid: isCVCValid
  };
}

export function validateExpiry(expiry: string): CardExpiryValidationResult {
  // Validate that the expiry is in the format MMYY
  const regex = /^(0[1-9]|1[0-2])(\d{2})$/;
  const match = expiry.match(regex);

  if (match) {
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);

    const currentYear = (new Date().getFullYear()) % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return {
        month: null,
        year: null,
        isValid: false
      };
    }

    return {
      month: match[1],
      year: match[2],
      isValid: true
    };
  }

  return {
    month: null,
    year: null,
    isValid: false
  };
}
