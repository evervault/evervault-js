import { AnyMap, HybridObject } from "react-native-nitro-modules";

interface EvervaultSdk
  extends HybridObject<{ ios: "swift"; android: "kotlin" }> {
  initialize(teamId: string, appId: string): string;
  encryptString(instanceId: string, data: string): Promise<string>;
  encryptNumber(instanceId: string, data: number): Promise<string>;
  encryptBoolean(instanceId: string, data: boolean): Promise<string>;
  encryptObject(instanceId: string, data: AnyMap): Promise<AnyMap>;
  encryptArray(instanceId: string, data: AnyMap[]): Promise<AnyMap[]>;
}

export type { EvervaultSdk };
