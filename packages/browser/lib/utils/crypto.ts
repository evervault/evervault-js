import { P256 } from "../curves";
import concatUint8Arrays from "./concatUint8Arrays";
import { base64StringToUint8Array, uint8ArrayToBase64String } from "./encoding";

// To compress - record the sign of the `y` point
// then remove the `y` point and encode the recorded
// sign in the first bit
export function ecPointCompress(ecdhRawPublicKey: ArrayBuffer) {
  const u8full = new Uint8Array(ecdhRawPublicKey);
  const len = u8full.byteLength;
  const u8 = u8full.slice(0, (1 + len) >>> 1); // drop `y`
  u8[0] = 0x2 | (u8full[len - 1] & 0x01); // encode sign of `y` in first bit
  return u8;
}

export async function deriveSharedSecret(ecdh: CryptoKeyPair, publicKey: string, ephemeralPublicKey: CryptoKey) {
  // Convert to a P256 `CryptoKey` object
  const importedPublicKey = await window.crypto.subtle.importKey(
    "raw",
    base64StringToUint8Array(publicKey),
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );
  const secret = await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: importedPublicKey,
    },
    ecdh.privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Convert from `CryptoKey` object to an ArrayBuffer
  const exportableEphemeralPublicKey = await window.crypto.subtle.exportKey(
    "raw",
    ephemeralPublicKey
  );

  const exportableSecret = await window.crypto.subtle.exportKey("raw", secret);

  // run a kdf to protect the secret key
  // 1. practical: https://crypto.stackexchange.com/questions/48047/can-a-raw-ecdh-shared-secret-be-used-directly-for-encryption
  // 2. https://wiki.openssl.org/index.php/Elliptic_Curve_Diffie_Hellman

  // note that the KDF here is X9.63
  // the ephemeral public key is used to make
  // the scheme CCA2
  // https://www.tic.itefi.csic.es/CIBERDINE/Documetos/Cryptologia%20-%20Security%20and%20practical%20considerations%20when%20implementing%20ECIES%20-%20v1.0.pdf
  const concatSecret = concatUint8Arrays([
    new Uint8Array(exportableSecret),
    new Uint8Array([0x00, 0x00, 0x00, 0x01]),
    P256.encodePublicKey(
      uint8ArrayToBase64String(new Uint8Array(exportableEphemeralPublicKey))
    ),
  ]);

  const hashDigest = await window.crypto.subtle.digest("SHA-256", concatSecret);
  return hashDigest;
}

export async function buildCageKeyFromSuppliedPublicKey(publicKey: string) {
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
