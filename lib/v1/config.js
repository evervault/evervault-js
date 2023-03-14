const KEYS_URL = "https://keys.evervault.com";
const INPUTS_URL = "https://inputs.evervault.com";

const DEFAULT_CONFIG_URLS = {
  keysUrl: KEYS_URL,
  inputsUrl: INPUTS_URL,
};

module.exports = (teamId, customUrls = DEFAULT_CONFIG_URLS, publicKey) => ({
  teamId,
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
    publicKey // optional: include the uncompressed public key to allow offline use of the SDK (no call to keys.evervault.com)
  },
  http: {
    keysUrl: customUrls.keysUrl || DEFAULT_CONFIG_URLS.keysUrl,
  },
  input: {
    inputsUrl: customUrls.inputsUrl || DEFAULT_CONFIG_URLS.inputsUrl,
    inputsOrigin: customUrls.inputsUrl || DEFAULT_CONFIG_URLS.inputsUrl,
  },
});
