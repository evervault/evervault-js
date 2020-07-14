const { Datatypes, errors, uuid } = require('../utils');

const generateBytes = (byteLength) => {
  return new Promise((resolve, reject) => {
    const randomBytes = new Uint32Array(byteLength);
    if (window.crypto) {
        window.crypto.getRandomValues(randomBytes)
        resolve(randomBytes)
    } else {
        reject(new errors.CryptoError('Your browser is outdated and does not support the Web Crypto API. Please upgrade it.'))
    }
  });
};

const DEFAULT_ENCRYPT_OPTIONS = {
  preserveObjectShape: true,
  fieldsToEncrypt: undefined,
};

module.exports = (config) => {
  const _encryptObject = async (cageKey, data, { fieldsToEncrypt }) => {
    const keys = fieldsToEncrypt || Object.keys(data);
    const encryptedObject = { ...data };
    for (let key of keys) {
      if (Datatypes.isUndefined(data[key])) {
        encryptedObject[key] = data[key];
      } else {
        encryptedObject[key] = await _encryptString(
          cageKey,
          Datatypes.ensureString(data[key])
        );
      }
    }
    return encryptedObject;
  };

  const _encryptString = async (cageKey, str) => {
    const keyIv = await generateBytes(config.keyLength / 2);
    const rootKey = await window.crypto.subtle.generateKey({
        name: 'AES-GCM',
        length: config.keyLength * 8
    },
    true,
    [ 'encrypt', 'decrypt' ]);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: keyIv,
            tagLength: config.authTagLength
        },
        rootKey,
        new TextEncoder().encode(str)
    );
        console.log('a')
    const importedCageKey = await _importCageKey(cageKey);
    console.log(importedCageKey);
    const encryptedKey = await _wrapKey(importedCageKey, rootKey);

    return _format(
      Datatypes.arrayBufferToBase64(encryptedKey),
      Datatypes.arrayBufferToBase64(keyIv),
      Datatypes.arrayBufferToBase64(encryptedBuffer)
    );
  };

  const _importCageKey = async (cageKey) => {
    // Strip the PEM headers if they're there.
    cageKey = cageKey.substr(0,5) === '-----' ? Datatypes.base64ToArrayBuffer(cageKey.split('\n').slice(1, -1).join('\n')) : Datatypes.base64ToArrayBuffer(cageKey);
    return window.crypto.subtle.importKey(
        'spki',
        cageKey,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        true,
        [ 'wrapKey' ]
    );
  };

  const _wrapKey = async (publicKey, keyToWrap) => {
    return window.crypto.subtle.wrapKey(
        'raw',
        keyToWrap,
        publicKey,
        { name: 'RSA-OAEP' }
    )
  };

  const _format = (encryptedKey, keyIv, encryptedData) => {
    const header = Datatypes.utf8ToBase64URL(JSON.stringify(config.header));
    const payload = Datatypes.utf8ToBase64URL(
      JSON.stringify({
        cageData: encryptedKey,
        keyIv,
        encryptedData,
      })
    );
    return `${header}.${payload}.${uuid()}`;
  };

  const encrypt = async (key, data, options = DEFAULT_ENCRYPT_OPTIONS) => {
    console.log(key)
    if (!Datatypes.isDefined(data)) {
      throw new Error('Data must not be undefined');
    }
    if (!Datatypes.isString(key)) {
      throw new Error('No key supplied to encrypt');
    }

    console.log(data);
    console.log(options)
    if (Datatypes.isObject(data) && options.preserveObjectShape) {
      return await _encryptObject(key, data, options);
    } else {
      return await _encryptString(key, Datatypes.ensureString(data));
    }
  };

  return { encrypt };
};