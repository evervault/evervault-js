// A 3-digit security code on an Amex card, which `allow3DigitAmex` false refuses.
export function isRefusedAmexCvc(
  cvc: string,
  brand: string | null,
  allow3DigitAmex = true
) {
  return !allow3DigitAmex && cvc.length === 3 && brand === "american-express";
}
