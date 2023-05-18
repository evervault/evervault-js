export function utf8StringToUint8Array(str: string) {
    const utf8Encoder = new TextEncoder();
    return utf8Encoder.encode(str);
  }
  
  export function uint8ArrayToUtf8String(arr: Uint8Array) {
    const utf8Decoder = new TextDecoder();
    return utf8Decoder.decode(arr);
  }
  
  export function hexStringToUint8Array(hex: string) {
    const length = hex.length / 2;
    const result = new Uint8Array(length);
  
    for (let i = 0; i < length; i++) {
      const byte = parseInt(hex.substr(i * 2, 2), 16);
      result[i] = byte;
    }
  
    return result;
  }
  
  export function uint8ArrayToHexString(arr: Uint8Array) {
    return Array.from(arr)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  
  export function base64StringToUint8Array(base64: string) {
    const binaryStr = window.atob(base64);
    const length = binaryStr.length;
    const result = new Uint8Array(length);
  
    for (let i = 0; i < length; i++) {
      result[i] = binaryStr.charCodeAt(i);
    }
  
    return result;
  }
  
  export function uint8ArrayToBase64String(arr: Uint8Array) {
    const binaryStr = Array.from(arr)
      .map((byte) => String.fromCharCode(byte))
      .join("");
  
    return window.btoa(binaryStr);
  }
  