const KEYS_URL = "https://keys.evervault.com";
const INPUTS_ORIGIN = "https://inputs.evervault.com";
const INPUTS_URL = `${INPUTS_ORIGIN}/v2/index.html`;

const DEFAULT_CONFIG_URLS = {
  keysUrl: KEYS_URL,
  inputsUrl: INPUTS_URL,
  inputsOrigin: INPUTS_ORIGIN,
};

const MAX_FILE_SIZE_IN_MB = 25;

export default function Config(
  teamId: string,
  appId: string,
  customUrls = DEFAULT_CONFIG_URLS,
  publicKey: string
) {
  return {
    teamId,
    appId,
    encryption: {
      cipherAlgorithm: "aes-256-gcm",
      keyLength: 32, // bytes
      ivLength: 12, // bytes
      authTagLength: 128, // bits
      publicHash: "sha256",
      evVersion: "NOC", // (Tk9D) NIST-P256 KDF
      header: {
        iss: "evervault",
        version: 1,
      },
      publicKey, // optional: include the uncompressed public key to allow offline use of the SDK (no call to keys.evervault.com)
      maxFileSizeInMB: MAX_FILE_SIZE_IN_MB,
      maxFileSizeInBytes: MAX_FILE_SIZE_IN_MB * 1024 * 1024,
    },
    http: {
      keysUrl: customUrls.keysUrl || DEFAULT_CONFIG_URLS.keysUrl,
    },
    input: {
      inputsUrl: customUrls.inputsUrl || DEFAULT_CONFIG_URLS.inputsUrl,
      inputsOrigin: customUrls.inputsOrigin || DEFAULT_CONFIG_URLS.inputsOrigin,
    },
    debugKey: {
      ecdhP256KeyUncompressed:
        "BF1/Mo85D7t/XvC3I+YYpJvP+OsSyxIbSrhtDhg1SClQ2xdoyGpXYrplO/f8AZ+7cGkUnMF3tzSfLC5Io8BuNyw=",
      ecdhP256Key: "Al1/Mo85D7t/XvC3I+YYpJvP+OsSyxIbSrhtDhg1SClQ",
      isDebugMode: true,
    },
  };
}
