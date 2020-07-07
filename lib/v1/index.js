const { Datatypes, errors } = require('./utils');
const Config = require('./config');
const { Crypto, Http } = require('./core');

class EvervaultClient {
  constructor(teamId) {
    if (!Datatypes.isString(teamId)) {
      throw new errors.InitializationError('teamId must be a string');
    }
    this.config = Config(teamId);
    this.crypto = Crypto(this.config.encryption);
    this.http = Http(this.config.http, this.config.teamId);
  }

  async encrypt(data, options) {
    if (!Datatypes.isDefined(this._cageKey)) {
      const cageKeyResponse = await this.http.getCageKey();
      this.defineHiddenProperty('_cageKey', cageKeyResponse.key);
    }
    return await this.crypto.encrypt(this._cageKey, data, options);
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