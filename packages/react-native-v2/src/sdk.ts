import { NitroModules } from "react-native-nitro-modules";
import { EvervaultSdk } from "./nitro/EvervaultSdk.nitro";

const evervault = NitroModules.createHybridObject<EvervaultSdk>("EvervaultSdk");

export type Encrypted<T> = T extends undefined
  ? undefined
  : T extends null
  ? null
  : T extends string | number | boolean
  ? string
  : T extends Function
  ? never
  : T extends object
  ? {
      [K in keyof T]: Encrypted<T[K]>;
    }
  : T extends Array<infer U>
  ? Array<Encrypted<U>>
  : never;

export const sdk = {
  verify() {
    return true;
  },

  initialize(teamId: string, appId: string): string {
    if (!teamId) {
      throw new Error("Team ID is required.");
    }

    if (!appId) {
      throw new Error("App ID is required.");
    }

    return evervault.initialize(teamId, appId);
  },

  async encrypt<T>(instanceId: string, data: T): Promise<Encrypted<T>> {
    if (typeof data === "undefined") {
      return undefined as any;
    } else if (data === null) {
      return null as any;
    }

    const json = JSON.stringify(data);
    const encryptedJson = await evervault.encrypt(instanceId, json);
    return JSON.parse(encryptedJson);
  },
};
