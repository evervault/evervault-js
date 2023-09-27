import { EncryptionSubConfig } from "../config";
import { uint8ArrayToBase64String, utf8StringToUint8Array } from "../encoding";
import {
  Datatypes,
  errors,
  concatUint8Arrays,
  ecPointCompress,
  crc32,
} from "../utils";

function generateBytes(byteLength: number): Uint8Array {
  const randomBytes = new Uint8Array(byteLength);
  if (window.crypto) {
    window.crypto.getRandomValues(randomBytes);
    return randomBytes;
  }
  throw new errors.CryptoError(
    "Your browser is outdated and does not support the Web Crypto API. Please upgrade it."
  );
}

function base64RemovePadding(str: string): string {
  return str.replace(/={1,2}$/, "");
}

async function formatEncryptedData(
  evVersion: string,
  datatype: string,
  keyIv: string,
  ecdhPublicKey: CryptoKey,
  encryptedData: string,
  isDebug: boolean
): Promise<string> {
  const evVersionPrefix = base64RemovePadding(
    uint8ArrayToBase64String(utf8StringToUint8Array(evVersion))
  );

  const exportableEcdhPublicKey = await window.crypto.subtle.exportKey(
    "raw",
    ecdhPublicKey
  );
  const compressedKey = ecPointCompress(exportableEcdhPublicKey);
  return `ev:${isDebug ? "debug:" : ""}${evVersionPrefix}${
    datatype !== "string" ? `:${datatype}` : ""
  }:${base64RemovePadding(keyIv)}:${base64RemovePadding(
    uint8ArrayToBase64String(compressedKey)
  )}:${base64RemovePadding(encryptedData)}:$`;
}

async function formatEncryptedFileOrBlob(
  keyIv: Uint8Array,
  ecdhPublicKey: CryptoKey,
  encryptedData: ArrayBuffer,
  isDebug: boolean
): Promise<Blob>;
async function formatEncryptedFileOrBlob(
  keyIv: Uint8Array,
  ecdhPublicKey: CryptoKey,
  encryptedData: ArrayBuffer,
  isDebug: boolean,
  fileName: string
): Promise<File>;
async function formatEncryptedFileOrBlob(
  keyIv: Uint8Array,
  ecdhPublicKey: CryptoKey,
  encryptedData: ArrayBuffer,
  isDebug: boolean,
  fileName?: string
) {
  const exportableEcdhPublicKey = await window.crypto.subtle.exportKey(
    "raw",
    ecdhPublicKey
  );

  const compressedKey = ecPointCompress(exportableEcdhPublicKey);
  const evEncryptedFileIdentifier = new Uint8Array([
    0x25, 0x45, 0x56, 0x45, 0x4e, 0x43,
  ]);
  const versionNumber = new Uint8Array([0x03]);
  const offsetToData = new Uint8Array([0x37, 0x00]);
  const flags = isDebug ? new Uint8Array([0x01]) : new Uint8Array([0x00]);

  const data = concatUint8Arrays([
    evEncryptedFileIdentifier,
    versionNumber,
    offsetToData,
    compressedKey,
    keyIv,
    flags,
    new Uint8Array(encryptedData),
  ]);

  const crc32Hash = crc32(data);

  // Convert crc32Hash to little endian Uint8Array
  const crc32HashArray = new Uint8Array([
    crc32Hash & 0xff,
    (crc32Hash >> 8) & 0xff,
    (crc32Hash >> 16) & 0xff,
    (crc32Hash >> 24) & 0xff,
  ]);

  const finalData = concatUint8Arrays([data, crc32HashArray]);

  if (fileName != null) {
    return new File([finalData], fileName, {
      type: "application/octet-stream",
    });
  }
  return new Blob([finalData], {
    type: "application/octet-stream",
  });
}

export class CoreCrypto {
  readonly #ecdhTeamKey: Uint8Array;
  readonly #ecdhPublicKey: CryptoKey;
  readonly #derivedSecret: ArrayBuffer;
  readonly #config: EncryptionSubConfig;
  readonly #isDebug: boolean;

  constructor(
    ecdhTeamKey: Uint8Array,
    ecdhPublicKey: CryptoKey,
    derivedSecret: ArrayBuffer,
    config: EncryptionSubConfig,
    isDebug: boolean
  ) {
    this.#ecdhTeamKey = ecdhTeamKey;
    this.#ecdhPublicKey = ecdhPublicKey;
    this.#derivedSecret = derivedSecret;
    this.#isDebug = isDebug;
    this.#config = config;
  }

  async #encryptObject(
    data: Datatypes.EncryptableObject
  ): Promise<Datatypes.EncrypedObject> {
    return this.#traverseObject({
      ...data,
    });
  }

  async #encryptFile(dataContainer: File): Promise<File>;
  async #encryptFile(dataContainer: Blob): Promise<Blob>;
  async #encryptFile(dataContainer: File | Blob) {
    if (dataContainer.size > this.#config.maxFileSizeInBytes) {
      throw new errors.ExceededMaxFileSizeError(
        `File size must be less than ${this.#config.maxFileSizeInMB}MB`
      );
    }
    const keyIv = generateBytes(this.#config.ivLength);

    const derivedSecretImported = await window.crypto.subtle.importKey(
      "raw",
      this.#derivedSecret,
      {
        name: "AES-GCM",
      },
      true,
      ["encrypt"]
    );

    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();

      reader.onloadend = (_event) => {
        const readerResult = reader.result;
        if (readerResult == null || typeof readerResult === "string") {
          // No idea why we dont just reject an error
          // eslint-disable-next-line prefer-promise-reject-errors
          reject({
            error: "Failed to read file to be encrypted",
          });
          return;
        }

        void window.crypto.subtle
          .encrypt(
            {
              name: "AES-GCM",
              iv: keyIv,
              tagLength: this.#config.authTagLength,
              additionalData: this.#ecdhTeamKey,
            },
            derivedSecretImported,
            readerResult
          )
          .then((encrypted) => {
            if (dataContainer instanceof File) {
              resolve(
                formatEncryptedFileOrBlob(
                  keyIv,
                  this.#ecdhPublicKey,
                  encrypted,
                  this.#isDebug,
                  dataContainer.name
                )
              );
            } else {
              resolve(
                formatEncryptedFileOrBlob(
                  keyIv,
                  this.#ecdhPublicKey,
                  encrypted,
                  this.#isDebug
                )
              );
            }
          });
      };

      reader.readAsArrayBuffer(dataContainer);
    });
  }

  async #encryptString(str: string, datatype: string): Promise<string> {
    const keyIv = generateBytes(this.#config.ivLength);

    const derivedSecretImported = await window.crypto.subtle.importKey(
      "raw",
      this.#derivedSecret,
      {
        name: "AES-GCM",
      },
      true,
      ["encrypt"]
    );

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: keyIv,
        tagLength: this.#config.authTagLength,
        additionalData: this.#ecdhTeamKey,
      },
      derivedSecretImported,
      utf8StringToUint8Array(str)
    );

    return formatEncryptedData(
      this.#config.evVersion,
      datatype,
      uint8ArrayToBase64String(keyIv),
      this.#ecdhPublicKey,
      uint8ArrayToBase64String(new Uint8Array(encryptedBuffer)),
      this.#isDebug
    );
  }

  // Use unknown in interal methods
  async #traverseObject(
    data: Datatypes.EncryptableObject
  ): Promise<Datatypes.EncrypedObject>;

  async #traverseObject(
    data: Datatypes.EncryptableValue[]
  ): Promise<Datatypes.EncryptedValue[]>;

  async #traverseObject(data: Datatypes.EncryptableAsString): Promise<string>;
  async #traverseObject(
    data: Datatypes.EncryptableValue
  ): Promise<Datatypes.EncryptedValue>;

  async #traverseObject(data: unknown) {
    if (Datatypes.isEncryptableAsString(data)) {
      return this.#encryptString(
        Datatypes.ensureString(data),
        Datatypes.getHeaderType(data)
      );
    }
    if (Datatypes.isObjectStrict(data)) {
      const encryptedObject = { ...data };
      /* eslint-disable no-await-in-loop */
      for (const [key, value] of Object.entries(encryptedObject)) {
        encryptedObject[key] = await this.#traverseObject(value);
      }
      /* eslint-enable no-await-in-loop */
      return encryptedObject;
    }
    if (Datatypes.isArray(data)) {
      const encryptedArray = [...data];
      return Promise.all(
        encryptedArray.map(async (value) => this.#traverseObject(value))
      );
    }
    return data;
  }

  async encrypt(
    data: unknown
  ): Promise<
    | string
    | Blob
    | File
    | Datatypes.EncryptedValue
    | Datatypes.EncryptedValue[]
    | Datatypes.EncrypedObject
  > {
    if (!Datatypes.isDefined(data)) {
      throw new Error("Data must not be undefined");
    }

    if (Datatypes.isFile(data)) {
      return this.#encryptFile(data);
    }

    if (Datatypes.isObjectStrict(data)) {
      return this.#encryptObject(data);
    }

    if (Datatypes.isArray(data)) {
      return this.#traverseObject([...data]);
    }
    if (Datatypes.isEncryptableAsString(data)) {
      return this.#encryptString(
        Datatypes.ensureString(data),
        Datatypes.getHeaderType(data)
      );
    }
    throw new Error("Data supplied is not encryptable");
  }
}
