import { Crypto } from "@peculiar/webcrypto";
import { File, Blob } from "web-file-polyfill";

export const setupCrypto = () => {
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

  class FileReaderPolyfill {
    constructor() {
      this.readAsArrayBuffer = () => {
        this.result = Buffer.from([0x00]);
        this.onloadend({});
      };
    }
  }

  Object.defineProperty(window, "FileReader", {
    value: FileReaderPolyfill,
    writable: true,
  });
};
