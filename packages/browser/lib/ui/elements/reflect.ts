// An attribute is "reflected" when a property reads and writes it, as
// `input.readOnly` does the `readonly` attribute:
// https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Reflected_attributes

// How a property's value is written as its attribute: `switch` also reads
// "off" as off, as `autocomplete` does.
export type ReflectionKind = "flag" | "switch" | "text" | "number" | "list";

// For an attribute whose property holds more than its text: reads and writes
// the two together.
export interface Codec<E extends Element> {
  get(element: E): unknown;
  set(element: E, value: unknown): void;
}

export type Reflection<E extends Element = Element> = [
  property: keyof E & string,
  kind: ReflectionKind | Codec<E>
];

// As HTML names them: `readOnly` is `readonly`, `autoProgress` `autoprogress`.
export function attributeFor(property: string) {
  return property.toLowerCase();
}

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

export function writeAttribute(
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
export function reflect<E extends Element>(
  prototype: E,
  reflections: readonly Reflection<E>[]
) {
  for (const [property, kind] of reflections) {
    const attribute = attributeFor(property);

    Object.defineProperty(prototype, property, {
      configurable: true,
      enumerable: true,
      get(this: E) {
        if (typeof kind === "object") return kind.get(this);
        return readAttribute(this, attribute, kind);
      },
      set(this: E, value: unknown) {
        if (typeof kind === "object") kind.set(this, value);
        else writeAttribute(this, attribute, kind, value);
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
