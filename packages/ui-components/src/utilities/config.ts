type Environment = "staging" | "production";
const environment: Environment =
  import.meta.env.VITE_STAGING?.toLowerCase() === "true"
    ? "staging"
    : "production";

const isProduction = environment === "production";

const googlePayEnvironment: google.payments.api.Environment = isProduction
  ? "PRODUCTION"
  : "TEST";

const apiUrl: string = isProduction
  ? "https://api.evervault.com"
  : import.meta.env.VITE_API_URL ?? "https://api.evervault.io";

const keysUrl: string = isProduction
  ? "https://keys.evervault.com"
  : import.meta.env.VITE_KEYS_URL ?? "https://keys.evervault.io";

const GOOGLE_PAY_MERCHANT_ID: string | undefined = import.meta.env
  .VITE_GOOGLE_PAY_MERCHANT_ID;

const apiConfig = {
  environment,
  googlePayEnvironment,
  apiUrl,
  keysUrl,
  googlePayMerchantId: GOOGLE_PAY_MERCHANT_ID,
} as const;

export { apiConfig };
