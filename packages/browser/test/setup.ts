import { Crypto } from "@peculiar/webcrypto";

import { TextDecoder, TextEncoder } from "node:util";
import { ReadableStream, TransformStream } from "node:stream/web";

import { Blob, File } from "node:buffer";
import { fetch, Headers, FormData, Request, Response } from "undici";

export function setupCrypto(): void {
  Object.defineProperties(globalThis, {
    TextDecoder: { value: TextDecoder },
    TextEncoder: { value: TextEncoder },
    ReadableStream: { value: ReadableStream },
    TransformStream: { value: TransformStream },
  });

  Object.defineProperties(globalThis, {
    fetch: { value: fetch, writable: true },
    Blob: { value: Blob },
    File: { value: File },
    Headers: { value: Headers },
    FormData: { value: FormData },
    Request: { value: Request },
    Response: { value: Response },
  });

  const crypto = new Crypto();

  Object.defineProperty(window, "crypto", {
    value: crypto,
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
