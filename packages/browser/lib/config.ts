const KEYS_URL = "https://keys.evervault.com";
const INPUTS_ORIGIN = "https://inputs.evervault.com";
const API_URL = "https://api.evervault.com";
const UI_COMPONENTS_URL = "https://ui-components.evervault.com";

export interface ConfigUrls {
  keysUrl?: string;
  inputsUrl?: string;
  inputsOrigin?: string;
  apiUrl?: string;
  componentsUrl?: string;
}

export interface HttpConfig {
  keysUrl: string;
  apiUrl: string;
}

export interface InputConfig {
  inputsOrigin: string;
}

export interface ComponentsConfig {
  url: string;
}

export interface KeyConfig {
  ecdhP256KeyUncompressed: string;
  ecdhP256Key: string;
  isDebugMode: boolean;
}

export type SdkContext = "inputs" | "default";

const DEFAULT_CONFIG_URLS = {
  keysUrl: KEYS_URL,
  apiUrl: API_URL,
  inputsOrigin: INPUTS_ORIGIN,
  componentsUrl: UI_COMPONENTS_URL,
} satisfies ConfigUrls;

const MAX_FILE_SIZE_IN_MB = 25 as const;

const encryptionConstants = {
  cipherAlgorithm: "aes-256-gcm" as const,
  keyLength: 32 as const, // bytes
  ivLength: 12 as const, // bytes
  authTagLength: 128 as const, // bits
  publicHash: "sha256" as const,
  versions: {
    NOC: "NOC" as const, // (Tk9D) NIST-P256 KDF
    BFS: "QkTC" as const, // (TENZ) NIST-P256 KDF with metadata
  },
  header: {
    iss: "evervault" as const,
    version: 1 as const,
  },
  maxFileSizeInMB: MAX_FILE_SIZE_IN_MB,
  maxFileSizeInBytes: MAX_FILE_SIZE_IN_MB * 1024 * 1024,
};

export type EncryptionSubConfig = typeof encryptionConstants & {
  publicKey?: string;
};

const createEncryptionConfig = (publicKey?: string) =>
  ({
    ...encryptionConstants,
    publicKey,
  } satisfies EncryptionSubConfig);

const debugKey = {
  ecdhP256KeyUncompressed:
    "BF1/Mo85D7t/XvC3I+YYpJvP+OsSyxIbSrhtDhg1SClQ2xdoyGpXYrplO/f8AZ+7cGkUnMF3tzSfLC5Io8BuNyw=" as const,
  ecdhP256Key: "Al1/Mo85D7t/XvC3I+YYpJvP+OsSyxIbSrhtDhg1SClQ" as const,
  isDebugMode: true,
} as const satisfies KeyConfig;

export interface Config {
  teamId: string;
  appId: string;
  encryption: EncryptionSubConfig;
  http: HttpConfig;
  input: InputConfig;
  components: ComponentsConfig;
  debugKey: typeof debugKey;
  isSandbox?: boolean;
}

export default function Config(
  teamId: string,
  appId: string,
  customUrls?: ConfigUrls,
  publicKey?: string,
  isSandbox?: boolean
): Config {
  return {
    teamId,
    appId,
    encryption: createEncryptionConfig(publicKey),
    http: {
      keysUrl: validateSet(customUrls?.keysUrl, DEFAULT_CONFIG_URLS.keysUrl),
      apiUrl: validateSet(customUrls?.apiUrl, API_URL),
    },
    components: {
      url: validateSet(
        customUrls?.componentsUrl,
        DEFAULT_CONFIG_URLS.componentsUrl
      ),
    },
    input: {
      inputsOrigin: validateSet(
        customUrls?.inputsOrigin,
        DEFAULT_CONFIG_URLS.inputsOrigin
      ),
    },
    debugKey,
    isSandbox
  };
}

// Ensure that the value is a string and is not empty. If the value is not then return the default value
function validateSet(
  value: string | undefined | null | String, // eslint-disable-line @typescript-eslint/no-wrapper-object-types
  defaultValue: string
): string {
  if (
    typeof value === "undefined" ||
    value === null ||
    (typeof value !== "string" && !(value instanceof String)) ||
    value.length === 0
  ) {
    return defaultValue;
  }
  if (value instanceof String) {
    return value.toString();
  }

  return value;
}
