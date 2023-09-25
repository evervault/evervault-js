import { Crypto } from "@peculiar/webcrypto";
import { File, Blob } from "@web-std/file";

export function setupCrypto(): void {
  const crypto = new Crypto();

  Object.defineProperty(window, "crypto", {
    value: crypto,
    writable: true,
  });

  Object.defineProperty(window, "File", {
    value: File,
    writable: true,
  });

  Object.defineProperty(window, "Blob", {
    value: Blob,
    writable: true,
  });

  /* eslint-disable  class-methods-use-this */
  class FileReaderPolyfill {
    result?: Buffer;
    onloadend = (_: unknown) => ({});
    readAsArrayBuffer() {
      this.result = Buffer.from([0x00]);
      this.onloadend({});
    }
  }

  Object.defineProperty(window, "FileReader", {
    value: FileReaderPolyfill,
    writable: true,
  });
}
