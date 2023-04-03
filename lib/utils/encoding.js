/**
 *
 * @param {string} str
 * @returns {Uint8Array}
 */
export function utf8StringToUint8Array(str) {
  const utf8Encoder = new TextEncoder();
  return utf8Encoder.encode(str);
}

/**
 *
 * @param {Uint8Array} arr
 * @returns {string}
 */
export function uint8ArrayToUtf8String(arr) {
  const utf8Decoder = new TextDecoder();
  return utf8Decoder.decode(arr);
}

/**
 *
 * @param {string} hex
 * @returns {Uint8Array}
 */
export function hexStringToUint8Array(hex) {
  const length = hex.length / 2;
  const result = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    const byte = parseInt(hex.substr(i * 2, 2), 16);
    result[i] = byte;
  }

  return result;
}

/**
 *
 * @param {Uint8Array} arr
 * @returns {string}
 */
export function uint8ArrayToHexString(arr) {
  return Array.from(arr)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 *
 * @param {string} base64
 * @returns {Uint8Array}
 */
export function base64StringToUint8Array(base64) {
  const binaryStr = window.atob(base64);
  const length = binaryStr.length;
  const result = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    result[i] = binaryStr.charCodeAt(i);
  }

  return result;
}

/**
 *
 * @param {Uint8Array} arr
 * @returns {string}
 */
export function uint8ArrayToBase64String(arr) {
  const binaryStr = Array.from(arr)
    .map((byte) => String.fromCharCode(byte))
    .join("");

  return window.btoa(binaryStr);
}
