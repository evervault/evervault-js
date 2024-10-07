import { File, Blob } from "node:buffer";
import { Crypto } from "@peculiar/webcrypto";

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
  result?: Buffer;
  onloadend = (_: unknown) => ({}); // eslint-disable-line @typescript-eslint/no-unused-vars
  readAsArrayBuffer() {
    this.result = Buffer.from([0x00]);
    this.onloadend({});
  }
}

Object.defineProperty(window, "FileReader", {
  value: FileReaderPolyfill,
  writable: true,
});
