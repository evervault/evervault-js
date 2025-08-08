import {
  Integer,
  ObjectIdentifier,
  Sequence,
  BitString,
  OctetString,
} from "asn1js";
import { hexStringToUint8Array } from "../encoding";
import { type TP256Constants } from "./p256";

const PUBLIC_KEY_TYPE = "1.2.840.10045.2.1";
const PRIME_FIELD = "1.2.840.10045.1.1";
const VERSION = "01";

const FieldId = (curveParams: TP256Constants) =>
  new Sequence({
    name: "fieldID",
    value: [
      new ObjectIdentifier({
        name: "fieldType",
        value: PRIME_FIELD,
      }),
      new Integer({
        name: "parameters",
        // Theres a specific rule this library doesn't seem to implement for Integer:
        // If the first byte is 0x80 or greater, the number is considered negative so we add a '00' prefix if the 0x80 bit is set
        // We need to manually add the 0x00 prefix to the value to make the library work as the first byte of 'p' is > 0x80
        valueHex: new Uint8Array([0, ...hexStringToUint8Array(curveParams.p)])
          .buffer,
      }),
    ],
  });

const Curve = (curveParams: TP256Constants) =>
  new Sequence({
    name: "curve",
    value: [
      new OctetString({
        name: "a",
        valueHex: new Uint8Array(hexStringToUint8Array(curveParams.a)).buffer,
      }),
      new OctetString({
        name: "b",
        valueHex: new Uint8Array(hexStringToUint8Array(curveParams.b)).buffer,
      }),
      new BitString({
        optional: true,
        name: "seed",
        valueHex: curveParams.seed
          ? new Uint8Array(hexStringToUint8Array(curveParams.seed)).buffer
          : (curveParams.seed as unknown as ArrayBuffer),
      }),
    ],
  });

const ECParameters = (curveParams: TP256Constants) =>
  new Sequence({
    name: "ecParameters",
    value: [
      new Integer({
        name: "version",
        valueHex: new Uint8Array(hexStringToUint8Array(VERSION)).buffer,
      }),
      FieldId(curveParams),
      Curve(curveParams),
      new OctetString({
        name: "base",
        valueHex: new Uint8Array(hexStringToUint8Array(curveParams.generator))
          .buffer,
      }),
      new Integer({
        name: "order",
        // Theres a specific rule this library doesn't seem to implement for Integer:
        // If the first byte is 0x80 or greater, the number is considered negative so we add a '00' prefix if the 0x80 bit is set
        // We need to manually add the 0x00 prefix to the value to make the library work as the first byte of 'n' is > 0x80
        valueHex: new Uint8Array([0, ...hexStringToUint8Array(curveParams.n)])
          .buffer,
      }),
      new Integer({
        optional: true,
        name: "cofactor",
        valueHex: new Uint8Array(hexStringToUint8Array(curveParams.h)).buffer,
      }),
    ],
  });

const AlgorithmIdentifier = (curveParams: TP256Constants) =>
  new Sequence({
    name: "algorithm",
    value: [
      new ObjectIdentifier({
        name: "algorithm",
        value: PUBLIC_KEY_TYPE,
      }),
      ECParameters(curveParams),
    ],
  });

const SubjectPublicKeyInfo = (
  curveParams: TP256Constants,
  decompressedKey: string
) =>
  new Sequence({
    name: "SubjectPublicKeyInfo",
    value: [
      AlgorithmIdentifier(curveParams),
      new BitString({
        name: "subjectPublicKey",
        valueHex: new Uint8Array(hexStringToUint8Array(decompressedKey)).buffer,
      }),
    ],
  });

export default function buildEncoder(curveParams: TP256Constants) {
  /**
   * @param {string} decompressedKey
   * */
  return (decompressedKey: string) => {
    const spki = SubjectPublicKeyInfo(curveParams, decompressedKey);
    return hexStringToUint8Array(spki.toString("hex"));
  };
}
