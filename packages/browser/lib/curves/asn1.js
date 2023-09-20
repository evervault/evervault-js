//
// A dumbed-down, minimal ASN.1 packer
//

// Almost every ASN.1 type that's important for CSR
// can be represented generically with only a few rules.
function ASN1(/* type, hexstrings... */) {
  const args = Array.prototype.slice.call(arguments);
  const typ = args.shift();
  const str = args.join("").replace(/\s+/g, "").toLowerCase();
  let len = str.length / 2;
  let lenlen = 0;
  let hex = typ;

  // We can't have an odd number of hex chars
  if (len !== Math.round(len)) {
    throw new Error("invalid hex");
  }

  // The first byte of any ASN.1 sequence is the type (Sequence, Integer, etc)
  // The second byte is either the size of the value, or the size of its size
  // 1. If the second byte is < 0x80 (128) it is considered the size
  // 2. If it is > 0x80 then it describes the number of bytes of the size
  //    ex: 0x82 means the next 2 bytes describe the size of the value
  // 3. The special case of exactly 0x80 is "indefinite" length (to end-of-file)
  if (len > 127) {
    lenlen += 1;
    while (len > 255) {
      lenlen += 1;
      len >>= 8;
    }
  }

  if (lenlen) {
    hex += ASN1.numToHex(0x80 + lenlen);
  }
  return hex + ASN1.numToHex(str.length / 2) + str;
}

// The Integer type has some special rules
ASN1.UInt = function UINT() {
  let str = Array.prototype.slice.call(arguments).join("");
  const first = parseInt(str.slice(0, 2), 16);

  // If the first byte is 0x80 or greater, the number is considered negative
  // Therefore we add a '00' prefix if the 0x80 bit is set
  if (0x80 & first) {
    str = `00${str}`;
  }

  return ASN1("02", str);
};

// The Bit String type also has a special rule
ASN1.BitStr = function BITSTR() {
  const str = Array.prototype.slice.call(arguments).join("");
  // '00' is a mask of how many bits of the next byte to ignore
  return ASN1("03", `00${str}`);
};

ASN1.numToHex = function (d) {
  d = d.toString(16);
  if (d.length % 2) {
    return `0${d}`;
  }
  return d;
};

export default ASN1;
