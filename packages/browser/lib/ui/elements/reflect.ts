// An attribute is "reflected" when a property reads and writes it, as
// `input.readOnly` does the `readonly` attribute:
// https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Reflected_attributes

// How a property's value is written as its attribute: `switch` also reads
// "off" as off, as `autocomplete` does.
export type ReflectionKind = "flag" | "switch" | "text" | "number" | "list";

export type Reflection = [
  property: string,
  attribute: string,
  kind: ReflectionKind
];

export function readAttribute(
  element: Element,
  attribute: string,
  kind: ReflectionKind
) {
  const value = element.getAttribute(attribute);

  if (value === null) return undefined;

  if (kind === "flag" || kind === "switch") {
    const denials = kind === "switch" ? ["false", "off"] : ["false"];
    return !denials.includes(value.trim().toLowerCase());
  }

  if (kind === "number") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  if (kind === "list") return value.split(/\s+/).filter(Boolean);

  return value;
}

function write(
  element: Element,
  attribute: string,
  kind: ReflectionKind,
  value: unknown
) {
  if (value === undefined || value === null) {
    element.removeAttribute(attribute);
    return;
  }

  if (kind === "flag" || kind === "switch") {
    element.setAttribute(attribute, value ? "" : "false");
    return;
  }

  if (kind === "list") {
    element.setAttribute(attribute, (value as unknown[]).join(" "));
    return;
  }

  element.setAttribute(attribute, String(value));
}

// The attribute holds the value: the property reads it and writes it, so the
// two never disagree.
export function reflect(prototype: object, reflections: Reflection[]) {
  for (const [property, attribute, kind] of reflections) {
    Object.defineProperty(prototype, property, {
      configurable: true,
      enumerable: true,
      get(this: Element) {
        return readAttribute(this, attribute, kind);
      },
      set(this: Element, value: unknown) {
        write(this, attribute, kind, value);
      },
    });
  }
}

// A property set before the element upgraded sits on the instance, where it
// shadows the accessor; it is taken through the accessor instead.
export function adoptProperties(element: object, properties: string[]) {
  const own = element as Record<string, unknown>;

  for (const property of properties) {
    if (!Object.prototype.hasOwnProperty.call(element, property)) continue;

    const value = own[property];
    delete own[property];
    own[property] = value;
  }
}

// Importing an element must not need a DOM; it is only registered where there
// is one.
export const ElementBase = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;
