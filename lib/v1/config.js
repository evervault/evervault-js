const KEYS_URL = 'https://keys.evervault.com';
const METRICS_URL = ' https://metrics.evervault.com';

module.exports = (teamId, keysUrlOverride) => ({
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
    keysUrl: keysUrlOverride || KEYS_URL,
    metricsUrl: METRICS_URL,
  }
})
