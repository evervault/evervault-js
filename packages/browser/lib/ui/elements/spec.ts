import type { CardSpecNode, CardSpecNodeType } from "types";

export const ELEMENTS: Record<string, CardSpecNodeType> = {
  "ev-row": "row",
  "ev-card-holder": "name",
  "ev-card-number": "number",
  "ev-card-expiry": "expiry",
  "ev-card-cvc": "cvc",
};

// Every mutation re-reads the children, so an unsupported one is named once.
const warned = new WeakSet<Element>();

export function warnUnknownChild(element: Element) {
  if (warned.has(element)) return;
  warned.add(element);

  const supported = Object.keys(ELEMENTS)
    .map((tag) => `<${tag}>`)
    .join(", ");

  console.warn(
    `<${element.localName}> is not a supported child of <ev-card> and will be ignored. Supported children are: ${supported}.`
  );
}

const ids = new WeakMap<Element, string>();
let counter = 0;

function idFor(element: Element) {
  let id = ids.get(element);

  if (!id) {
    counter += 1;
    id = `ev-${counter}`;
    ids.set(element, id);
  }

  return id;
}

function readAttributes(element: Element) {
  return Object.fromEntries(
    [...element.attributes].map((attribute) => [
      attribute.name,
      attribute.value,
    ])
  );
}

export function serialise(parent: Element): CardSpecNode[] {
  return [...parent.children]
    .map((element) => {
      const type = ELEMENTS[element.localName];

      if (!type) {
        warnUnknownChild(element);
        return null;
      }

      return {
        type,
        id: idFor(element),
        props: readAttributes(element),
        children: type === "row" ? serialise(element) : undefined,
      };
    })
    .filter((node) => node !== null);
}
