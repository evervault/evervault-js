import {
  base64StringToUint8Array,
  uint8ArrayToBase64String,
} from "../encoding";
import ecPointCompress from "./ecPointCompress";
import type { KeyConfig } from "../config";

export interface CageKey {
  ecdhP256KeyUncompressed: string;
  ecdhP256Key: string;
  readonly isDebugMode: false;
}

export default function buildCageKeyFromSuppliedPublicKey(
  publicKey: string
): CageKey {
  const compressedKey = ecPointCompress(base64StringToUint8Array(publicKey));
  const compressedKeyString = uint8ArrayToBase64String(
    new Uint8Array(compressedKey)
  );
  return {
    ecdhP256KeyUncompressed: publicKey,
    ecdhP256Key: compressedKeyString,
    isDebugMode: false,
  } satisfies KeyConfig;
}
