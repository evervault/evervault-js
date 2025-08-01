import { AppSDKConfig } from "types";

const API = import.meta.env.VITE_API_URL as string;

export function getDefaultAppSDKConfig(): AppSDKConfig {
  return {
    isSandbox: false,
  };
}

export async function getAppSDKConfig(app: string): Promise<AppSDKConfig> {
  const response = await fetch(`${API}/frontend/sdk/config`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Evervault-App-Id": app,
    },
  });

  if (!response.ok) {
    console.error(
      `Failed to fetch app SDK config details for ${app}`,
      response.status
    );
    return getDefaultAppSDKConfig();
  }

  return response.json() as Promise<AppSDKConfig>;
}
