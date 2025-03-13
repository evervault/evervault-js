import {
  NativeEvervault,
  Spec as NativeEvervaultSpec,
} from "./specs/NativeEvervault";

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

function getModule(): NativeEvervaultSpec {
  if (!NativeEvervault) {
    throw new Error("NativeEvervault is not available.");
  }

  return NativeEvervault;
}

export const sdk = {
  verify() {
    getModule();
    return true;
  },

  initialize(teamId: string, appId: string) {
    const evervault = getModule();

    if (!teamId) {
      throw new Error("Team ID is required.");
    }

    if (!appId) {
      throw new Error("App ID is required.");
    }

    evervault.initialize(teamId, appId);
  },

  async encrypt<T>(data: T): Promise<Encrypted<T>> {
    const evervault = getModule();

    if (data === undefined) {
      return undefined as any;
    } else if (data === null) {
      return null as any;
    } else if (typeof data === "string") {
      return (await evervault.encryptString(data)) as any;
    } else if (typeof data === "number") {
      return (await evervault.encryptNumber(data)) as any;
    } else if (typeof data === "boolean") {
      return (await evervault.encryptBoolean(data)) as any;
    } else if (Array.isArray(data)) {
      return (await evervault.encryptArray(data)) as any;
    } else if (typeof data === "object") {
      return (await evervault.encryptObject(data)) as any;
    }

    throw new Error("Unsupported data type.");
  },
};
