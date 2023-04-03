// TODO: Replace with zod
export const isArray = (data) => data.constructor.name === "Array";
export const isArrayBuffer = (data) =>
  typeof ArrayBuffer === "function" &&
  (data instanceof ArrayBuffer ||
    Object.prototype.toString.call(data) === "[object ArrayBuffer]");
export const isObject = (data) => typeof data === "object";
export const isObjectStrict = (data) =>
  isDefined(data) && isObject(data) && !isArray(data) && !isArrayBuffer(data);
export const isString = (data) => typeof data === "string";
export const isEmptyString = (data) => isString(data) && data.length === 0;
export const isDefined = (data) => typeof data !== "undefined" && data !== null;
export const isUndefined = (data) => typeof data === "undefined";
export const isNumber = (data) => typeof data === "number";
export const isBoolean = (data) => typeof data === "boolean";
export const isFile = (data) => data instanceof File || data instanceof Blob;

export const isEncryptable = (data) =>
  isDefined(data) && (isString(data) || isNumber(data) || isBoolean(data));

export const getHeaderType = (data) => {
  if (!isDefined(data)) return;
  if (isArray(data)) return data.constructor.name;
  else {
    return typeof data;
  }
};

export const ensureString = (data) => {
  if (isUndefined(data)) return;

  if (!isDefined(data)) return JSON.stringify(data);
  if (isString(data)) return data.trim();
  if (["bigint", "function"].includes(typeof data)) {
    return data.toString();
  }

  return JSON.stringify(data);
};

export const utf8ToBase64URL = (str) => {
  const base64Encoded = window.btoa(str);
  return base64Encoded
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};
