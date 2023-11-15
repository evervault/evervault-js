import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import serveHandler from "serve-handler";

import Evervault from "@evervault/sdk";

(await import("dotenv")).config();

// Uses a key scoped only to the decryption function
const evervault = new Evervault(process.env.EV_DECRYPT_FN_KEY);

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const server = createServer(async (request, response) => {
  switch (request.url) {
    case "/api/create-decrypt-token":
      if (
        request.method === "POST" &&
        request.headers["content-type"] === "application/json"
      ) {
        let body = [];
        request
          .on("data", (chunk) => {
            body.push(chunk);
          })
          .on("end", async () => {
            body = Buffer.concat(body).toString();
            body = JSON.parse(body);
            const token = await evervault.createClientSideDecryptToken(body);
            response.setHeader("Content-Type", "application/json");
            response.writeHead(200);
            response.end(JSON.stringify(token.token));
          });
      }
      return;
    case "/api/test_decryption":
      if (
        request.method === "POST" &&
        request.headers["content-type"] === "application/json"
      ) {
        let body = [];
        request
          .on("data", (chunk) => {
            body.push(chunk);
          })
          .on("end", async () => {
            body = Buffer.concat(body).toString();
            body = JSON.parse(body);
            const functionRun = await evervault.run("js-sdk-e2e-backend", body);
            response.setHeader("Content-Type", "application/json");
            response.writeHead(200);
            response.end(JSON.stringify(functionRun.result));
          });
      }
      return;
    default:
      await serveHandler(request, response, {
        public: resolve(__dirname, "..", "browser", "dist"),
      });
      return;
  }
});

server.listen(3010, () => {
  console.log("Server running at http://localhost:3010");
});
