const KEYS_URL = "https://keys.evervault.com";

const DEFAULT_CONFIG_URLS = {
  keysUrl: KEYS_URL,
};

const MAX_FILE_SIZE_IN_MB = 25;

export default function Config(
  teamId,
  appId,
  customUrls = DEFAULT_CONFIG_URLS,
  publicKey
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
    debugKey: {
      ecdhP256KeyUncompressed:
        "BF1/Mo85D7t/XvC3I+YYpJvP+OsSyxIbSrhtDhg1SClQ2xdoyGpXYrplO/f8AZ+7cGkUnMF3tzSfLC5Io8BuNyw=",
      ecdhP256Key: "Al1/Mo85D7t/XvC3I+YYpJvP+OsSyxIbSrhtDhg1SClQ",
      isDebugMode: true,
    },
  };
}