/**
 * To compress - record the sign of the `y` point
 * then remove the `y` point and encode the recorded
 * sign in the first bit
 * */
export default function ecPointCompress(
  ecdhRawPublicKey: ArrayBuffer
): Uint8Array {
  const u8full = new Uint8Array(ecdhRawPublicKey);
  const len = u8full.byteLength;
  const u8 = u8full.slice(0, (1 + len) >>> 1); // drop `y`
  u8[0] = 0x2 | (u8full[len - 1] & 0x01); // encode sign of `y` in first bit
  return u8;
}
