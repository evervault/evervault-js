import { sdk } from "./sdk";

export const verifyInstallation = sdk.verify;

export type { Encrypted } from "./sdk";

export {
  EvervaultProvider,
  type EvervaultProviderProps,
} from "./EvervaultProvider";

export type { EncryptFn } from "./context";
export { useEvervault } from "./useEvervault";

export type {
  EvervaultInput,
  BaseEvervaultInputProps as EvervaultInputProps,
} from "./Input";

export * from "./Card";
export * from "./ThreeDSecure";
export * from './ApplePayButton';
