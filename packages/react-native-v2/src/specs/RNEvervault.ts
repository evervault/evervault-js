import { TurboModule, TurboModuleRegistry } from "react-native";

export interface RNEvervaultSpec extends TurboModule {
  initialize(teamId: string, appId: string): Promise<void>;
  encrypt(data: string): Promise<string>;
}

export const RNEvervault = TurboModuleRegistry.get<RNEvervaultSpec>(
  "RNEvervault"
) as RNEvervaultSpec | null;
