"use server";

import { redirect } from "next/navigation";

interface SessionObject {
  id: string;
  cryptogram: string | null;
}

export async function createThreeDSSession(card: {
  cvc: string;
  number: string;
  expiry: {
    month: string;
    year: string;
  };
}): Promise<string> {
  const session = await evervaultAPI<SessionObject>(
    "POST",
    "/payments/3ds-sessions",
    {
      card,
      merchant: {
        name: "Test Merchant",
        website: "https://test-merchant.com",
        categoryCode: "4011",
        country: "ie",
      },
      payment: {
        type: "one-off",
        amount: 1000,
        currency: "eur",
        country: "ie",
      },
      acquirer: {
        bin: "444444",
        merchantIdentifier: "837223891854392",
        country: "ie",
      },
    }
  );

  return session.id;
}

export async function completePayment(id: string): Promise<void> {
  const session = await evervaultAPI<SessionObject>(
    "GET",
    `/payments/3ds-sessions/${id}`
  );

  console.log("Cryptogram:", session.cryptogram); // eslint-disable-line no-console

  // You can now use the cryptogram to authorize the payment with your payment provider.

  redirect("/success");
}

async function evervaultAPI<T>(
  method: string,
  path: string,
  payload?: object
): Promise<T> {
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

  return response.json() as Promise<T>;
}
