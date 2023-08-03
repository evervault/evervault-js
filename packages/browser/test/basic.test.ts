import { describe, assert, it, beforeAll } from "vitest";
import * as nock from "nock";

import { setupCrypto } from "./setup";

import EvervaultClient from "../lib/main";

const encryptedStringRegex =
  /((ev(:|%3A))(debug(:|%3A))?(([A-z0-9+/=%]+)(:|%3A))?((number|boolean|string)(:|%3A))?(([A-z0-9+/=%]+)(:|%3A)){3}(\$|%24))|(((eyJ[A-z0-9+=.]+){2})([\w]{8}(-[\w]{4}){3}-[\w]{12}))/;

describe("customConfig", () => {
  beforeAll(async () => {
    setupCrypto();
    nock.disableNetConnect();
  });
  it("does not call out to api when publicKey is present", async () => {
    const ev = new EvervaultClient(
      import.meta.env.VITE_EV_TEAM_UUID,
      import.meta.env.VITE_EV_APP_UUID,
      {
        publicKey:
          "BDeIKmwjqB35+tnMzQFEvXIvM2kyK6DX75NBEhSZxCR5CQZYnh1fwWsXMEqqKihmEGfMX0+EDHtmZNP/TK7mqMc=",
      }
    );
    const encryptedString = await ev.encrypt("Big Secret");
    assert(encryptedStringRegex.test(encryptedString));
  });
});

describe("decrypt", () => {
  const execToken = "abcdefg";
  const decrypted = {
    value: "Big Secret",
  };

  describe("success", () => {
    beforeAll(async () => {
      setupCrypto();
      nock("https://api.evervault.com").post("/decrypt").matchHeader("Authorization", `ExecutionToken ${execToken}`).once().reply(200, decrypted);
    });

    it("decrypts correctly", async () => {
      const ev = new EvervaultClient(
        "abcdefg",
        "uppa"
      );
      const decryptedString = await ev.decryptWithToken(execToken, "encryptedString");
      assert(decryptedString === decrypted.value);
    });
  });

  describe("unauthorized", () => {
    beforeAll(async () => {
      setupCrypto();
      nock("https://api.evervault.com").post("/decrypt").matchHeader("Authorization", `ExecutionToken ${execToken}`).once().reply(401, {});
    });

    it("bubbles errors", async () => {
      const ev = new EvervaultClient(
        "abcdefg",
        "uppa"
      );
      const response = await ev.decryptWithToken(execToken, "encryptedString");
      assert(response instanceof Error);
    });
  });


});
