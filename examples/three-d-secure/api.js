import { createServer } from "node:http";

// This is a simple API for creating the 3DS session.
// In practice, this would be part of your backend or existing API.

const server = createServer(async (request, response) => {
  const { method, url } = request;
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "*");
  response.setHeader("Access-Control-Allow-Headers", "*");

  if (method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  // POST /three-d-secure
  // This is a simple endpoint that takes the encrypted card details
  // from the client and creates a 3DS session. In practice, you would
  // do some additional checks here to determine if 3DS is required.
  if (method === "POST" && url === "/three-d-secure") {
    const body = await parseBody(request);
    const session = await createThreeDSSession(body);
    response.setHeader("Content-Type", "application/json");
    response.writeHead(200);
    response.end(JSON.stringify({ session: session.id }));
    return;
  }

  // POST /checkout
  // A mock endpoint to simulate a payment being processed.
  if (method === "POST" && url === "/checkout") {
    const { session } = await parseBody(request);
    const data = await evervaultAPI("GET", `/payments/3ds-sessions/${session}`);
    // The cryptogram can be accessed from data.cryptogram
    console.log("Cryptogram:", data.cryptogram);

    response.setHeader("Content-Type", "application/json");
    response.writeHead(200);
    response.end(JSON.stringify({ success: true }));
    return;
  }

  response.writeHead(404);
  response.end();
});

server.listen(3010, () => {
  console.log("Server running at http://localhost:3010");
});

async function evervaultAPI(method, path, payload) {
  const token = btoa(
    `${process.env.VITE_EV_APP_UUID}:${process.env.EV_API_KEY}`
  );
  const response = await fetch(`${process.env.VITE_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

async function createThreeDSSession(payload) {
  return evervaultAPI("POST", "/payments/3ds-sessions", {
    card: {
      number: payload.number,
      expiry: payload.expiry,
      cvv: payload.cvv,
    },
    merchant: {
      name: "Test Merchant",
      website: "https://test-merchant.com",
      categoryCode: "4011",
      country: "ie",
    },
    payment: {
      type: "one-off",
      amount: 0,
      currency: "eur",
    },
    challenge: {
      preference: "challenge-mandated"
    },
    acquirer: {
      bin: "444444",
      merchantIdentifier: "837223891854392",
      country: "ie",
    },
    customer: {
      name: "Test Customer",
      email: "customer@gmail.com",
      phone: [
        {
          type: "work",
          countryCode: "44",
          number: "123456789",
        },
      ],
      shipping: {
        address: {
          line1: "123 Fake Street",
          line2: "Apt 1",
          city: "Dublin",
          postalCode: "90210",
          country: "us",
          state: "CA",
        },
      },
      billing: {
        address: {
          line1: "123 Fake Street",
          line2: "Apt 1",
          city: "Los Angeles",
          postalCode: "90210",
          country: "us",
          state: "CA",
        },
        taxIdentifier: "123456",
      }
    }
  });
}

async function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      resolve(JSON.parse(body));
    });
    request.on("error", reject);
  });
}
