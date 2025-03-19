import { TurboModule, TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  /**
   * Initialize the Evervault SDK.
   *
   * @param teamId - The team ID.
   * @param appId - The app ID.
   *
   * @returns A unique identifier for the SDK instance.
   */
  initialize(teamId: string, appId: string): string;

  /**
   * Encrypt a string.
   *
   * @param instanceId - The unique identifier for the SDK instance.
   * @param data - The string to encrypt.
   *
   * @returns The encrypted string.
   */
  encryptString(instanceId: string, data: string): Promise<string>;

  /**
   * Encrypt a number.
   *
   * @param instanceId - The unique identifier for the SDK instance.
   * @param data - The number to encrypt.
   *
   * @returns The encrypted number.
   */
  encryptNumber(instanceId: string, data: number): Promise<string>;

  /**
   * Encrypt a boolean.
   *
   * @param instanceId - The unique identifier for the SDK instance.
   * @param data - The boolean to encrypt.
   *
   * @returns The encrypted boolean.
   */
  encryptBoolean(instanceId: string, data: boolean): Promise<string>;

  /**
   * Encrypt an object.
   *
   * @param instanceId - The unique identifier for the SDK instance.
   * @param data - The object to encrypt.
   *
   * @returns The encrypted object.
   */
  encryptObject(instanceId: string, data: Object): Promise<Object>;

  /**
   * Encrypt an array.
   *
   * @param instanceId - The unique identifier for the SDK instance.
   * @param data - The array to encrypt.
   *
   * @returns The encrypted array.
   */
  encryptArray(instanceId: string, data: Array<any>): Promise<Array<any>>;
}

export const NativeEvervault = TurboModuleRegistry.get<Spec>(
  "NativeEvervault"
) as Spec | null;
