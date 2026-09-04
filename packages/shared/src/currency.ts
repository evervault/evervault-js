const DEFAULT_CURRENCY_EXPONENT = 2;

/** Minor units per major unit as a power of ten, from the runtime's CLDR data. */
export function currencyExponent(currency: string): number {
  try {
    const { maximumFractionDigits } = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).resolvedOptions();
    return maximumFractionDigits ?? DEFAULT_CURRENCY_EXPONENT;
  } catch {
    return DEFAULT_CURRENCY_EXPONENT;
  }
}

/**
 * Render an integer amount with an explicit number of fraction digits, using
 * string arithmetic so the result is exact at any magnitude:
 * `(1000, 2) -> "10.00"`, `(1000, 0) -> "1000"`.
 */
export function formatMinorUnits(amount: number, exponent: number): string {
  const digits = Math.round(Math.abs(amount))
    .toString()
    .padStart(exponent + 1, "0");
  const whole = digits.slice(0, digits.length - exponent);
  const fraction = digits.slice(digits.length - exponent);
  const sign = amount < 0 ? "-" : "";
  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`;
}

/**
 * Format an amount given in a currency's minor units as the decimal string
 * wallet APIs expect: `(1000, "USD") -> "10.00"`, `(1000, "JPY") -> "1000"`,
 * `(1000, "KWD") -> "1.000"`.
 *
 * Renders the currency's full precision. Google Pay carries only two fraction
 * digits, so its caller reduces the precision itself rather than this doing it
 * for every wallet; Apple Pay takes three-decimal currencies as they are.
 */
export function formatTransactionAmount(
  amount: number,
  currency: string
): string {
  return formatMinorUnits(amount, currencyExponent(currency));
}
