import { CUSTOM_FIELD_ERRORS, customFieldProps } from "shared/customField";
import { customFieldKey, customFieldMessage } from "./customFields";

// A field read from its declared props, as the card reads it.
function field(props: Record<string, string>) {
  const declared = customFieldProps({
    type: "field",
    id: "field",
    props: { name: "field", ...props },
  });

  if (!declared) throw new Error("no field");
  return declared;
}

describe("customFieldMessage", () => {
  it("accepts an empty optional field", () => {
    expect(customFieldMessage("", field({ pattern: "\\d+" }))).toBeNull();
  });

  it("refuses an empty required field", () => {
    expect(customFieldMessage("", field({ required: "" }))).toBe(
      CUSTOM_FIELD_ERRORS.required
    );
  });

  it("matches the whole value against the pattern", () => {
    expect(customFieldMessage("12a", field({ pattern: "\\d+" }))).toBe(
      CUSTOM_FIELD_ERRORS.invalid
    );
    expect(customFieldMessage("123", field({ pattern: "\\d+" }))).toBeNull();
  });

  it("refuses a value outside the length bounds", () => {
    expect(customFieldMessage("ab", field({ minlength: "3" }))).not.toBeNull();
    expect(
      customFieldMessage("abcd", field({ maxlength: "3" }))
    ).not.toBeNull();
    expect(
      customFieldMessage("abc", field({ minlength: "3", maxlength: "3" }))
    ).toBeNull();
  });

  it("ignores a length that is not a whole number", () => {
    expect(customFieldMessage("abc", field({ maxlength: "2.5" }))).toBeNull();
  });

  it("uses the field's own message for either error", () => {
    const rules = field({
      required: "",
      pattern: "\\d+",
      errormessage: "Digits",
    });

    expect(customFieldMessage("", rules)).toBe("Digits");
    expect(customFieldMessage("a", rules)).toBe("Digits");
  });

  it("ignores a pattern that does not compile", () => {
    expect(customFieldMessage("anything", field({ pattern: "(" }))).toBeNull();
  });

  it("checks a value against the field's type", () => {
    expect(customFieldMessage("not an email", field({ type: "email" }))).toBe(
      CUSTOM_FIELD_ERRORS.invalid
    );
    expect(customFieldMessage("a@b.co", field({ type: "email" }))).toBeNull();
  });

  it("never refuses a read-only value", () => {
    expect(
      customFieldMessage("", field({ required: "", readonly: "" }))
    ).toBeNull();
  });
});

describe("customFieldKey", () => {
  it("keeps every name a single key under fields", () => {
    for (const name of ["billing.zip", "__proto__", "constructor", "a[0]"]) {
      expect(customFieldKey(name)).toMatch(/^fields\.k[A-Za-z0-9_]*$/);
    }
  });

  it("keeps different names apart", () => {
    expect(customFieldKey("a.b")).not.toBe(customFieldKey("a_b"));
  });
});
