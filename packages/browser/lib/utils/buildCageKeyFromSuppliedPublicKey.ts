
import {
  base64StringToUint8Array,
  uint8ArrayToBase64String,
} from "../encoding";
import ecPointCompress from "./ecPointCompress";

export default async function buildCageKeyFromSuppliedPublicKey(
  publicKey: string
): Promise<{
  ecdhP256KeyUncompressed: string;
  ecdhP256Key: string;
  isDebugMode: false;
}> {
  const compressedKey = ecPointCompress(base64StringToUint8Array(publicKey));
  const compressedKeyString = uint8ArrayToBase64String(
    new Uint8Array(compressedKey)
  );
  return {
    ecdhP256KeyUncompressed: publicKey,
    ecdhP256Key: compressedKeyString,
    isDebugMode: false,
  };
}
