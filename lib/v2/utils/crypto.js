const { P256 } = require("../curves");
const { arrayBufferToBase64 } = require("./datatypes");

// To compress - record the sign of the `y` point
// then remove the `y` point and encode the recorded
// sign in the first bit
const ecPointCompress = (ecdhRawPublicKey) => {
  const u8full = new Uint8Array(ecdhRawPublicKey);
  const len = u8full.byteLength;
  const u8 = u8full.slice(0, (1 + len) >>> 1); // drop `y`
  u8[0] = 0x2 | (u8full[len - 1] & 0x01); // encode sign of `y` in first bit
  return u8;
};

const deriveSharedSecret = async (ecdh, publicKey, ephemeralPublicKey) => {
  // Convert to a P256 `CryptoKey` object
  const importedPublicKey = await window.crypto.subtle.importKey(
    "raw",
    Buffer.from(publicKey, "base64"),
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
      length: "256",
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
  const concatSecret = Buffer.concat([
    Buffer.from(exportableSecret),
    Buffer.from([0x00, 0x00, 0x00, 0x01]),
    P256.encodePublicKey(arrayBufferToBase64(exportableEphemeralPublicKey)),
  ]);

  const hashDigest = await window.crypto.subtle.digest("SHA-256", concatSecret);
  return hashDigest;
};

module.exports = {
  deriveSharedSecret,
  ecPointCompress,
};
