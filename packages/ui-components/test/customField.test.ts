import { describe, expect, it } from "vitest";
import {
  customFieldError,
  customFieldProps,
  customFieldWarnings,
} from "../src/Card/customField";
import type { CustomFieldProps } from "../src/Card/customField";
import { invalidPattern } from "../src/Card/developerMessages";

function declared(props: Record<string, string>): CustomFieldProps {
  const field = customFieldProps({
    type: "field",
    id: "custom",
    props: { name: "custom", ...props },
  });

  if (!field) throw new Error("no field");
  return field;
}

function error(props: Record<string, string>, value: string) {
  return customFieldError(declared(props), value);
}

describe("customFieldError", () => {
  it("accepts an empty field", () => {
    expect(error({}, "")).toBeUndefined();
  });

  it("requires a value when declared required", () => {
    expect(error({ required: "" }, "")).toBe("required");
    expect(error({ required: "" }, "x")).toBeUndefined();
  });

  it('accepts an empty field declared required="false"', () => {
    expect(error({ required: "false" }, "")).toBeUndefined();
  });

  it("checks no constraint of an empty field", () => {
    expect(error({ pattern: "\\d+", minlength: "3" }, "")).toBeUndefined();
  });

  it("matches the pattern against the whole value", () => {
    expect(error({ pattern: "\\d+" }, "123")).toBeUndefined();
    expect(error({ pattern: "\\d+" }, "123a")).toBe("invalid");
    expect(error({ pattern: "\\d+" }, "a123")).toBe("invalid");
  });

  it("matches a pattern with alternatives against the whole value", () => {
    expect(error({ pattern: "a|b" }, "a")).toBeUndefined();
    expect(error({ pattern: "a|b" }, "ab")).toBe("invalid");
  });

  it("matches an anchored pattern", () => {
    const postcode = "^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$";

    expect(error({ pattern: postcode }, "SW1A 1AA")).toBeUndefined();
    expect(error({ pattern: postcode }, "12345")).toBe("invalid");
  });

  it("ignores a pattern that is not a regular expression", () => {
    expect(error({ pattern: "(" }, "anything")).toBeUndefined();
  });

  it("checks the minimum and maximum length", () => {
    expect(error({ minlength: "3" }, "ab")).toBe("invalid");
    expect(error({ minlength: "3" }, "abc")).toBeUndefined();
    expect(error({ maxlength: "3" }, "abcd")).toBe("invalid");
    expect(error({ maxlength: "3" }, "abc")).toBeUndefined();
  });

  it("ignores a length that is not one", () => {
    expect(error({ minlength: "-1" }, "a")).toBeUndefined();
    expect(error({ maxlength: "two" }, "abc")).toBeUndefined();
  });

  it("checks an email address", () => {
    expect(error({ type: "email" }, "jane@example.com")).toBeUndefined();
    expect(error({ type: "email" }, "jane")).toBe("invalid");
    expect(error({ type: "email" }, "jane@")).toBe("invalid");
  });

  it("checks a url", () => {
    expect(error({ type: "url" }, "https://example.com")).toBeUndefined();
    expect(error({ type: "url" }, "example")).toBe("invalid");
  });

  it("checks a number", () => {
    expect(error({ type: "number" }, "12")).toBeUndefined();
    expect(error({ type: "number" }, "-1e3")).toBeUndefined();
    expect(error({ type: "number" }, "twelve")).toBe("invalid");
  });

  it("checks a number against min and max", () => {
    const range = { type: "number", min: "1", max: "10" };

    expect(error(range, "0")).toBe("invalid");
    expect(error(range, "1")).toBeUndefined();
    expect(error(range, "10")).toBeUndefined();
    expect(error(range, "11")).toBe("invalid");
  });

  it("steps a number by one unless declared otherwise", () => {
    expect(error({ type: "number" }, "1.5")).toBe("invalid");
    expect(error({ type: "number", step: "any" }, "1.5")).toBeUndefined();
    expect(error({ type: "number", step: "0.1" }, "0.3")).toBeUndefined();
    expect(error({ type: "number", step: "0.25" }, "0.3")).toBe("invalid");
  });

  it("steps a number from its minimum", () => {
    const stepped = { type: "number", min: "1", step: "2" };

    expect(error(stepped, "3")).toBeUndefined();
    expect(error(stepped, "4")).toBe("invalid");
  });

  it("ignores a bound or step that is not a number", () => {
    expect(error({ type: "number", min: "low" }, "-5")).toBeUndefined();
    expect(error({ type: "number", step: "big" }, "3")).toBeUndefined();
  });

  it("checks a date", () => {
    expect(error({ type: "date" }, "2026-02-28")).toBeUndefined();
    expect(error({ type: "date" }, "2026-02-30")).toBe("invalid");
    expect(error({ type: "date" }, "28/02/2026")).toBe("invalid");
  });

  it("checks a date against min and max", () => {
    const range = { type: "date", min: "2026-01-01", max: "2026-12-31" };

    expect(error(range, "2025-12-31")).toBe("invalid");
    expect(error(range, "2026-06-15")).toBeUndefined();
    expect(error(range, "2027-01-01")).toBe("invalid");
  });

  it("steps a date in days from its minimum", () => {
    const weekly = { type: "date", min: "2026-01-05", step: "7" };

    expect(error(weekly, "2026-01-12")).toBeUndefined();
    expect(error(weekly, "2026-01-13")).toBe("invalid");
  });

  it("checks nothing on a read-only field", () => {
    expect(error({ readonly: "", required: "" }, "")).toBeUndefined();
    expect(error({ readonly: "", pattern: "\\d+" }, "abc")).toBeUndefined();
  });

  it.each(["number", "date"])(
    "ignores pattern and lengths on a %s field",
    (type) => {
      const value = type === "number" ? "123" : "2026-01-01";

      expect(
        error({ type, pattern: "x", minlength: "20", maxlength: "2" }, value)
      ).toBeUndefined();
    }
  );

  it("ignores min, max and step on a text field", () => {
    expect(error({ min: "5", max: "6", step: "10" }, "1")).toBeUndefined();
  });
});

describe("customFieldWarnings", () => {
  function warnings(props: Record<string, string>) {
    return customFieldWarnings({
      type: "field",
      id: "custom",
      props: { name: "custom", ...props },
    });
  }

  it("has nothing to say about a field it renders as declared", () => {
    expect(warnings({ type: "email", pattern: ".+@.+" })).toEqual([]);
  });

  it("names a pattern that is not a regular expression", () => {
    expect(warnings({ pattern: "(" })).toEqual([invalidPattern("custom", "(")]);
  });
});
