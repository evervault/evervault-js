import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, assert, it, beforeAll, afterAll, afterEach } from "vitest";
import { getAppSDKConfig } from "shared/getAppSDKConfig";
import { setupCrypto } from "./setup";

const apiUrl = "https://api.test.evervault.com";
const app = "app_test123";

const server = setupServer();

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

describe("getAppSDKConfig", () => {
  it("returns the parsed config when the API returns 200", async () => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, ({ request }) => {
        assert(request.headers.get("X-Evervault-App-Id") === app);
        return HttpResponse.json({ is_sandbox: true }, { status: 200 });
      })
    );

    const config = await getAppSDKConfig(app, apiUrl);
    assert(config.is_sandbox === true);
  });

  it("returns the default config when the API responds non-2xx", async () => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, () =>
        HttpResponse.json({}, { status: 500 })
      )
    );

    const config = await getAppSDKConfig(app, apiUrl);
    assert(config.is_sandbox === false);
  });

  it("returns the default config when fetch throws", async () => {
    server.use(
      http.get(`${apiUrl}/frontend/sdk/config`, () => HttpResponse.error())
    );

    const config = await getAppSDKConfig(app, apiUrl);
    assert(config.is_sandbox === false);
  });
});
