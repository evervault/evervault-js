import { Datatypes, errors, cryptoUtils } from "../utils";
import concatUint8Arrays from "../utils/concatUint8Arrays";
import {
  uint8ArrayToBase64String,
  utf8StringToUint8Array,
} from "../utils/encoding";
import { crc32 } from "../utils/crc32";

const generateBytes = async (byteLength) => {
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

export default function Crypto(config, isDebug) {
  const _encryptObject = async (
    ecdhTeamKey,
    ecdhPublicKey,
    derivedSecret,
    data
  ) => {
    return await _traverseObject(ecdhTeamKey, ecdhPublicKey, derivedSecret, {
      ...data,
    });
  };

  const _traverseObject = async (
    ecdhTeamKey,
    ecdhPublicKey,
    derivedSecret,
    data
  ) => {
    if (Datatypes.isEncryptable(data)) {
      return await _encryptString(
        ecdhTeamKey,
        ecdhPublicKey,
        derivedSecret,
        Datatypes.ensureString(data),
        Datatypes.getHeaderType(data)
      );
    } else if (Datatypes.isObjectStrict(data)) {
      const encryptedObject = { ...data };
      for (let [key, value] of Object.entries(encryptedObject)) {
        encryptedObject[key] = await _traverseObject(
          ecdhTeamKey,
          ecdhPublicKey,
          derivedSecret,
          value
        );
      }
      return encryptedObject;
    } else if (Datatypes.isArray(data)) {
      const encryptedArray = [...data];
      for (let [key, value] of Object.entries(encryptedArray)) {
        encryptedArray[key] = await _traverseObject(
          ecdhTeamKey,
          ecdhPublicKey,
          derivedSecret,
          value
        );
      }
      return encryptedArray;
    } else {
      return data;
    }
  };

  const _encryptFile = async (
    ecdhTeamKey,
    ecdhPublicKey,
    derivedSecret,
    dataContainer
  ) => {
    if (dataContainer.size > config.maxFileSizeInBytes) {
      throw new errors.ExceededMaxFileSizeError(
        `File size must be less than ${config.maxFileSizeInMB}MB`
      );
    }
    const keyIv = await generateBytes(config.ivLength);

    const derivedSecretImported = await window.crypto.subtle.importKey(
      "raw",
      derivedSecret,
      {
        name: "AES-GCM",
      },
      true,
      ["encrypt"]
    );

    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();

      reader.onloadend = (_event) => {
        if (!reader.result) {
          reject({
            error: "Failed to read file to be encrypted",
          });
        }

        window.crypto.subtle
          .encrypt(
            {
              name: "AES-GCM",
              iv: keyIv,
              tagLength: config.authTagLength,
              additionalData: ecdhTeamKey,
            },
            derivedSecretImported,
            reader.result
          )
          .then((encrypted) =>
            _formatFile(keyIv, ecdhPublicKey, encrypted, dataContainer.name)
          )
          .then((formatted) => resolve(formatted))
          .catch((err) => reject(err));
      };

      reader.readAsArrayBuffer(dataContainer);
    });
  };

  const _encryptString = async (
    ecdhTeamKey,
    ecdhPublicKey,
    derivedSecret,
    str,
    datatype
  ) => {
    const keyIv = await generateBytes(config.ivLength);

    const derivedSecretImported = await window.crypto.subtle.importKey(
      "raw",
      derivedSecret,
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
        tagLength: config.authTagLength,
        additionalData: ecdhTeamKey,
      },
      derivedSecretImported,
      utf8StringToUint8Array(str)
    );

    return await _format(
      datatype,
      uint8ArrayToBase64String(keyIv),
      ecdhPublicKey,
      uint8ArrayToBase64String(new Uint8Array(encryptedBuffer))
    );
  };

  const base64RemovePadding = (str) => {
    return str.replace(/={1,2}$/, "");
  };

  const _evVersionPrefix = base64RemovePadding(
    uint8ArrayToBase64String(utf8StringToUint8Array(config.evVersion))
  );

  const _format = async (
    datatype = "string",
    keyIv,
    ecdhPublicKey,
    encryptedData
  ) => {
    const exportableEcdhPublicKey = await window.crypto.subtle.exportKey(
      "raw",
      ecdhPublicKey
    );
    const compressedKey = cryptoUtils.ecPointCompress(exportableEcdhPublicKey);
    return `ev:${isDebug ? "debug:" : ""}${_evVersionPrefix}${
      datatype !== "string" ? ":" + datatype : ""
    }:${base64RemovePadding(keyIv)}:${base64RemovePadding(
      uint8ArrayToBase64String(compressedKey)
    )}:${base64RemovePadding(encryptedData)}:$`;
  };

  const _formatFile = async (keyIv, ecdhPublicKey, encryptedData, fileName) => {
    const exportableEcdhPublicKey = await window.crypto.subtle.exportKey(
      "raw",
      ecdhPublicKey
    );

    const compressedKey = cryptoUtils.ecPointCompress(exportableEcdhPublicKey);
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
  };

  const encrypt = async (ecdhTeamKey, ecdhPublicKey, derivedSecret, data) => {
    if (!Datatypes.isDefined(data)) {
      throw new Error("Data must not be undefined");
    }

    if (Datatypes.isFile(data)) {
      return await _encryptFile(
        ecdhTeamKey,
        ecdhPublicKey,
        derivedSecret,
        data
      );
    } else if (Datatypes.isObjectStrict(data)) {
      return await _encryptObject(
        ecdhTeamKey,
        ecdhPublicKey,
        derivedSecret,
        data
      );
    } else if (Datatypes.isArray(data)) {
      return await _traverseObject(ecdhTeamKey, ecdhPublicKey, derivedSecret, [
        ...data,
      ]);
    } else if (Datatypes.isEncryptable(data)) {
      return await _encryptString(
        ecdhTeamKey,
        ecdhPublicKey,
        derivedSecret,
        Datatypes.ensureString(data),
        Datatypes.getHeaderType(data)
      );
    } else {
      throw new Error("Data supplied is not encryptable");
    }
  };

  return { encrypt };
}