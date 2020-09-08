/** @format */

const { Datatypes, errors, uuid } = require('../utils');

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
  const _encryptObject = async (cageKey, data) => {
    return await _traverseObject(cageKey, { ...data });
  };

  const _traverseObject = async (cageKey, data) => {
    if (Datatypes.isEncryptable(data)) {
      return await _encryptString(
        cageKey,
        Datatypes.ensureString(data),
        Datatypes.getHeaderType(data)
      );
    } else if (Datatypes.isObjectStrict(data)) {
      const encryptedObject = { ...data };
      for (let [key, value] of Object.entries(encryptedObject)) {
        encryptedObject[key] = await _traverseObject(cageKey, value);
      }
      return encryptedObject;
    } else {
      return data;
    }
  };

  const _encryptString = async (cageKey, str) => {
    const keyIv = await generateBytes(config.keyLength / 2);
    const rootKey = await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: config.keyLength * 8,
      },
      true,
      ['encrypt']
    );

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: keyIv,
        tagLength: config.authTagLength,
      },
      rootKey,
      new TextEncoder().encode(str)
    );
    const importedCageKey = await _importCageKey(cageKey);
    const encryptedKey = await _wrapKey(importedCageKey, rootKey);

    return _format(
      Datatypes.arrayBufferToBase64(encryptedKey),
      Datatypes.arrayBufferToBase64(keyIv),
      Datatypes.arrayBufferToBase64(encryptedBuffer)
    );
  };

  const _importCageKey = async (cageKey) => {
    // Strip the PEM headers if they're there.
    return window.crypto.subtle.importKey(
      'spki',
      Datatypes.base64ToArrayBuffer(cageKey),
      {
        name: 'RSA-OAEP',
        hash: 'SHA-1',
      },
      false,
      ['wrapKey']
    );
  };

  const _wrapKey = async (publicKey, keyToWrap) => {
    return window.crypto.subtle.wrapKey('raw', keyToWrap, publicKey, {
      name: 'RSA-OAEP',
    });
  };

  const _format = (encryptedKey, keyIv, sharedEncryptedData) => {
    const header = Datatypes.utf8ToBase64URL(JSON.stringify(config.header));
    const payload = Datatypes.utf8ToBase64URL(
      JSON.stringify({
        cageData: encryptedKey,
        keyIv,
        sharedEncryptedData,
      })
    );
    return `${header}.${payload}.${uuid()}`;
  };

  const encrypt = async (key, data) => {

    if (!Datatypes.isDefined(data)) {
      throw new Error('Data must not be undefined');
    }
    if (!Datatypes.isString(key)) {
      throw new Error('No key supplied to encrypt');
    }

    if (Datatypes.isObjectStrict(data)) {
      return await _encryptObject(key, data);
    } else if (Datatypes.isEncryptable(data)) {
      return await _encryptString(
        key,
        Datatypes.ensureString(data),
        Datatypes.getHeaderType(data)
      );
    } else {
      throw new Error("Data supplied isn't encryptable");
    }
  };

  return { encrypt };
};
