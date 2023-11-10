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

/**
 * Helper function to convert an offset size to a 2 byte little endian Uint8Array
 * @param number
 * @returns 2 byte little endian Uint8Array
 */
function numberToLittleEndianUint8Array(number: number) {
  // Create a Uint8Array with a length of 2 (assuming 16-bit integer).
  const byteArray = new Uint8Array(2);

  // Use bitwise operations to extract the bytes from the number.
  byteArray[0] = number & 0xff; // Least significant byte
  byteArray[1] = (number >> 8) & 0xff;

  return byteArray;
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
  fileName?: string,
  metadata?: Uint8Array
): Promise<File>;
async function formatEncryptedFileOrBlob(
  keyIv: Uint8Array,
  ecdhPublicKey: CryptoKey,
  encryptedData: ArrayBuffer,
  isDebug: boolean,
  fileName?: string,
  metadata?: Uint8Array
) {
  const exportableEcdhPublicKey = await window.crypto.subtle.exportKey(
    "raw",
    ecdhPublicKey
  );

  const compressedKey = ecPointCompress(exportableEcdhPublicKey);
  const evEncryptedFileIdentifier = new Uint8Array([
    0x25, 0x45, 0x56, 0x45, 0x4e, 0x43,
  ]);
  const versionNumber = new Uint8Array(metadata ? [0x05] : [0x03]);
  let offsetToData = new Uint8Array([0x37, 0x00]);
  if (metadata) {
    let offset = 55 + 2 + metadata.length; // 55 bytes for the header, 2 bytes for the metadata size, metadata length
    offsetToData = numberToLittleEndianUint8Array(offset);
  } else {
  }
  const flags = isDebug ? new Uint8Array([0x01]) : new Uint8Array([0x00]);

  const fileHeaders = concatUint8Arrays([
    evEncryptedFileIdentifier,
    versionNumber,
    offsetToData,
    compressedKey,
    keyIv,
    flags,
  ]);

  let fileContents: Uint8Array;
  if (metadata) {
    const metadataOffsetBuffer = numberToLittleEndianUint8Array(
      metadata.length
    );
    fileContents = concatUint8Arrays([
      fileHeaders,
      metadataOffsetBuffer,
      metadata,
      new Uint8Array(encryptedData),
    ]);
  } else {
    fileContents = concatUint8Arrays([
      fileHeaders,
      new Uint8Array(encryptedData),
    ]);
  }

  const crc32Hash = crc32(fileContents);

  // Convert crc32Hash to little endian Uint8Array
  const crc32HashArray = new Uint8Array([
    crc32Hash & 0xff,
    (crc32Hash >> 8) & 0xff,
    (crc32Hash >> 16) & 0xff,
    (crc32Hash >> 24) & 0xff,
  ]);

  const finalData = concatUint8Arrays([fileContents, crc32HashArray]);

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
    data: Datatypes.EncryptableObject,
    role?: string
  ): Promise<Datatypes.EncrypedObject> {
    return this.#traverseObject({ ...data }, role);
  }

  async #encryptFile(dataContainer: File, role?: string): Promise<File>;
  async #encryptFile(dataContainer: Blob, role?: string): Promise<Blob>;
  async #encryptFile(dataContainer: File | Blob, role?: string) {
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

    let encryptedMetadataBytes: Uint8Array;
    if (role) {
      const metadataBytes = this.#buildMetadata(
        Math.floor(Date.now() / 1000),
        role
      );
      const encryptedMetadataByteBuffer = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: keyIv,
          tagLength: this.#config.authTagLength,
          additionalData: this.#ecdhTeamKey,
        },
        derivedSecretImported,
        metadataBytes
      );
      encryptedMetadataBytes = new Uint8Array(encryptedMetadataByteBuffer);
    }

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
                  dataContainer.name,
                  encryptedMetadataBytes
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

  async #encryptString(
    str: string,
    datatype: string,
    role?: string
  ): Promise<string> {
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

    let version: string;
    let dataToEncrypt: Uint8Array;
    if (role != null) {
      version = this.#config.versions.LCY;
      const metadataBytes = this.#buildMetadata(
        Math.floor(Date.now() / 1000),
        role
      );
      const metadataOffset = new Uint8Array(2); // Metadata size as a 2 bytes little-endian unsigned integer
      metadataOffset[0] = metadataBytes.length & 0xff;
      metadataOffset[1] = (metadataBytes.length >> 8) & 0xff;
      dataToEncrypt = concatUint8Arrays([
        metadataOffset,
        metadataBytes,
        utf8StringToUint8Array(str),
      ]);
    } else {
      version = this.#config.versions.NOC;
      dataToEncrypt = utf8StringToUint8Array(str);
    }

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: keyIv,
        tagLength: this.#config.authTagLength,
        additionalData: this.#ecdhTeamKey,
      },
      derivedSecretImported,
      dataToEncrypt
    );

    return formatEncryptedData(
      version,
      datatype,
      uint8ArrayToBase64String(keyIv),
      this.#ecdhPublicKey,
      uint8ArrayToBase64String(new Uint8Array(encryptedBuffer)),
      this.#isDebug
    );
  }

  #buildMetadata(encryptionTimestamp: number, role?: string): Uint8Array {
    const bufferArray = [];

    // Binary representation of a fixed map with 2 or 3 items, followed by the key-value pairs.
    bufferArray.push(0x80 | (!role ? 2 : 3));

    if (role) {
      // `dr` (data role) => role_name
      // Binary representation for a fixed string of length 2, followed by `dr`
      bufferArray.push(0xa2);
      bufferArray.push(...Array.from("dr").map((c) => c.charCodeAt(0)));

      // Binary representation for a fixed string of role name length, followed by the role name itself.
      bufferArray.push(0xa0 | role.length);
      bufferArray.push(...Array.from(role).map((c) => c.charCodeAt(0)));
    }

    // "eo" (encryption origin) => 5 (Node SDK)
    // Binary representation for a fixed string of length 2, followed by `eo`
    bufferArray.push(0xa2);
    bufferArray.push(...Array.from("eo").map((c) => c.charCodeAt(0)));

    // Binary representation for the integer 5
    bufferArray.push(5);

    // "et" (encryption timestamp) => current time
    // Binary representation for a fixed string of length 2, followed by `et`
    bufferArray.push(0xa2);
    bufferArray.push(...Array.from("et").map((c) => c.charCodeAt(0)));

    // Binary representation for a 4-byte unsigned integer (uint 32), followed by the epoch time
    bufferArray.push(0xce);
    bufferArray.push((encryptionTimestamp >> 24) & 0xff);
    bufferArray.push((encryptionTimestamp >> 16) & 0xff);
    bufferArray.push((encryptionTimestamp >> 8) & 0xff);
    bufferArray.push(encryptionTimestamp & 0xff);

    return new Uint8Array(bufferArray);
  }

  // Use unknown in interal methods
  async #traverseObject(
    data: Datatypes.EncryptableObject,
    role?: string
  ): Promise<Datatypes.EncrypedObject>;

  async #traverseObject(
    data: Datatypes.EncryptableValue[],
    role?: string
  ): Promise<Datatypes.EncryptedValue[]>;

  async #traverseObject(
    data: Datatypes.EncryptableAsString,
    role?: string
  ): Promise<string>;
  async #traverseObject(
    data: Datatypes.EncryptableValue,
    role?: string
  ): Promise<Datatypes.EncryptedValue>;

  async #traverseObject(data: unknown, role?: string) {
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
        encryptedObject[key] = await this.#traverseObject(value, role);
      }
      /* eslint-enable no-await-in-loop */
      return encryptedObject;
    }
    if (Datatypes.isArray(data)) {
      const encryptedArray = [...data];
      return Promise.all(
        encryptedArray.map(async (value) => this.#traverseObject(value, role))
      );
    }
    return data;
  }

  async encrypt(
    data: unknown,
    role?: string
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

    const dataRoleRegex = /^[a-z0-9-]{1,20}$/;
    if (role != null && !dataRoleRegex.test(role)) {
      throw new Error(
        "The provided Data Role slug is invalid. The slug can be retrieved in the Evervault dashboard (Data Roles section)."
      );
    }

    if (Datatypes.isFile(data)) {
      return this.#encryptFile(data, role);
    }

    if (Datatypes.isObjectStrict(data)) {
      return this.#encryptObject(data, role);
    }

    if (Datatypes.isArray(data)) {
      return this.#traverseObject([...data], role);
    }
    if (Datatypes.isEncryptableAsString(data)) {
      return this.#encryptString(
        Datatypes.ensureString(data),
        Datatypes.getHeaderType(data),
        role
      );
    }
    throw new Error("The provided data to be encrypted is invalid.");
  }
}
