import { describe, assert, it, beforeAll, afterAll } from "vitest";
import * as nock from "nock";
import { setupServer } from "msw/node";
import { rest } from "msw";

import { setupCrypto } from "./setup";

import EvervaultClient from "../lib/main";
import { afterEach } from "node:test";
import { DecryptError } from "../lib/utils/errors";

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

const execToken = "abcdefg";
const decrypted = {
  value: "Big Secret",
};

export const restHandlers = [
  rest.get('https://rest-endpoint.example/path/to/posts', (req, res, ctx) => {
    if (req.headers.get('Authorization') !== `ExecutionToken ${execToken}`) {
      return res(ctx.status(401), ctx.json({}))
    }
    return res(ctx.status(200), ctx.json(decrypted))
  }),
]

const server = setupServer(...restHandlers);

describe("decrypt", () => {
  beforeAll(async () => {
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
      const ev = new EvervaultClient(
        "abcdefg",
        "uppa"
      );
      const decryptedString = await ev.decryptWithToken(execToken, "encryptedString");
      assert(decryptedString === decrypted.value);
    });
  });

  describe("unauthorized", () => {
    it("errors", async () => {
      const ev = new EvervaultClient(
        "abcdefg",
        "uppa"
      );
      const response = await ev.decryptWithToken(execToken, "encryptedString");
      assert(response instanceof DecryptError);
    });
  });
});
