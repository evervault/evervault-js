const { Datatypes, errors, extractDomain } = require('./utils');
const Config = require('./config');
const { Crypto, Http, Forms } = require('./core');
const extractDomainFromUrl = require('./utils/domain');

class EvervaultClient {
  constructor(teamId, apiUrlOverride) {
    if (!Datatypes.isString(teamId)) {
      throw new errors.InitializationError('teamId must be a string');
    }
    if (!Datatypes.isUndefined(apiUrlOverride) && !Datatypes.isString(apiUrlOverride)) {
      throw new errors.InitializationError('appUrl must be a string');
    }
    this.config = Config(teamId, apiUrlOverride);
    this.crypto = Crypto(this.config.encryption);
    this.http = Http(this.config.http, this.config.teamId);
    this.forms = Forms(this);
    this.forms.register();
  }

  async encrypt(data) {
    this.http.reportMetric();
    if (!Datatypes.isDefined(this._cageKey)) {
      const cageKeyResponse = await this.http.getCageKey();
      this.defineHiddenProperty('_cageKey', cageKeyResponse.key);
    }
    try {
    return await this.crypto.encrypt(this._cageKey, data  );
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
