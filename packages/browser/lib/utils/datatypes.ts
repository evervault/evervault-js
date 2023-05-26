type EncryptableAsString = string | number | boolean | bigint | Function;

// TODO: Replace with zod
export const isArray = (data: unknown): data is Array<any> => (data != null && typeof data === 'object') && data instanceof Array;
export const isArrayBuffer = (data: unknown): data is ArrayBuffer =>
  typeof ArrayBuffer === "function" &&
  (data instanceof ArrayBuffer ||
    Object.prototype.toString.call(data) === "[object ArrayBuffer]");
export const isObject = (data: unknown): data is object => typeof data === "object";
export const isObjectStrict = (data: unknown): data is Record<string, unknown> =>
  isDefined(data) && isObject(data) && !isArray(data) && !isArrayBuffer(data);
export const isString = (data: unknown): data is string => typeof data === "string";
export const isEmptyString = (data: unknown): data is '' => (data != null && isString(data)) && data.length === 0;
export const isDefined = <T>(data: T | null | undefined): data is NonNullable<T> => typeof data !== "undefined" && data !== null;
export const isUndefined = (data: unknown): data is undefined => typeof data === "undefined";
export const isNumber = (data: unknown): data is number => typeof data === "number";
export const isBoolean = (data: unknown): data is boolean => typeof data === "boolean";
export const isFile = (data: unknown): data is (File | Blob) => data instanceof File || data instanceof Blob;

export const isEncryptableAsString = (data: unknown): data is EncryptableAsString =>
  isDefined(data) && (isString(data) || isNumber(data) || isBoolean(data));

export const getHeaderType = (data: NonNullable<unknown>): string => {
  if (isArray(data)) return data.constructor.name;
  else {
    return typeof data;
  }
};

export const ensureString = (data: EncryptableAsString): string => {
  if(isString(data)) return data;
  if(isNumber(data)) return data.toString();
  if(isBoolean(data)) return data.toString();
  if (typeof data === "bigint" || typeof data === "function") {
    return data.toString();
  }
  else throw new Error(`Cannot ensure string for ${data}`);
};

export const utf8ToBase64URL = (str: string): string => {
  const base64Encoded = window.btoa(str);
  return base64Encoded
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};
