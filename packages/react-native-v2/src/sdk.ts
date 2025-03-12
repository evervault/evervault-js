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
  : T extends object
  ? {
      [K in keyof T]: Encrypted<T[K]>;
    }
  : T extends Array<infer U>
  ? Array<Encrypted<U>>
  : unknown;

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

  async initialize(
    teamId: string,
    appId: string,
    options?: { signal?: AbortSignal }
  ) {
    const evervault = getModule();

    if (!teamId) {
      throw new Error("Team ID is required.");
    }

    if (!appId) {
      throw new Error("App ID is required.");
    }

    await evervault.initialize(teamId, appId);

    if (options?.signal?.aborted) {
      throw new Error("Initialization aborted.");
    }
  },

  async encrypt<T>(data: T) {
    const evervault = getModule();
    if (data === undefined) {
      return undefined as Encrypted<T>;
    } else if (data === null) {
      return null as Encrypted<T>;
    } else if (typeof data === "string") {
      return await evervault.encryptString(data);
    } else if (typeof data === "number") {
      return await evervault.encryptNumber(data);
    } else if (typeof data === "boolean") {
      return await evervault.encryptBoolean(data);
    } else if (Array.isArray(data)) {
      return (await evervault.encryptArray(data)) as Encrypted<T>;
    } else if (typeof data === "object") {
      return (await evervault.encryptObject(data)) as Encrypted<T>;
    } else {
      throw new Error("Unsupported data type.");
    }
  },
};
