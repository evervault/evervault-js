import { fileURLToPath } from "node:url";

import { createServer } from "node:http";
import staticHandler from "serve-handler";

import Evervault from "@evervault/sdk";

(await import("dotenv")).config();

// Uses a key scoped only to the decryption function
const evervault = new Evervault(process.env.EV_DECRYPT_FN_KEY);

const server = createServer(async (request, response) => {
  switch (request.url) {
    case "/test_decryption":
      if (
        request.method === "POST" &&
        request.headers["content-type"] === "application/json"
      ) {
        let body = [];
        request.on("data", (chunk) => {
          body.push(chunk);
        }).on("end", async () => {
          body = Buffer.concat(body).toString();
          console.log(body);
          body = JSON.parse(body);
          const functionRun = await evervault.run("js-sdk-e2e-backend", body);
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify(functionRun.result));
        });
      }
      break;
    default:
      await staticHandler(request, response, {
        public: fileURLToPath(new URL(".", import.meta.url)),
      });
      break;
  }
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
