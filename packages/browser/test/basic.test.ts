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
