import { createEncryptionConfig } from "./config";
import { CoreCrypto } from "./crypto";
import { base64StringToUint8Array } from "./encoding";
import { KEYS_URL } from "./env";
import { AppKey } from "./types";
import { isEmptyString } from "./utils/datatypes";
import deriveSharedSecret from "./utils/deriveSharedSecret";

export default class Encryption {
  team: string;
  app: string;
  #cryptoPromise: Promise<CoreCrypto>;
  // TODO: Support debug mode
  #debugMode: boolean = false;

  constructor(team: string, app: string) {
    this.team = team;
    this.app = app;
    this.#cryptoPromise = this.#setupCrypto();
  }

  async encrypt(data: unknown, role?: string) {
    // Ignore empty strings — encrypting an empty string in Safari causes an Operation Specific Error.
    if (isEmptyString(data)) {
      return data;
    }

    const crypto = await this.#cryptoPromise;
    return crypto.encrypt(data, role);
  }

  // TODO: Support public keys and debug keys
  async #setupCrypto() {
    const key = await this.#getKey();

    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveBits", "deriveKey"]
    );

    const derivedAesKey = await deriveSharedSecret(
      keyPair,
      key.ecdhP256KeyUncompressed,
      keyPair.publicKey
    );

    return new CoreCrypto(
      base64StringToUint8Array(key.ecdhP256Key),
      keyPair.publicKey,
      derivedAesKey,
      createEncryptionConfig(),
      this.#debugMode
    );
  }

  async #getKey() {
    try {
      // TODO: Hardcoded to context=default. Not sure if we need context anymore?
      const keyEndpoint = new URL(
        `${this.team}/apps/${this.app}?context=default`,
        KEYS_URL
      );

      const response = await fetch(keyEndpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const body = (await response.json()) as AppKey;
      const { headers } = response;

      return {
        ...body,
        isDebugMode: headers.get("X-Evervault-Inputs-Debug-Mode") === "true",
      };
    } catch (err) {
      throw "An error occurred while retrieving the apps key";
    }
  }
}
