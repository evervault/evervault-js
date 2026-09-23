import {
  buildTimeSdkConfig,
  resolveSdkConfig,
  type SdkConfig,
} from "./sdkConfig";

type Environment = "staging" | "production";
const environment: Environment =
  import.meta.env.VITE_STAGING?.toLowerCase() === "true"
    ? "staging"
    : "production";

const defaults = buildTimeSdkConfig(import.meta.env);

const sdkConfig: SdkConfig =
  typeof window === "undefined"
    ? defaults
    : resolveSdkConfig(window.location.origin, defaults);

const GOOGLE_PAY_MERCHANT_ID: string | undefined = import.meta.env
  .VITE_GOOGLE_PAY_MERCHANT_ID;

const apiConfig = {
  environment,
  apiUrl: sdkConfig.apiUrl,
  keysUrl: sdkConfig.keysUrl,
  googlePayMerchantId: GOOGLE_PAY_MERCHANT_ID,
} as const;

export { apiConfig, sdkConfig };
