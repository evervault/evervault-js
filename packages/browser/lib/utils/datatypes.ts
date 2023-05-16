// TODO: Replace with zod
export const isArray = (data: unknown): data is Array<any> => (data != null && typeof data === 'object') && data instanceof Array;
export const isArrayBuffer = (data: unknown): data is ArrayBuffer =>
  typeof ArrayBuffer === "function" &&
  (data instanceof ArrayBuffer ||
    Object.prototype.toString.call(data) === "[object ArrayBuffer]");
export const isObject = (data: unknown): data is Object => typeof data === "object";
export const isObjectStrict = (data: unknown): data is Object =>
  isDefined(data) && isObject(data) && !isArray(data) && !isArrayBuffer(data);
export const isString = (data: unknown): data is string => typeof data === "string";
export const isEmptyString = (data: unknown): data is '' => (data != null && isString(data)) && data.length === 0;
export const isDefined = <T>(data: T | null | undefined): data is NonNullable<T> => typeof data !== "undefined" && data !== null;
export const isUndefined = (data: unknown): data is undefined => typeof data === "undefined";
export const isNumber = (data: unknown): data is number => typeof data === "number";
export const isBoolean = (data: unknown): data is boolean => typeof data === "boolean";
export const isFile = (data: unknown) => data instanceof File || data instanceof Blob;

export const isEncryptable = (data: unknown) =>
  isDefined(data) && (isString(data) || isNumber(data) || isBoolean(data));

export const getHeaderType = (data: unknown) => {
  if (!isDefined(data)) return;
  if (isArray(data)) return data.constructor.name;
  else {
    return typeof data;
  }
};

export const ensureString = (data: unknown) => {
  if (isUndefined(data)) return;

  if (!isDefined(data)) return JSON.stringify(data);
  if (isString(data)) return data.trim();
  if (["bigint", "function"].includes(typeof data)) {
    return data.toString();
  }

  return JSON.stringify(data);
};

export const utf8ToBase64URL = (str: string) => {
  const base64Encoded = window.btoa(str);
  return base64Encoded
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};
