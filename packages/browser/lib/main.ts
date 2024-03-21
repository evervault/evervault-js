import getConfig, { ConfigUrls, SdkContext } from "./config";
import { CoreCrypto, Http, Forms, Input } from "./core";
import { CageKey, Form } from "./core/http";
import { base64StringToUint8Array } from "./encoding";
import UIComponents from "./ui";
import {
  Datatypes,
  errors,
  extractDomain,
  buildCageKeyFromSuppliedPublicKey,
  deriveSharedSecret,
  getContext,
  findParentOfInput,
  findChildOfForm,
  findFormByHiddenField,
} from "./utils";
import type { InputSettings, RevealSettings } from "./types";

export type * from "types";
export type * from "./config";
export type * from "./types";
export type * from "./messages";
export type { Datatypes };

export interface CustomConfig {
  isDebugMode?: boolean;
  urls?: ConfigUrls;
  publicKey?: string;
  appKey?: CageKey;
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

export default class EvervaultClient {
  /** @deprecated */
  forms;

  config;
  http;
  input;

  #debugMode;
  #cryptoPromise: Promise<CoreCrypto>;
  ui: UIComponents;

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

    const context = getContext(
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
    this.#cryptoPromise = this.loadKeys(customConfig.appKey);
    this.ui = new UIComponents(this);
  }

  static async init(
    teamUuid: string,
    appUuid: string,
    customConfig: CustomConfig = {}
  ): Promise<EvervaultClient> {
    if (!Datatypes.isString(teamUuid)) {
      throw new errors.InitializationError("teamUuid must be a string");
    }
    if (!Datatypes.isString(appUuid)) {
      throw new errors.InitializationError("appUuid must be a string");
    }

    const config = getConfig(
      teamUuid,
      appUuid,
      customConfig?.urls,
      customConfig?.publicKey
    );

    const context = getContext(
      window?.location?.origin ?? "",
      config.input.inputsOrigin
    );

    const http = Http(config.http, config.teamId, config.appId, context);

    const appKey = await http.getCageKey();

    return new EvervaultClient(teamUuid, appUuid, {
      ...customConfig,
      appKey,
    });
  }

  // TODO: make this private and static
  // eslint-disable-next-line class-methods-use-this
  getContext(origin: string, inputsUrl: string): SdkContext {
    if (origin === inputsUrl) {
      return "inputs";
    }
    return "default";
  }

  // TODO: make this private
  async loadKeys(appPublicKey: CageKey | undefined) {
    let appKey;
    if (this.config.encryption.publicKey) {
      appKey = buildCageKeyFromSuppliedPublicKey(
        this.config.encryption.publicKey
      );
    } else if (this.isInDebugMode()) {
      // debug mode being set true will override the public key
      appKey = this.config.debugKey;
    } else if (appPublicKey) {
      appKey = appPublicKey;
    } else {
      appKey = await this.http.getCageKey();
    }

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
      appKey.ecdhP256KeyUncompressed,
      keyPair.publicKey
    );

    return new CoreCrypto(
      base64StringToUint8Array(appKey.ecdhP256Key),
      keyPair.publicKey,
      derivedAesKey,
      this.config.encryption,
      this.isInDebugMode()
    );
  }

  /**
   * Encrypts data using Evervaults encryption scheme.
   * @param data - The data to encrypt.
   * @returns The encrypted data.
   */
  async encrypt(data: File, role?: string): Promise<File>;
  async encrypt(data: Blob, role?: string): Promise<Blob>;
  async encrypt(
    data: Datatypes.EncryptableAsString,
    role?: string
  ): Promise<string>;

  async encrypt(
    data: Datatypes.EncryptableValue[],
    role?: string
  ): Promise<Datatypes.EncryptedValue[]>;

  async encrypt(
    data: Datatypes.EncryptableObject,
    role?: string
  ): Promise<NonNullable<unknown>>;

  async encrypt(data: unknown, role?: string): Promise<string>;
  async encrypt(data: unknown, role?: string) {
    // Ignore empty strings — encrypting an empty string in Safari causes an Operation Specific Error.
    if (Datatypes.isEmptyString(data)) {
      return data;
    }

    const crypto = await this.#cryptoPromise;
    return crypto.encrypt(data, role);
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
    config?: string | InputSettings
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
    config?: RevealSettings,
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
    /* eslint-disable */
    // This is deprecated and should just be removed so disabling types and lint.
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
    /* eslint-enable */
  }

  decrypt<T>(token: string, data: T): Promise<{ value: T }> {
    return this.http.decryptWithToken(token, data);
  }

  async enableFormEncryption(thirdPartyForm: HTMLFormElement | undefined) {
    const forms: Form[] = await this.http.getAppForms();
    if (thirdPartyForm) {
      const findSubmitButton = thirdPartyForm.querySelector("[type='submit']")
      findSubmitButton?.addEventListener("click", async (event) => {
        event.preventDefault();
        if (forms.length > 0) {
          for (let i = 0; i < forms.length; i++) {
            const targetElements = forms[i].targetElements
            for (let x = 0; x < targetElements.length; x++) {
              const childToEncrypt = findChildOfForm(
                thirdPartyForm,
                forms[i].targetElements[x].elementType,
                forms[i].targetElements[x].elementName
              );
              if (childToEncrypt != undefined) {
                const encValue = await this.encrypt(childToEncrypt.value);
                childToEncrypt.value = encValue;
              }
            }
          }
        }
        thirdPartyForm.submit();
      }, false);
    } else {
      forms.forEach((form: Form) => {
        const hiddenInput = findFormByHiddenField(form.uuid);
        if (hiddenInput === null) {
          return;
        }
        const parentForm = findParentOfInput(hiddenInput);
        form.targetElements.forEach((field, idx) => {
          const childToEncrypt = findChildOfForm(
            parentForm,
            field.elementType,
            field.elementName
          );
          childToEncrypt.removeAttribute("name");

          const hiddenField = document.createElement(field.elementType);
          hiddenField.setAttribute("type", "hidden");
          hiddenField.setAttribute("name", field.elementName);
          hiddenField.setAttribute("id", `ev_enc_shadow_${idx}`);
          hiddenField.style.visibility = "hidden";
          parentForm.appendChild(hiddenField);

          childToEncrypt.addEventListener("input", (event) => {
            const target = event.target as HTMLTextAreaElement;
            if (target?.value) {
              this.encrypt(target.value)
                .then((encryptedValue) => {
                  // @ts-expect-error explict cast is needed for more then a textarea
                  hiddenField.value = encryptedValue;
                })
                .catch((_) => {
                  console.error("Error encrypting form value");
                });
            }
          });
        });
      });
    }
  }

  isInDebugMode() {
    return this.#debugMode;
  }
}
