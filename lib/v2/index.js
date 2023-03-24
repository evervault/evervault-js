const { Datatypes, errors, extractDomain } = require("../utils");
const Config = require("./config");
const { Crypto, Http, Forms, Input } = require("./core");
const {
  deriveSharedSecret,
  buildCageKeyFromSuppliedPublicKey,
} = require("../utils/crypto");

class EvervaultClient {
  #ecdhTeamKey;
  #ecdhPublicKey;
  #derivedAesKey;
  #debugMode;

  constructor(teamId, appId, customConfig = {}) {
    if (!Datatypes.isString(teamId)) {
      throw new errors.InitializationError("teamId must be a string");
    }
    if (!Datatypes.isString(appId)) {
      throw new errors.InitializationError("appId must be a string");
    }
    if (!customConfig) {
      customConfig = {
        isDebugMode: false,
      };
    }

    if (customConfig.isDebugMode) {
      this.#debugMode = true;
    } else {
      this.#debugMode = false;
    }

    this.config = Config(
      teamId,
      appId,
      customConfig.urls,
      customConfig.publicKey
    );
    this.crypto = Crypto(this.config.encryption, this.isInDebugMode());

    if (window.location.origin === this.config.input.inputsUrl) {
      this.context = "inputs";
    } else {
      this.context = "default";
    }

    this.http = Http(
      this.config.http,
      this.config.teamId,
      this.config.appId,
      this.context
    );
    this.forms = Forms(this);
    this.forms.register();
    this.input = Input(this.config);
  }

  async loadKeys() {
    if (this.#ecdhTeamKey) return;

    const cageKey = this.config.encryption.publicKey
      ? await buildCageKeyFromSuppliedPublicKey(
          this.config.encryption.publicKey
        )
      : this.isInDebugMode()
      ? this.config.debugKey
      : await this.http.getCageKey();

    this.#ecdhTeamKey = Buffer.from(cageKey.ecdhP256Key, "base64");

    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveBits", "deriveKey"]
    );

    this.#ecdhPublicKey = keyPair.publicKey;

    // If config forced debug mode don't overwrite
    if (!this.isInDebugMode()) {
      this.#debugMode = cageKey.isDebugMode;
    }

    // recreate crypto module  with debug state
    this.crypto = Crypto(this.config.encryption, this.isInDebugMode());

    this.#derivedAesKey = await deriveSharedSecret(
      keyPair,
      cageKey.ecdhP256KeyUncompressed,
      this.#ecdhPublicKey
    );
  }

  async encrypt(data) {
    // Ignore empty strings — encrypting an empty string in Safari causes an Operation Specific Error.
    if (Datatypes.isEmptyString(data)) {
      return data;
    }
    if (!this.keysLoadingPromise) {
      this.keysLoadingPromise = this.loadKeys();
    }
    await this.keysLoadingPromise;
    try {
      return await this.crypto.encrypt(
        this.#ecdhTeamKey,
        this.#ecdhPublicKey,
        this.#derivedAesKey,
        data
      );
    } catch (err) {
      throw err;
    }
  }

  inputs(id, settings) {
    try {
      if (typeof settings === "string") {
        return this.input.generate(id, { theme: settings });
      } else {
        return this.input.generate(id, settings || {});
      }
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
              if (
                fieldsToEncrypt.length === 0 ||
                fieldsToEncrypt.includes(item)
              ) {
                parsedBody[item] = await this.encrypt(parsedBody[item]);
              }
            }
            options.body = JSON.stringify(parsedBody);
          } catch (err) {}
        }

        return global.oldFetch(url, options);
      };
    }
  }

  isInDebugMode() {
    return this.#debugMode;
  }
}

module.exports = EvervaultClient;
