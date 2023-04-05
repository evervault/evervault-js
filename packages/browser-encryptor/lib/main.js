import { Datatypes, errors } from "./utils";
import Config from "./config";
import { Crypto, Http } from "./core";
import {
  deriveSharedSecret,
  buildCageKeyFromSuppliedPublicKey,
} from "./utils/crypto";
import { base64StringToUint8Array } from "./utils/encoding";

export default class BrowserEncryptor {
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
    this.crypto = Crypto(this.config.encryption, this.isInDebugMode());

    if (customConfig?.context === "inputs") {
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

  isInDebugMode() {
    return this.#debugMode;
  }
}
