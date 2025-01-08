export interface MerchantDetail {
  id: string;
  name: string;
}

const API = import.meta.env.VITE_API_URL as string;

export async function getMerchant(app: string, merchantId: string) {
  const response = await fetch(`${API}/frontend/merchants/${merchantId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Evervault-App-Id": app,
    },
  });

  return response.json();
}
