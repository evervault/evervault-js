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
    if (data === undefined) {
      return undefined as any;
    } else if (data === null) {
      return null as any;
    } else if (typeof data === "string") {
      return (await evervault.encryptString(instanceId, data)) as any;
    } else if (typeof data === "number") {
      return (await evervault.encryptNumber(instanceId, data)) as any;
    } else if (typeof data === "boolean") {
      return (await evervault.encryptBoolean(instanceId, data)) as any;
    } else if (Array.isArray(data)) {
      return (await evervault.encryptArray(instanceId, data)) as any;
    } else if (typeof data === "object") {
      return (await evervault.encryptObject(instanceId, data as any)) as any;
    }

    throw new Error("Unsupported data type.");
  },
};
