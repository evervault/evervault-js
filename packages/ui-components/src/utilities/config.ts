type Environment = "staging" | "production";
const environment: Environment = import.meta.env.VITE_STAGING
  ? "staging"
  : "production";

const isProduction = environment === "production";

const googlePayEnvironment: google.payments.api.Environment = isProduction
  ? "PRODUCTION"
  : "TEST";

const apiUrl = isProduction
  ? "https://api.evervault.com"
  : import.meta.env.VITE_API_URL ?? "https://api.evervault.io";

const keysUrl = isProduction
  ? "https://keys.evervault.com"
  : import.meta.env.VITE_KEYS_URL ?? "https://keys.evervault.io";

const apiConfig = {
  environment,
  googlePayEnvironment,
  apiUrl,
  keysUrl,
} as const;

export { apiConfig };
