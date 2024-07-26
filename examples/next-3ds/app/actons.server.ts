"use server";

import { redirect } from "next/navigation";

interface SessionObject {
  id: string;
  cryptogram: string | null;
}

export async function createThreeDSSession(): Promise<string> {
  const merchant = "merchant_e7c918074f44";

  const session = await evervaultAPI<SessionObject>(
    "POST",
    "/payments/3ds-sessions",
    {
      merchant,
      card: {
        number: "4111110116638871",
        expiry: {
          month: "11",
          year: "29",
        },
        cvc: "455",
      },
      payment: {
        amount: 100,
        currency: "eur",
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
