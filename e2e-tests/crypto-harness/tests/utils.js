import { createECDH, createHash } from "node:crypto";

function generateEcdhKeyPair(curve) {
  const ecdh = createECDH(curve);
  ecdh.generateKeys();
  return {
    uncompressedPublicKey: ecdh.getPublicKey(null, "uncompressed"),
    publicKey: ecdh.getPublicKey(null, "compressed"),
    privateKey: ecdh.getPrivateKey(null, "compressed"),
  };
}

export function generateKeyPairs() {
  const koblitzKeys = generateEcdhKeyPair("secp256k1");
  const r1Keys = generateEcdhKeyPair("prime256v1");

  return {
    publicKeys: {
      ecdhKey: koblitzKeys.publicKey.toString("base64"),
      ecdhP256Key: r1Keys.publicKey.toString("base64"),
      ecdhP256KeyUncompressed: r1Keys.uncompressedPublicKey.toString("base64"),
    },
    privateKeys: {
      ecdhPrivateKey: koblitzKeys.privateKey,
      ecdhP256PrivateKey: r1Keys.privateKey,
    },
  };
}
