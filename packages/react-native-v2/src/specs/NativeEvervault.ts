import { TurboModule, TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  initialize(teamId: string, appId: string): Promise<void>;
  encryptString(data: string): Promise<string>;
  encryptNumber(data: number): Promise<string>;
  encryptBoolean(data: boolean): Promise<string>;
  encryptObject(data: Object): Promise<Object>;
  encryptArray(data: Array<any>): Promise<Array<any>>;
}

export const NativeEvervault = TurboModuleRegistry.get<Spec>(
  "NativeEvervault"
) as Spec | null;
