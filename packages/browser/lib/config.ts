const KEYS_URL = "https://keys.evervault.com";
const INPUTS_ORIGIN = "https://inputs.evervault.com";
const INPUTS_URL = `${INPUTS_ORIGIN}/v2/index.html`;

export type ConfigUrls = {
  keysUrl?: string;
  inputsUrl?: string;
  inputsOrigin?: string;
};

export type EncryptionSubConfig = typeof encryptionConstants & { publicKey?: string };

export type HttpConfig = {
  keysUrl: string;
};

export type InputConfig = {
  inputsUrl: string;
  inputsOrigin: string;
};

export type KeyConfig = {
  ecdhP256KeyUncompressed: string;
  ecdhP256Key: string;
  isDebugMode: boolean;
};

export type Config = {
  teamId: string;
  appId: string;
  encryption: EncryptionSubConfig;
  http: HttpConfig;
  input: InputConfig;
  debugKey: typeof debugKey;
};

const DEFAULT_CONFIG_URLS = {
  keysUrl: KEYS_URL,
  inputsUrl: INPUTS_URL,
  inputsOrigin: INPUTS_ORIGIN,
} satisfies ConfigUrls;

const MAX_FILE_SIZE_IN_MB = 25 as const;

const encryptionConstants = {
  cipherAlgorithm: "aes-256-gcm" as const,
  keyLength: 32 as const, // bytes
  ivLength: 12 as const, // bytes
  authTagLength: 128 as const, // bits
  publicHash: "sha256" as const,
  evVersion: "NOC" as const, // (Tk9D) NIST-P256 KDF
  header: {
    iss: "evervault" as const,
    version: 1 as const,
  },
  maxFileSizeInMB: MAX_FILE_SIZE_IN_MB,
  maxFileSizeInBytes: MAX_FILE_SIZE_IN_MB * 1024 * 1024,
};

const createEncryptionConfig = (publicKey?: string) => ({
  ...encryptionConstants,
  publicKey,
} satisfies EncryptionSubConfig);

const debugKey = {
  ecdhP256KeyUncompressed:
    "BF1/Mo85D7t/XvC3I+YYpJvP+OsSyxIbSrhtDhg1SClQ2xdoyGpXYrplO/f8AZ+7cGkUnMF3tzSfLC5Io8BuNyw=" as const,
  ecdhP256Key: "Al1/Mo85D7t/XvC3I+YYpJvP+OsSyxIbSrhtDhg1SClQ" as const,
  isDebugMode: true,
} as const satisfies KeyConfig;

export default function Config(
  teamId: string,
  appId: string,
  customUrls?: ConfigUrls,
  publicKey?: string
): Config {
  return {
    teamId,
    appId,
    encryption: createEncryptionConfig(publicKey),
    http: {
      keysUrl: customUrls?.keysUrl || DEFAULT_CONFIG_URLS.keysUrl,
    },
    input: {
      inputsUrl: customUrls?.inputsUrl || DEFAULT_CONFIG_URLS.inputsUrl,
      inputsOrigin: customUrls?.inputsOrigin || DEFAULT_CONFIG_URLS.inputsOrigin,
    },
    debugKey,
  };
}
