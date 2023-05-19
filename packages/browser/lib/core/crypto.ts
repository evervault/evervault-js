import {
  Datatypes,
  errors,
  concatUint8Arrays,
  ecPointCompress,
} from "../utils";
import { uint8ArrayToBase64String, utf8StringToUint8Array } from "../encoding";
import { crc32 } from "../utils";
import { EncryptionSubConfig } from "../config";

const generateBytes = async (byteLength: number) => {
  let randomBytes = new Uint8Array(byteLength);
  if (window.crypto) {
    window.crypto.getRandomValues(randomBytes);
    return randomBytes;
  } else {
    throw new errors.CryptoError(
      "Your browser is outdated and does not support the Web Crypto API. Please upgrade it."
    );
  }
};

function base64RemovePadding(str: string) {
  return str.replace(/={1,2}$/, "");
}

async function formatEncryptedData(
  evVersion: string,
  datatype = "string",
  keyIv: string,
  ecdhPublicKey: CryptoKey,
  encryptedData: string,
  isDebug: boolean
) {
  const _evVersionPrefix = base64RemovePadding(
    uint8ArrayToBase64String(utf8StringToUint8Array(evVersion))
  );

  const exportableEcdhPublicKey = await window.crypto.subtle.exportKey(
    "raw",
    ecdhPublicKey
  );
  const compressedKey = ecPointCompress(exportableEcdhPublicKey);
  return `ev:${isDebug ? "debug:" : ""}${_evVersionPrefix}${
    datatype !== "string" ? ":" + datatype : ""
  }:${base64RemovePadding(keyIv)}:${base64RemovePadding(
    uint8ArrayToBase64String(compressedKey)
  )}:${base64RemovePadding(encryptedData)}:$`;
}

async function formatEncryptedFile(
  keyIv: Uint8Array,
  ecdhPublicKey: CryptoKey,
  encryptedData: ArrayBuffer,
  fileName: string,
  isDebug: boolean
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

  if (fileName) {
    return new File([finalData], fileName, {
      type: "application/octet-stream",
    });
  } else {
    return new Blob([finalData], {
      type: "application/octet-stream",
    });
  }
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

  async #encryptObject(data: Record<string, unknown>) {
    return await this.#traverseObject({
      ...data,
    });
  }

  async #encryptFile(dataContainer: Blob) {
    if (dataContainer.size > this.#config.maxFileSizeInBytes) {
      throw new errors.ExceededMaxFileSizeError(
        `File size must be less than ${this.#config.maxFileSizeInMB}MB`
      );
    }
    const keyIv = await generateBytes(this.#config.ivLength);

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
          .then((encrypted) =>
            resolve(
              formatEncryptedFile(
                keyIv,
                this.#ecdhPublicKey,
                encrypted,
                dataContainer.name,
                this.#isDebug
              )
            )
          );
      };

      reader.readAsArrayBuffer(dataContainer);
    });
  }

  async #encryptString(str: string, datatype: string) {
    const keyIv = await generateBytes(this.#config.ivLength);

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

    return await formatEncryptedData(
      this.#config.evVersion,
      datatype,
      uint8ArrayToBase64String(keyIv),
      this.#ecdhPublicKey,
      uint8ArrayToBase64String(new Uint8Array(encryptedBuffer)),
      this.#isDebug
    );
  }

  async #traverseObject(data: any): Promise<any> {
    if (Datatypes.isEncryptableAsString(data)) {
      return await this.#encryptString(
        Datatypes.ensureString(data),
        Datatypes.getHeaderType(data)
      );
    } else if (Datatypes.isObjectStrict(data)) {
      const encryptedObject = { ...data };
      for (let [key, value] of Object.entries(encryptedObject)) {
        encryptedObject[key] = await this.#traverseObject(value);
      }
      return encryptedObject;
    } else if (Datatypes.isArray(data)) {
      const encryptedArray = [...data];
      return encryptedArray.map(async (value) => {
        return await this.#traverseObject(value);
      });
    } else {
      return data;
    }
  }

  async encrypt(data: any): Promise<any> {
    if (!Datatypes.isDefined(data)) {
      throw new Error("Data must not be undefined");
    }

    if (Datatypes.isFile(data)) {
      return await this.#encryptFile(data);
    }

    if (Datatypes.isObjectStrict(data)) {
      return await this.#encryptObject(data);
    }

    if (Datatypes.isArray(data)) {
      return await this.#traverseObject([...data]);
    } else if (Datatypes.isEncryptableAsString(data)) {
      return await this.#encryptString(
        Datatypes.ensureString(data),
        Datatypes.getHeaderType(data)
      );
    } else {
      throw new Error("Data supplied is not encryptable");
    }
  }
}
