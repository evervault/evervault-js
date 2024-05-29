import { Platform } from 'react-native';
import { EvervaultSdk } from './native';

export async function init(teamUuid: string, appUuid: string): Promise<void> {
  if (!teamUuid.startsWith('team_')) {
    throw new Error("Invalid Evervault Team UUID");
  }

  if (!appUuid.startsWith('app_')) {
    throw new Error("Invalid Evervault App UUID");
  }

  return EvervaultSdk.initialize(teamUuid, appUuid);
}

export async function encrypt(data: any): Promise<string> {
  if (Platform.OS === 'android' && typeof data !== 'string') {
    throw new Error(`The Evervault SDK does not currently support encrypting non-string data on Android.
      If this is required for your use case, please get in touch with us at support@evervault.com. Please do not
      serialize other data types to strings and pass them to this method as this will result in the data
      type being returned in it's stringified form when decryption occurs.`);
  }

  return EvervaultSdk.encrypt(data);
}
