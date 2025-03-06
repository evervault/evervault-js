import { RNEvervault, RNEvervaultSpec } from "./specs/RNEvervault";

function getModule(): RNEvervaultSpec {
  if (!RNEvervault) {
    throw new Error("RNEvervault is not available.");
  }

  return RNEvervault;
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

  async encrypt(data: string) {
    const evervault = getModule();
    return evervault.encrypt(data);
  },
};
