export default function findParentOfInput(input: Element): Element {
  let parent = input.parentElement;

  if (parent === null || parent === undefined) {
    return input;
  }

  if (parent.tagName === 'FORM') {
    return parent;
  }

  return findParentOfInput(parent);
}
