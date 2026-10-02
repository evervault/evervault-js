import { describe, expect, it } from "vitest";
import { customFieldProps } from "shared";
import type { CustomFieldProps } from "shared";
import { capitalised, customFieldWarnings } from "../src/Card/customField";
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

describe("capitalised", () => {
  function capitalise(props: Record<string, string>, value: string) {
    return capitalised(declared(props), value);
  }

  it("capitalises every character", () => {
    expect(capitalise({ autocapitalize: "characters" }, "sw1a 1aa")).toBe(
      "SW1A 1AA"
    );
  });

  it("capitalises the first letter of each word", () => {
    expect(capitalise({ autocapitalize: "words" }, "jane van doe")).toBe(
      "Jane Van Doe"
    );
  });

  it.each(["sentences", "on"])(
    'capitalises the first letter of each sentence for autocapitalize="%s"',
    (autocapitalize) => {
      expect(capitalise({ autocapitalize }, "hello there. how are you?")).toBe(
        "Hello there. How are you?"
      );
    }
  );

  it.each(["none", "off", "unknown", ""])(
    'leaves the value alone for autocapitalize="%s"',
    (autocapitalize) => {
      expect(capitalise({ autocapitalize }, "sw1a 1aa")).toBe("sw1a 1aa");
    }
  );

  it("leaves the value alone without autocapitalize", () => {
    expect(capitalise({}, "sw1a 1aa")).toBe("sw1a 1aa");
  });

  it("never lowers a capital", () => {
    expect(capitalise({ autocapitalize: "words" }, "McDonald")).toBe(
      "McDonald"
    );
  });

  it.each(["email", "url"])("never capitalises a %s field", (type) => {
    expect(
      capitalise({ type, autocapitalize: "characters" }, "jane@example.com")
    ).toBe("jane@example.com");
  });
});
