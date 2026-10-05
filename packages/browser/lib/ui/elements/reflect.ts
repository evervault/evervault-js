// An attribute is "reflected" when a property reads and writes it, as
// `input.readOnly` does the `readonly` attribute:
// https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Reflected_attributes

// How an attribute's text is read as its property's value.
export type ReflectionKind = "flag" | "text";

export function readAttribute(
  element: Element,
  attribute: string,
  kind: ReflectionKind
) {
  const value = element.getAttribute(attribute);

  if (value === null) return undefined;

  // Declaring the attribute is what turns it on; only an explicit denial is
  // false.
  if (kind === "flag") return value.trim().toLowerCase() !== "false";

  return value;
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
