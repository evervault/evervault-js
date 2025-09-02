import { DateComponents } from "../specs/ApplePayButtonViewNativeComponent";

export function toDate(date: Date | string | number) {
  if (typeof date === "string") return new Date(date);
  if (typeof date === "number") return new Date(date);
  return date;
}

export function toDateComponents(date: Date | string | number): DateComponents {
  const object = toDate(date);
  return {
    year: object.getFullYear(),
    month: object.getMonth() + 1,
    day: object.getDate(),
  };
}
