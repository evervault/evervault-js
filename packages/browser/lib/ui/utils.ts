export function generateID(length = 10): string {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}

export function resolveSelector(selector: string | HTMLElement) {
  if (typeof selector === "string") {
    const el = document.querySelector(selector);

    if (!el) {
      throw new Error(`Element with selector ${selector} not found`);
    }

    return el;
  }

  return selector;
}
