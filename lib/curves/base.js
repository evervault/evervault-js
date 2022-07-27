const ASN1 = require("../utils/asn1");

/**
 * Given an EC curve name and its constants, generate a DER encoder for its compressed public keys
 * @param curveName
 * @param curveValues
 * @returns Function(decompressedPublicKey): base64EncodedString
 */
const createCurve = (curveName, curveValues) => {
  const asn1Encoder = buildEncoder(curveValues);
  return (decompressedPublicKey) => {
    return asn1Encoder(
      Buffer.from(decompressedPublicKey, "base64").toString("hex")
    );
  };
};

const buildEncoder = ({ p, a, b, seed, generator, n, h }) => {
  return (decompressedKey) => {
    const hexEncodedKey = ASN1(
      "30",
      ASN1(
        "30",
        // 1.2.840.10045.2.1 ecPublicKey
        // (ANSI X9.62 public key type)
        ASN1("06", "2A 86 48 CE 3D 02 01"),
        ASN1(
          "30",
          // ECParameters Version
          ASN1.UInt("01"),
          ASN1(
            "30",
            // X9.62 Prime Field
            ASN1("06", "2A 86 48 CE 3D 01 01"),
            // curve p value
            ASN1.UInt(p)
          ),
          ASN1(
            "30",
            // curve a value
            ASN1("04", a),
            // curve b value
            ASN1("04", b),
            // curve seed value
            ASN1.BitStr(seed)
          ),
          // curve generate point in decompressed form
          ASN1("04", generator),
          // curve n value
          ASN1.UInt(n),
          // curve h value
          ASN1.UInt(h)
        )
      ),
      // decompressed public key
      ASN1.BitStr(decompressedKey)
    );

    return Buffer.from(hexEncodedKey, "hex");
  };
};

module.exports = {
  createCurve,
};
