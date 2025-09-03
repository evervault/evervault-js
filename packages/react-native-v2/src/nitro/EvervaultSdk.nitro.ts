import { HybridObject } from "react-native-nitro-modules";

interface EvervaultSdk
  extends HybridObject<{ ios: "swift"; android: "kotlin" }> {
  initialize(teamId: string, appId: string): string;
  encrypt(instanceId: string, json: string): Promise<string>;
}

export type { EvervaultSdk };
