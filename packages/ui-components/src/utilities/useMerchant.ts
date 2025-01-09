import { MerchantDetail } from "types";

const API = import.meta.env.VITE_API_URL as string;

export async function getMerchant(
  app: string,
  merchantId: string
): Promise<MerchantDetail | undefined> {
  const response = await fetch(`${API}/frontend/merchants/${merchantId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Evervault-App-Id": app,
    },
  });

  if (!response.ok) {
    console.error(
      `Failed to fetch merchant details for ${merchantId}`,
      response.status
    );
    return undefined;
  }

  return response.json() as Promise<MerchantDetail>;
}
