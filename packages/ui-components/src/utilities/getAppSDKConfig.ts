import { AppSDKConfig } from "types";

const API = import.meta.env.VITE_API_URL as string;

export function getDefaultAppSDKConfig(): AppSDKConfig {
  return {
    is_sandbox: false,
  };
}

export async function getAppSDKConfig(app: string): Promise<AppSDKConfig> {
  try {
    const response = await fetch(`${API}/frontend/sdk/config`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Evervault-App-Id": app,
      },
    });

    if (response.ok) {
      return response.json() as Promise<AppSDKConfig>;
    }

    console.error(`Failed to fetch app SDK config details for ${app}`);
  } catch (error) {
    console.error(`Failed to fetch app SDK config details for ${app}`, error);
  }
  return getDefaultAppSDKConfig();
}
