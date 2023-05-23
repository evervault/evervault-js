const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[i] = c;
}

export default function crc32(buffer: Uint8Array): number {
  let crc = 0xffffffff;
  const len = buffer.byteLength;

  for (let i = 0; i < len; i++) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }

  return crc ^ 0xffffffff;
}
