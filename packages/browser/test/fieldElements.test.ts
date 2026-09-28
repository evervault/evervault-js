import { beforeAll, describe, expect, it } from "vitest";
import {
  FIELD_ELEMENTS,
  registerFieldElements,
} from "../lib/ui/elements/fields";
import type { Reflection } from "../lib/ui/elements/reflect";

beforeAll(() => {
  registerFieldElements();
});

type Element = HTMLElement & Record<string, unknown>;

function create(tag: string) {
  const element = document.createElement(tag) as Element;
  document.body.append(element);
  return element;
}

const reflected = Object.entries(FIELD_ELEMENTS).flatMap(([tag, element]) =>
  (
    (element as unknown as { reflections?: Reflection[] }).reflections ?? []
  ).map(
    ([property, attribute, kind]) => [tag, property, attribute, kind] as const
  )
);

const SAMPLES = {
  flag: [true, ""],
  switch: [false, "false"],
  text: ["Value", "Value"],
  number: [8, "8"],
  list: [["a", "b"], "a b"],
} as const;

describe("field elements", () => {
  it("registers every field element", () => {
    for (const tag of Object.keys(FIELD_ELEMENTS)) {
      expect(customElements.get(tag)).toBeDefined();
    }
  });

  it.each(reflected)(
    "writes <%s>.%s as its %s attribute",
    (tag, property, attribute, kind) => {
      const element = create(tag);
      const [value, written] = SAMPLES[kind];

      element[property] = value;

      expect(element.getAttribute(attribute)).toBe(written);
    }
  );

  it.each(reflected)(
    "reads <%s>.%s from its %s attribute",
    (tag, property, attribute, kind) => {
      const element = create(tag);
      const [value, written] = SAMPLES[kind];

      element.setAttribute(attribute, written);

      expect(element[property]).toEqual(value);
    }
  );

  it("reads a flag denied with false as off", () => {
    const element = create("ev-card-cvc");
    element.setAttribute("redact", "false");

    expect(element.redact).toBe(false);
  });

  it("reads any other value of a flag as on", () => {
    const element = create("ev-card-number");
    element.setAttribute("autoprogress", "yes");

    expect(element.autoProgress).toBe(true);
  });

  it("reads autocomplete denied with off as off", () => {
    const element = create("ev-card-number");
    element.setAttribute("autocomplete", "off");

    expect(element.autoComplete).toBe(false);
  });

  it("keeps a custom field's autocomplete token", () => {
    const element = create("ev-field");

    element.autoComplete = "postal-code";

    expect(element.getAttribute("autocomplete")).toBe("postal-code");
  });

  it("removes the attribute of a property set to undefined", () => {
    const element = create("ev-card-number");
    element.setAttribute("label", "Number");

    element.label = undefined;

    expect(element.hasAttribute("label")).toBe(false);
  });

  it("reads an attribute not declared as undefined", () => {
    expect(create("ev-card-number").autoProgress).toBeUndefined();
  });

  it("takes a property set before the element upgraded", () => {
    const element = document.createElement("ev-card-number") as Element;
    Object.defineProperty(element, "autoProgress", {
      value: true,
      writable: true,
      configurable: true,
    });

    document.body.append(element);

    expect(Object.prototype.hasOwnProperty.call(element, "autoProgress")).toBe(
      false
    );
    expect(element.getAttribute("autoprogress")).toBe("");
  });
});
