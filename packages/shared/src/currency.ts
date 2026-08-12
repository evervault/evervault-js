const DEFAULT_CURRENCY_EXPONENT = 2;

/** Minor units per major unit as a power of ten, from the runtime's CLDR data. */
function currencyExponent(currency: string): number {
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
 * Format an amount given in a currency's minor units as the decimal string
 * wallet APIs expect: `(1000, "USD") -> "10.00"`, `(1000, "JPY") -> "1000"`,
 * `(1000, "KWD") -> "1.000"`.
 */
export function formatTransactionAmount(
  amount: number,
  currency: string
): string {
  const exponent = currencyExponent(currency);
  const digits = Math.round(Math.abs(amount))
    .toString()
    .padStart(exponent + 1, "0");
  const whole = digits.slice(0, digits.length - exponent);
  const fraction = digits.slice(digits.length - exponent);
  const sign = amount < 0 ? "-" : "";
  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`;
}
