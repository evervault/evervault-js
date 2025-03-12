import { TurboModule, TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  initialize(teamId: string, appId: string): Promise<void>;
  encrypt(data: string): Promise<string>;
}

export const NativeEvervault = TurboModuleRegistry.get<Spec>(
  "NativeEvervault"
) as Spec | null;
