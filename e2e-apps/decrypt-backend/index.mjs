import { createServer } from "node:http";
import Evervault from "@evervault/sdk";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const appUuid = process.env.VITE_EV_APP_UUID;
const apiKey = process.env.EV_API_KEY;

// Uses a key scoped only to the decryption function
const evervault = new Evervault(appUuid, apiKey);

const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "*");
  response.setHeader("Access-Control-Allow-Headers", "*");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

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
            response;
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
      response.writeHead(200);
      response.end();
      return;
  }
});

server.listen(3010, () => {
  console.log("Server running at http://localhost:3010");
});
