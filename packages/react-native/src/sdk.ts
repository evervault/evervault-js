import { EvervaultSdk } from "./native";

export async function init(teamUuid: string, appUuid: string): Promise<void> {
  return EvervaultSdk.initialize(teamUuid, appUuid);
}

export async function encrypt(data: any): Promise<string> {
  return EvervaultSdk.encrypt(data);
}
