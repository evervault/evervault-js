const KEYS_URL = 'https://keys.evervault.com';
const METRICS_URL = 'https://metrics.evervault.com';

const DEFAULT_CONFIG_URLS = {
  keysUrl: KEYS_URL
};

module.exports = (teamId, customUrls = DEFAULT_CONFIG_URLS) => ({
  teamId,
  encryption: {
    cipherAlgorithm: 'aes-256-gcm',
    keyLength: 32, // bytes
    authTagLength: 128, // bits
    publicHash: 'sha256',
    header: {
      iss: 'evervault',
      version: 1,
    },
  },
  http: {
    keysUrl: customUrls.keysUrl || DEFAULT_CONFIG_URLS.keysUrl,
    metricsUrl: METRICS_URL
  }
})
