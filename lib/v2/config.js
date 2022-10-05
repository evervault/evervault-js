const KEYS_URL = "https://keys.evervault.com";
const METRICS_URL = "https://metrics.evervault.com";
const INPUTS_ORIGIN = "https://inputs.evervault.com";
const INPUTS_URL = `${INPUTS_ORIGIN}/v2/index.html`;

const DEFAULT_CONFIG_URLS = {
  keysUrl: KEYS_URL,
  inputsUrl: INPUTS_URL,
  inputsOrigin: INPUTS_ORIGIN,
};

module.exports = (teamId, appId, customUrls = DEFAULT_CONFIG_URLS) => ({
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
  },
  http: {
    keysUrl: customUrls.keysUrl || DEFAULT_CONFIG_URLS.keysUrl,
    metricsUrl: METRICS_URL,
  },
  input: {
    inputsUrl: customUrls.inputsUrl || DEFAULT_CONFIG_URLS.inputsUrl,
    inputsOrigin: customUrls.inputsOrigin || DEFAULT_CONFIG_URLS.inputsOrigin,
  },
});
