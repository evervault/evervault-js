import {
  Datatypes,
  errors,
  extractDomain,
  buildCageKeyFromSuppliedPublicKey,
  deriveSharedSecret,
} from "./utils";
import Config, { ConfigUrls } from "./config";
import { CoreCrypto, Http, Forms, Input } from "./core";
import { base64StringToUint8Array } from "./encoding";

type CustomConfig = {
  isDebugMode?: boolean;
  urls?: ConfigUrls;
  publicKey?: string;
};

type Keys = {
  teamKey: Uint8Array;
  publicKey: CryptoKey;
  derivedAesKey: ArrayBuffer;
};

export default class EvervaultClient {
  /** @deprecated */
  forms;

  config;
  http;
  input;

  #debugMode;
  #cryptoPromise: Promise<CoreCrypto> | null = null;

  constructor(teamId: string, appId: string, customConfig: CustomConfig = {}) {
    if (!Datatypes.isString(teamId)) {
      throw new errors.InitializationError("teamId must be a string");
    }
    if (!Datatypes.isString(appId)) {
      throw new errors.InitializationError("appId must be a string");
    }

    this.#debugMode = customConfig.isDebugMode === true;

    this.config = Config(
      teamId,
      appId,
      customConfig?.urls,
      customConfig?.publicKey
    );

    this.http = Http(
      this.config.http,
      this.config.teamId,
      this.config.appId,
      this.config.input.inputsUrl ? "inputs" : "default"
    );

    this.forms = Forms(this);
    this.forms.register();
    this.input = Input(this.config);

    this.#cryptoPromise = null;
  }

  // TODO: make this private
  async loadKeys() {
    const cageKey = this.config.encryption.publicKey
      ? await buildCageKeyFromSuppliedPublicKey(
          this.config.encryption.publicKey
        )
      : this.isInDebugMode()
      ? this.config.debugKey
      : await this.http.getCageKey();

    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveBits", "deriveKey"]
    );

    // If config forced debug mode don't overwrite
    if (!this.isInDebugMode()) {
      this.#debugMode = cageKey.isDebugMode;
    }

    const derivedAesKey = await deriveSharedSecret(
      keyPair,
      cageKey.ecdhP256KeyUncompressed,
      keyPair.publicKey
    );

    return new CoreCrypto(
      base64StringToUint8Array(cageKey.ecdhP256Key),
      keyPair.publicKey,
      derivedAesKey,
      this.config.encryption,
      this.isInDebugMode()
    );
  }

  /**
   * Initializes Evervault Inputs. Evervault Inputs makes it easy to collect encrypted cardholder data in a completely PCI-compliant environment.
   * Evervault Inputs are served within an iFrame retrieved directly from Evervault’s PCI-compliant infrastructure, which can reduce your PCI DSS compliance scope to the simplest form (SAQ A).
   * Simply pass the ID of the element in which the iFrame should be embedded.
   * We also support themes and custom styles so you can customise how Inputs looks in your UI.
   * @param data - The data to encrypt.
   * @returns The encrypted data.
   * */
  async encrypt(data: any): Promise<any> {
    // Ignore empty strings — encrypting an empty string in Safari causes an Operation Specific Error.
    if (Datatypes.isEmptyString(data)) {
      return data;
    }
    if (this.#cryptoPromise === null) {
      this.#cryptoPromise = this.loadKeys();
    }
    const crypto = await this.#cryptoPromise;

    try {
      return await crypto.encrypt(data);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Initializes Evervault Inputs. Evervault Inputs makes it easy to collect encrypted cardholder data in a completely PCI-compliant environment.
   * Evervault Inputs are served within an iFrame retrieved directly from Evervault’s PCI-compliant infrastructure, which can reduce your PCI DSS compliance scope to the simplest form (SAQ A).
   * Simply pass the ID of the element in which the iFrame should be embedded.
   * We also support themes and custom styles so you can customise how Inputs looks in your UI.
   * @param elementId ID of the DOM element in which the Evervault Inputs iFrame should be embedded.
   * @param config A theme string (supported: default, minimal or material), or a config object for custom styles.
   * @returns
   */
  inputs(elementId: string, config?: string | Record<string, any>) {
    try {
      if (typeof config === "string") {
        return this.input.generate(elementId, { theme: config });
      } else {
        return this.input.generate(elementId, config ?? {});
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * @deprecated
   **/
  auto(fieldsToEncrypt = []) {
    // I am NOT typechecking any of this.
    // @ts-ignore
    if (!global.oldFetch) {
      // @ts-ignore
      global.oldFetch = global.fetch;
      // ...The hell?
      global.fetch = async (url, options) => {
        // @ts-ignore
        const { body } = options;
        // @ts-ignore
        const toDomain = extractDomain(url);
        const fromDomain = extractDomain(window.location.hostname);

        if (toDomain === fromDomain) {
          try {
            const parsedBody = JSON.parse(body);
            for (const item of Object.keys(parsedBody)) {
              if (
                fieldsToEncrypt.length === 0 ||
                // @ts-ignore
                fieldsToEncrypt.includes(item)
              ) {
                parsedBody[item] = await this.encrypt(parsedBody[item]);
              }
            }
            // @ts-ignore
            options.body = JSON.stringify(parsedBody);
          } catch (err) {}
        }

        // @ts-ignore
        return global.oldFetch(url, options);
      };
    }
  }

  isInDebugMode() {
    return this.#debugMode;
  }
}
