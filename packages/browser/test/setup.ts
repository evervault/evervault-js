import { Crypto } from "@peculiar/webcrypto";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// import { File as WebFile, Blob as WebBlob } from "@web-std/file";
import { File, Blob } from "node:buffer";

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
