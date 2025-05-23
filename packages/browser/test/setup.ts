import { Crypto } from "@peculiar/webcrypto";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { File as WebFile, Blob as WebBlob } from "@web-std/file";

export function setupCrypto(): void {
  const crypto = new Crypto();

  Object.defineProperty(window, "crypto", {
    value: crypto,
    writable: true,
  });

  Object.defineProperty(window, "File", {
    value: WebFile as File,
    writable: true,
  });

  Object.defineProperty(window, "Blob", {
    value: WebBlob as Blob,
    writable: true,
  });

  class FileReaderPolyfill {
    result?: Buffer;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
