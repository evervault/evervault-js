import { AppSDKConfig } from "types";

export function getDefaultAppSDKConfig(): AppSDKConfig {
  return {
    is_sandbox: false,
  };
}

export async function getAppSDKConfig(
  app: string,
  apiUrl: string
): Promise<AppSDKConfig> {
  try {
    const response = await fetch(`${apiUrl}/frontend/sdk/config`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Evervault-App-Id": app,
      },
    });

    if (response.ok) {
      return (await response.json()) as AppSDKConfig;
    }

    console.error(`Failed to fetch app SDK config details for ${app}`);
  } catch (error) {
    console.error(`Failed to fetch app SDK config details for ${app}`, error);
  }
  return getDefaultAppSDKConfig();
}
