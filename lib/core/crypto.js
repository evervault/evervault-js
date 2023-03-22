import { Buffer } from 'buffer/index';

import { Datatypes, errors, cryptoUtils } from "../utils";

const generateBytes = (byteLength) => {
  return new Promise((resolve, reject) => {
    const randomBytes = new Uint8Array(byteLength);
    if (window.crypto) {
      window.crypto.getRandomValues(randomBytes);
      resolve(randomBytes);
    } else {
      reject(
        new errors.CryptoError(
          "Your browser is outdated and does not support the Web Crypto API. Please upgrade it."
        )
      );
    }
  });
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
      const reader = new FileReader();

      reader.onloadend = (event) => {
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
              additionalData: Buffer.from(ecdhTeamKey, "base64"),
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
        additionalData: Buffer.from(ecdhTeamKey, "base64"),
      },
      derivedSecretImported,
      Buffer.from(str)
    );

    return await _format(
      datatype,
      Datatypes.arrayBufferToBase64(keyIv),
      ecdhPublicKey,
      Datatypes.arrayBufferToBase64(Buffer.from(encryptedBuffer))
    );
  };

  const base64RemovePadding = (str) => {
    return str.replace(/={1,2}$/, "");
  };

  const _evVersionPrefix = base64RemovePadding(
    Buffer.from(config.evVersion).toString("base64")
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
      Datatypes.arrayBufferToBase64(compressedKey)
    )}:${base64RemovePadding(encryptedData)}:$`;
  };

  const _formatFile = async (keyIv, ecdhPublicKey, encryptedData, fileName) => {
    const exportableEcdhPublicKey = await window.crypto.subtle.exportKey(
      "raw",
      ecdhPublicKey
    );

    const compressedKey = cryptoUtils.ecPointCompress(exportableEcdhPublicKey);
    const evEncryptedFileIdentifier = Buffer.from([
      0x25, 0x45, 0x56, 0x45, 0x4e, 0x43,
    ]);
    const versionNumber = Buffer.from([0x01]);
    const offsetToData = Buffer.from([0x37, 0x00]);
    const flags = isDebug ? Buffer.from([0x01]) : Buffer.from([0x00]);

    const data = Buffer.concat([
      evEncryptedFileIdentifier,
      versionNumber,
      offsetToData,
      Buffer.from(compressedKey),
      Buffer.from(keyIv),
      flags,
      Buffer.from(encryptedData),
    ]);

    if (fileName) {
      return new File([data], fileName, {
        type: "application/octet-stream",
      });
    } else {
      return new Blob([data], {
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
};

