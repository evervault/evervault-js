import {
  Datatypes,
  errors,
  extractDomain,
  buildCageKeyFromSuppliedPublicKey,
  deriveSharedSecret,
} from "./utils";
import Config from "./config";
import { CoreCrypto, Http, Forms, Input } from "./core";
import { base64StringToUint8Array } from "./encoding";

export default class EvervaultClient {
  config;
  #debugMode;
  #ecdhTeamKey;
  #ecdhPublicKey;
  #derivedAesKey;

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
    if (this.#ecdhTeamKey != null) return;

    const cageKey = this.config.encryption.publicKey
      ? await buildCageKeyFromSuppliedPublicKey(
          this.config.encryption.publicKey
        )
      : this.isInDebugMode()
      ? this.config.debugKey
      : await this.http.getCageKey();

    this.#ecdhTeamKey = base64StringToUint8Array(cageKey.ecdhP256Key);

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

    this.#derivedAesKey = await deriveSharedSecret(
      keyPair,
      cageKey.ecdhP256KeyUncompressed,
      this.#ecdhPublicKey
    );
  }

  /**
   * Encrypts data on your device with your app's public key.
   * @param {any} data - The data to encrypt.
   * @returns {Promise<any>} - The encrypted data.
   * */
  async encrypt(data) {
    // Ignore empty strings — encrypting an empty string in Safari causes an Operation Specific Error.
    if (Datatypes.isEmptyString(data)) {
      return data;
    }
    if (!this.keysLoadingPromise) {
      this.keysLoadingPromise = this.loadKeys();
    }
    await this.keysLoadingPromise;

    const crypto = new CoreCrypto(
      this.#ecdhTeamKey,
      this.#ecdhPublicKey,
      this.#derivedAesKey,
      this.config.encryption,
      this.isInDebugMode()
    );

    try {
      return await crypto.encrypt(data);
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

  /**
   * @deprecated
   **/
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
