const isArray = (data) => data.constructor.name === "Array";
const isArrayBuffer = (data) =>
  typeof ArrayBuffer === "function" &&
  (data instanceof ArrayBuffer ||
    Object.prototype.toString.call(data) === "[object ArrayBuffer]");
const isObject = (data) => typeof data === "object";
const isObjectStrict = (data) =>
  isDefined(data) && isObject(data) && !isArray(data) && !isArrayBuffer(data);
const isString = (data) => typeof data === "string";
const isEmptyString = (data) => isString(data) && data.length === 0;
const isDefined = (data) => typeof data !== "undefined" && data !== null;
const isUndefined = (data) => typeof data === "undefined";
const isNumber = (data) => typeof data === "number";
const isBoolean = (data) => typeof data === "boolean";
const isFile = (data) => data instanceof File || data instanceof Blob;

const isEncryptable = (data) =>
  isDefined(data) && (isString(data) || isNumber(data) || isBoolean(data));

const getHeaderType = (data) => {
  if (!isDefined(data)) return;
  if (isArray(data)) return data.constructor.name;
  else {
    return typeof data;
  }
};

const ensureString = (data) => {
  if (isUndefined(data)) return;

  if (!isDefined(data)) return JSON.stringify(data);
  if (isString(data)) return data.trim();
  if (["bigint", "function"].includes(typeof data)) {
    return data.toString();
  }

  return JSON.stringify(data);
};

const utf8ToBase64URL = (str) => {
  const base64Encoded = window.btoa(str);
  return base64Encoded
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

const arrayBufferToBase64 = (buffer) => {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

module.exports = {
  isArray,
  isObject,
  isObjectStrict,
  isArrayBuffer,
  isString,
  isEmptyString,
  isDefined,
  isUndefined,
  isEncryptable,
  isFile,
  getHeaderType,
  ensureString,
  utf8ToBase64URL,
  arrayBufferToBase64,
  base64ToArrayBuffer,
};
