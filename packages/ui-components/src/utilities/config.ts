import {
  buildTimeSdkConfig,
  parseSdkConfig,
  SDK_CONFIG_META_NAME,
  type SdkConfig,
} from "./sdkConfig";

type Environment = "staging" | "production";
const environment: Environment =
  import.meta.env.VITE_STAGING?.toLowerCase() === "true"
    ? "staging"
    : "production";

const defaults = buildTimeSdkConfig(import.meta.env);

function readSdkConfig(): SdkConfig {
  if (typeof document === "undefined") return defaults;
  const meta = document.querySelector(`meta[name="${SDK_CONFIG_META_NAME}"]`);
  return parseSdkConfig(meta?.getAttribute("content") ?? null, defaults);
}

const sdkConfig: SdkConfig = readSdkConfig();

const GOOGLE_PAY_MERCHANT_ID: string | undefined = import.meta.env
  .VITE_GOOGLE_PAY_MERCHANT_ID;

const apiConfig = {
  environment,
  apiUrl: sdkConfig.apiUrl,
  keysUrl: sdkConfig.keysUrl,
  googlePayMerchantId: GOOGLE_PAY_MERCHANT_ID,
} as const;

export { apiConfig, sdkConfig };
