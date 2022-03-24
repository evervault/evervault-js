const { Datatypes, errors, extractDomain } = require('./utils');
const Config = require('./config');
const { Crypto, Http, Forms, Input } = require('./core');
const { deriveSharedSecret } = require('./utils/crypto');

class EvervaultClient {
  constructor(teamId, customConfig = {}) {
    if (!Datatypes.isString(teamId)) {
      throw new errors.InitializationError('teamId must be a string');
    }
    if(!customConfig) {
      customConfig = {};
    }
    this.config = Config(teamId, customConfig.urls);
    this.crypto = Crypto(this.config.encryption);
    this.http = Http(this.config.http, this.config.teamId);
    this.forms = Forms(this);
    this.forms.register();
    this.input = Input(this);
  }

  async encrypt(data) {
    this.http.reportMetric();
    if (!Datatypes.isDefined(this._ecdhTeamKey)) {
      const cageKeyResponse = await this.http.getCageKey();
      this.defineHiddenProperty('_ecdhTeamKey', Buffer.from(cageKeyResponse.ecdhP256Key, 'base64'));

      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true,
        ['deriveBits', 'deriveKey']
      );
      
      this.defineHiddenProperty('_ecdhPublicKey', keyPair.publicKey)
      this.defineHiddenProperty(
        '_derivedAesKey',
        await deriveSharedSecret(
          keyPair,
          this._ecdhTeamKey,
          this._ecdhPublicKey
        )
      );
    }
    try {
      return await this.crypto.encrypt(
        this._ecdhTeamKey,
        this._ecdhPublicKey,
        this._derivedAesKey,
        data
      );
    } catch (err) {
      throw err;
    }
  }

  inputs(id) {
    try {
      return this.input.generate(this, id);
    } catch (err) {
      throw err;
    }
  }

  auto(fieldsToEncrypt = []) {
    if (!global.oldFetch) {
      global.oldFetch = global.fetch;
      global.fetch = async (url, options) => {
        const { body } = options;
        const toDomain = extractDomain(url);
        const fromDomain = extractDomain(window.location.hostname);
        
        if (toDomain === fromDomain) {
          try {
            const parsedBody = JSON.parse(body);
            for (const item of Object.keys(parsedBody)) {
              if (fieldsToEncrypt.length === 0 || fieldsToEncrypt.includes(item)) {
                parsedBody[item] = await this.encrypt(parsedBody[item]);
              }
            }
            options.body = JSON.stringify(parsedBody);
          } catch (err) {}
        }

        return global.oldFetch(url, options);
      }
    }
  }

  defineHiddenProperty(property, value) {
    Object.defineProperty(this, property, {
      enumerable: false,
      configurable: false,
      writable: false,
      value,
    });
  }
}

module.exports = EvervaultClient;
