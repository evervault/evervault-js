import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import pino from "pino";
import pinoHttp from "pino-http";

const { EV_API_KEY, EV_APP_UUID, EV_PORT } = process.env;
const credential = Buffer.from(
  `${EV_APP_UUID}:${EV_API_KEY}`,
  "utf-8"
).toString("base64");

const logger = pino();

async function create3DSecureSession({ cardNumber, expiryMonth, expiryYear }) {
  logger.info(
    `Creating 3DS session for card ${cardNumber} expiring ${expiryMonth}/${expiryYear}`
  );

  const response = await fetch(
    "https://api.evervault.com/payments/3ds-sessions",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credential}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        card: {
          number: cardNumber,
          expiry: {
            month: expiryMonth,
            year: expiryYear,
          },
        },
        merchant: {
          name: "Ollivanders Wand Shop",
          website: "https://www.ollivanders.co.uk",
          categoryCode: "5945",
          country: "ie",
        },
        acquirer: {
          bin: "414141",
          merchantIdentifier: "18463590293743",
          country: "ie",
        },
        payment: {
          type: "one-off",
          amount: 12300,
          currency: "eur",
        },
      }),
    }
  );

  if (!response.ok) {
    const payload = await response.json();
    logger.error(payload, "Failed to create 3DS session");
    return {
      status: "failure",
      error: payload,
    };
  }

  const payload = await response.json();
  logger.info("3DS session created", payload);
  const { id: sessionId } = payload;
  return {
    status: "success",
    session: {
      id: sessionId,
    },
  };
}

const app = express();
app.use(express.json());
app.use(pinoHttp(logger));

app.post("/3ds-session", (req, res) => {
  const { cardNumber, expiryMonth, expiryYear } = req.body;

  return create3DSecureSession({
    cardNumber,
    expiryMonth,
    expiryYear,
  })
    .then((response) =>
      res.status(response.status === "success" ? 201 : 500).json(response)
    )
    .catch((err) =>
      res.status(500).json({
        status: "failure",
        error: {
          message: err.message,
        },
      })
    );
});

app.listen(EV_PORT ?? 8008, () => {
  logger.debug(`Listening on ${EV_PORT ?? 8008}`);
});
