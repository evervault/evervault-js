import { CUSTOM_FIELD_ERRORS } from "shared/customField";
import { customFieldMessage } from "./customFields";

describe("customFieldMessage", () => {
  it("accepts an empty optional field", () => {
    expect(customFieldMessage("", { pattern: "\\d+" })).toBeNull();
  });

  it("refuses an empty required field", () => {
    expect(customFieldMessage("", { required: true })).toBe(
      CUSTOM_FIELD_ERRORS.required
    );
  });

  it("matches the whole value against the pattern", () => {
    expect(customFieldMessage("12a", { pattern: "\\d+" })).toBe(
      CUSTOM_FIELD_ERRORS.invalid
    );
    expect(customFieldMessage("123", { pattern: "\\d+" })).toBeNull();
  });

  it("refuses a value outside the length bounds", () => {
    expect(customFieldMessage("ab", { minLength: 3 })).not.toBeNull();
    expect(customFieldMessage("abcd", { maxLength: 3 })).not.toBeNull();
    expect(
      customFieldMessage("abc", { minLength: 3, maxLength: 3 })
    ).toBeNull();
  });

  it("uses the field's own message for either error", () => {
    const rules = { required: true, pattern: "\\d+", errorMessage: "Digits" };

    expect(customFieldMessage("", rules)).toBe("Digits");
    expect(customFieldMessage("a", rules)).toBe("Digits");
  });

  it("ignores a pattern that does not compile", () => {
    expect(customFieldMessage("anything", { pattern: "(" })).toBeNull();
  });
});
