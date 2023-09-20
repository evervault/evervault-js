import getConfig, { ConfigUrls, SdkContext } from "./config";
import { CoreCrypto, Http, Forms, Input } from "./core";
import { base64StringToUint8Array } from "./encoding";
import {
  Datatypes,
  errors,
  extractDomain,
  buildCageKeyFromSuppliedPublicKey,
  deriveSharedSecret,
} from "./utils";

export type * from "./config";
export type { EncryptableAsString } from "./utils/datatypes";

export interface CustomConfig {
  isDebugMode?: boolean;
  urls?: ConfigUrls;
  publicKey?: string;
}

export interface EvervaultRequestProps {
  cache?: RequestCache;
  credentials?: RequestCredentials;
  destination?: RequestDestination;
  headers?: Record<string, string>;
  integrity?: string;
  keepalive?: boolean;
  method?: string;
  mode?: RequestMode;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  url?: string;
}

export interface CustomStyles {
  cardNumberText?: CSSStyleDeclaration;
  cardNumberLabel?: CSSStyleDeclaration;
  cardNumberGroup?: CSSStyleDeclaration;
  securityCodeText?: CSSStyleDeclaration;
  securityCodeLabel?: CSSStyleDeclaration;
  securityCodeGroup?: CSSStyleDeclaration;
  expirationDateText?: CSSStyleDeclaration;
  expirationDateLabel?: CSSStyleDeclaration;
  expirationDateGroup?: CSSStyleDeclaration;
  topRow?: CSSStyleDeclaration;
  bottomRow?: CSSStyleDeclaration;
  copyButton?: CSSStyleDeclaration;
}

export type InputConfig = string | Record<string, unknown>;
export interface RevealConfig {
  height?: string;
  revealFontSize?: string;
  revealFontWeight?: string;
  revealTextColor?: string;
  fontUrl?: string;
  fontFamily?: string;
  cardNumberLabel?: string;
  expirationDateLabel?: string;
  securityCodeLabel?: string;
  labelFontSize?: string;
  labelFontWeight?: string;
  labelColor?: string;
  customStyles?: CustomStyles;
}

export default class EvervaultClient {
  /** @deprecated */
  forms;

  config;
  http;
  input;

  #debugMode;
  #cryptoPromise: Promise<CoreCrypto>;

  /**
   * The SDK constructor accepts two parameters:
   * - Your Team ID
   * - Your App ID
   *
   * @param teamId The ID of your Evervault team. This can be found inside of your team settings on the [Evervault dashboard](https://app.evervault.com).
   * @param appId The ID of your Evervault app. This can be found inside of your app settings on the [Evervault dashboard](https://app.evervault.com).
   */
  constructor(teamId: string, appId: string, customConfig: CustomConfig = {}) {
    if (!Datatypes.isString(teamId)) {
      throw new errors.InitializationError("teamId must be a string");
    }
    if (!Datatypes.isString(appId)) {
      throw new errors.InitializationError("appId must be a string");
    }

    this.#debugMode = customConfig.isDebugMode === true;

    this.config = getConfig(
      teamId,
      appId,
      customConfig?.urls,
      customConfig?.publicKey
    );

    const context = this.getContext(
      window?.location?.origin ?? "",
      this.config.input.inputsOrigin
    );

    this.http = Http(
      this.config.http,
      this.config.teamId,
      this.config.appId,
      context
    );

    this.forms = Forms(this);
    this.forms.register();
    this.input = Input(this.config);

    this.#cryptoPromise = this.loadKeys();
  }

  // TODO: make this private
  async loadKeys() {
    const debugMode = this.config.encryption.publicKey
      ? buildCageKeyFromSuppliedPublicKey(this.config.encryption.publicKey)
      : this.isInDebugMode();
    const cageKey = debugMode
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

  // TODO: make this private and static
  // eslint-disable-next-line class-methods-use-this
  getContext(origin: string, inputsUrl: string): SdkContext {
    if (origin === inputsUrl) {
      return "inputs";
    }
    return "default";
  }

  /**
   * Initializes Evervault Inputs. Evervault Inputs makes it easy to collect encrypted cardholder data in a completely PCI-compliant environment.
   * Evervault Inputs are served within an iFrame retrieved directly from Evervault’s PCI-compliant infrastructure, which can reduce your PCI DSS compliance scope to the simplest form (SAQ A).
   * Simply pass the ID of the element in which the iFrame should be embedded.
   * We also support themes and custom styles so you can customise how Inputs looks in your UI.
   * @param data - The data to encrypt.
   * @returns The encrypted data.
   * */
  async encrypt<T>(data: T): Promise<T> {
    // Ignore empty strings — encrypting an empty string in Safari causes an Operation Specific Error.
    if (Datatypes.isEmptyString(data)) {
      return data;
    }

    const crypto = await this.#cryptoPromise;
    return crypto.encrypt(data);
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
  inputs(
    elementId: string,
    config?: InputConfig
  ): {
    isInputsLoaded: Promise<boolean>;
    getData: () => Promise<unknown>;
    on: (event: unknown, fn: (data: unknown) => void) => void;
    setLabels: (labels: Record<string, unknown>) => void;
  } {
    if (typeof config === "string") {
      return this.input.generate(elementId, { theme: config });
    }
    return this.input.generate(elementId, config ?? {});
  }

  reveal(
    elementId: string,
    request: Request | EvervaultRequestProps,
    config?: RevealConfig,
    onCopy?: () => void
  ): {
    isRevealLoaded: Promise<boolean>;
  } {
    const reveal = this.input.generate(
      elementId,
      {
        theme: "reveal",
        ...config,
      },
      true,
      request,
      onCopy
    );

    return {
      isRevealLoaded: reveal.isInputsLoaded,
    };
  }

  /**
   * @deprecated
   */
  auto(fieldsToEncrypt = []) {
    /* eslint-disable @typescript-eslint/ban-ts-comment */
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
    /* eslint-enable @typescript-eslint/ban-ts-comment */
  }

  decrypt(token: string, data: unknown): Promise<unknown> {
    return this.http.decryptWithToken(token, data);
  }

  isInDebugMode() {
    return this.#debugMode;
  }
}
