import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package '@evervault/evervault-react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

export const EvervaultSdk = NativeModules.EvervaultSdk
  ? NativeModules.EvervaultSdk
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );
