/** @format */

const { Datatypes, errors, cryptoUtils } = require('../utils');
const { arrayBufferToBase64 } = require('../utils/datatypes');

const generateBytes = (byteLength) => {
  return new Promise((resolve, reject) => {
    const randomBytes = new Uint8Array(byteLength);
    if (window.crypto) {
      window.crypto.getRandomValues(randomBytes);
      resolve(randomBytes);
    } else {
      reject(
        new errors.CryptoError(
          'Your browser is outdated and does not support the Web Crypto API. Please upgrade it.'
        )
      );
    }
  });
};

module.exports = (config) => {
  const _encryptObject = async (ecdhTeamKey, ecdhPublicKey, derivedSecret, data) => {
    return await _traverseObject(ecdhTeamKey, ecdhPublicKey, derivedSecret, { ...data });
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

  const _encryptString = async (
    ecdhTeamKey,
    ecdhPublicKey,
    derivedSecret,
    str,
    datatype
  ) => {
    const keyIv = await generateBytes(config.ivLength);
    
    const derivedSecretImported = await window.crypto.subtle.importKey(
      'raw',
      derivedSecret,
      {
        name: 'AES-GCM'
      },
      true,
      ['encrypt']
    );

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: keyIv,
        tagLength: config.authTagLength,
        additionalData: Buffer.from(ecdhTeamKey, 'base64')
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
    return str.replace(/={1,2}$/, '');
  };

  const _evVersionPrefix = base64RemovePadding(
    Buffer.from(config.evVersion).toString('base64')
  );

  const _format = async (
    datatype = 'string',
    keyIv,
    ecdhPublicKey,
    encryptedData
  ) => {
    const exportableEcdhPublicKey = await window.crypto.subtle.exportKey('raw', ecdhPublicKey);
    const compressedKey = cryptoUtils.ecPointCompress(exportableEcdhPublicKey);
    return `ev:${_evVersionPrefix}${
      datatype !== 'string' ? ':' + datatype : ''
    }:${base64RemovePadding(keyIv)}:${base64RemovePadding(
      arrayBufferToBase64(compressedKey)
    )}:${base64RemovePadding(encryptedData)}:$`;
  };

  const encrypt = async (
    ecdhTeamKey,
    ecdhPublicKey,
    derivedSecret,
    data
  ) => {
    if (!Datatypes.isDefined(data)) {
      throw new Error('Data must not be undefined');
    }

    if (Datatypes.isObjectStrict(data)) {
      return await _encryptObject(
        ecdhTeamKey,
        ecdhPublicKey,
        derivedSecret,
        data
      );
    } else if (Datatypes.isArray(data)) {
      return await _traverseObject(
        ecdhTeamKey,
        ecdhPublicKey,
        derivedSecret,
        [...data],
      );
    } else if (Datatypes.isEncryptable(data)) {
      return await _encryptString(
        ecdhTeamKey,
        ecdhPublicKey,
        derivedSecret,
        Datatypes.ensureString(data),
        Datatypes.getHeaderType(data)
      );
    } else {
      throw new Error("Data supplied isn't encryptable");
    }
  };

  return { encrypt };
};
