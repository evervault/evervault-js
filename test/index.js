const assert = require("assert");
const nock = require("nock");
require("dotenv").config();
const Evervault = require("../lib/v2/index.js");

require("./utils").runBrowserJsPolyfills();

const encryptedStringRegex =
  /((ev(:|%3A))(debug(:|%3A))?(([A-z0-9+/=%]+)(:|%3A))?((number|boolean|string)(:|%3A))?(([A-z0-9+/=%]+)(:|%3A)){3}(\$|%24))|(((eyJ[A-z0-9+=.]+){2})([\w]{8}(-[\w]{4}){3}-[\w]{12}))/;

describe("customConfig", () => {
  before(async () => {
    nock.disableNetConnect();
  });
  it("does not call out to api when publicKey is present", async () => {
    const ev = new Evervault(
      process.env.EV_TEAM_UUID,
      process.env.EV_APP_UUID,
      { publicKey: "BDeIKmwjqB35+tnMzQFEvXIvM2kyK6DX75NBEhSZxCR5CQZYnh1fwWsXMEqqKihmEGfMX0+EDHtmZNP/TK7mqMc=" }
    );
    const encryptedString = await ev.encrypt("Big Secret");
    assert(encryptedStringRegex.test(encryptedString));
  });
});
