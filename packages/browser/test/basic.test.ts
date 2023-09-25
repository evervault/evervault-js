import { rest } from "msw";
import { setupServer } from "msw/node";
import { describe, assert, it, beforeAll, afterAll, afterEach } from "vitest";

import EvervaultClient from "../lib/main";
import { DecryptError } from "../lib/utils/errors";
import { setupCrypto } from "./setup";

const encryptedStringRegex =
  /((ev(:|%3A))(debug(:|%3A))?(([A-z0-9+/=%]+)(:|%3A))?((number|boolean|string)(:|%3A))?(([A-z0-9+/=%]+)(:|%3A)){3}(\$|%24))|(((eyJ[A-z0-9+=.]+){2})([\w]{8}(-[\w]{4}){3}-[\w]{12}))/;

describe("customConfig", () => {
  beforeAll(() => {
    setupCrypto();
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
    const encryptedString: string = await ev.encrypt("Big Secret");
    assert(encryptedStringRegex.test(encryptedString));
  });
});

describe("Resolving SDK Context", () => {
  it("Is able to correctly resolve the SDK context", () => {
    const ev = new EvervaultClient(
      import.meta.env.VITE_EV_TEAM_UUID,
      import.meta.env.VITE_EV_APP_UUID,
      {
        publicKey:
          "BDeIKmwjqB35+tnMzQFEvXIvM2kyK6DX75NBEhSZxCR5CQZYnh1fwWsXMEqqKihmEGfMX0+EDHtmZNP/TK7mqMc=",
      }
    );
    // SDK in an inputs iFrame should always resolve `inputs` context
    assert(
      ev.getContext(
        "https://inputs.evervault.com",
        "https://inputs.evervault.com"
      ) === "inputs"
    );
    // SDK on a non-inputs iFrame should always resolve `default` context
    assert(
      ev.getContext("https://app.acme.com", "https://inputs.evervault.com") ===
        "default"
    );
  });
});

const execToken = "abcdefg";
const decrypted = {
  data: {
    value: "Big Secret",
  },
};

export const restHandlers = [
  rest.post("https://api.evervault.com/decrypt", (req, res, ctx) => {
    if (req.headers.get("Authorization") !== `Token ${execToken}`) {
      return res(ctx.status(401), ctx.json({}));
    }
    return res(ctx.status(200), ctx.json(decrypted));
  }),
];

const server = setupServer(...restHandlers);

describe("decrypt", () => {
  beforeAll(() => {
    setupCrypto();
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe("success", () => {
    it("decrypts correctly", async () => {
      const ev = new EvervaultClient("abcdefg", "uppa");
      const result = await ev.decrypt(execToken, "encryptedString");
      assert(result.value === decrypted.data.value);
    });
  });

  describe("unauthorized", () => {
    it("errors", async () => {
      const ev = new EvervaultClient("abcdefg", "uppa");
      try {
        await ev.decrypt("invalid", "encryptedString");
        assert(false); // should not reach here
      } catch (err) {
        assert(err instanceof DecryptError);
      }
    });
  });
});
