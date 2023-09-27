import { base64StringToUint8Array, uint8ArrayToHexString } from "../encoding";
import buildEncoder from "./buildEncoder";
import type { TP256Constants } from "./p256";

/**
 * Given an EC curve name and its constants, generate a DER encoder for its compressed public keys
 * @param curveValues
 */
export default function createCurve(curveValues: TP256Constants) {
  const asn1Encoder = buildEncoder(curveValues);

  return (decompressedPublicKey: string) =>
    asn1Encoder(
      uint8ArrayToHexString(base64StringToUint8Array(decompressedPublicKey))
    );
}
