import { CUSTOM_FIELD_ERRORS, customFieldError } from "./customFields";

describe("customFieldError", () => {
  it("accepts an empty optional field", () => {
    expect(customFieldError("", { pattern: "\\d+" })).toBeNull();
  });

  it("refuses an empty required field", () => {
    expect(customFieldError("", { required: true })).toBe(
      CUSTOM_FIELD_ERRORS.required
    );
  });

  it("matches the whole value against the pattern", () => {
    expect(customFieldError("12a", { pattern: "\\d+" })).toBe(
      CUSTOM_FIELD_ERRORS.invalid
    );
    expect(customFieldError("123", { pattern: "\\d+" })).toBeNull();
  });

  it("refuses a value outside the length bounds", () => {
    expect(customFieldError("ab", { minLength: 3 })).not.toBeNull();
    expect(customFieldError("abcd", { maxLength: 3 })).not.toBeNull();
    expect(customFieldError("abc", { minLength: 3, maxLength: 3 })).toBeNull();
  });

  it("uses the field's own message for either error", () => {
    const rules = { required: true, pattern: "\\d+", errorMessage: "Digits" };

    expect(customFieldError("", rules)).toBe("Digits");
    expect(customFieldError("a", rules)).toBe("Digits");
  });

  it("ignores a pattern that does not compile", () => {
    expect(customFieldError("anything", { pattern: "(" })).toBeNull();
  });
});
