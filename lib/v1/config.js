const KEYS_URL = 'https://keys.evervault.com';
const METRICS_URL = 'https://metrics.evervault.com';

const DEFAULT_CONFIG = {
  urls: {
    keysUrl: KEYS_URL
  }
};

module.exports = (teamId, config = DEFAULT_CONFIG) => ({
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
    keysUrl: config.urls.keysUrl,
    metricsUrl = METRICS_URL
  }
})
