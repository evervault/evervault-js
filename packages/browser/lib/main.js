import BrowserEncryptor from "@evervault/browser-encryptor";

import { Datatypes, errors, extractDomain } from "./utils";
import Config from "./config";
import { Input } from "./core";

export default class EvervaultClient {
  #encryptor

  constructor(teamId, appId, customConfig = {}) {
    if (!Datatypes.isString(teamId)) {
      throw new errors.InitializationError("teamId must be a string");
    }
    if (!Datatypes.isString(appId)) {
      throw new errors.InitializationError("appId must be a string");
    }

    this.#encryptor = new BrowserEncryptor(teamId, appId, customConfig);

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

    this.forms.register();
    this.input = Input(this.config);
  }

  async encrypt(data) {
    return this.#encryptor.encrypt(data);
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

  isInDebugMode() {
    return this.#encryptor.isDebugMode();
  }
}
