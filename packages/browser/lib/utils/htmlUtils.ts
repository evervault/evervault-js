function findParentOfInput(input: Element): Element {
  const parent = input.parentElement;

  if (parent === null || parent === undefined) {
    return input;
  }

  if (parent.tagName === "FORM") {
    return parent;
  }

  return findParentOfInput(parent);
}

function findFormByHiddenField(uuid: string): Element | null {
  const hiddenFieldSelector = `ev_${uuid}`;
  const hiddenInput = document.querySelector(
    `input[name="${hiddenFieldSelector}"]`
  );
  return hiddenInput;
}

function findChildOfForm(
  form: HTMLFormElement | Element,
  elementType: string,
  elementName: string
): HTMLInputElement | HTMLTextAreaElement {
  const field = form.querySelector(`${elementType}[name="${elementName}"]`);

  if (field === null) {
    throw new Error(`Could not find field with type ${elementType} and name ${elementName}`);
  }

  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
    return field;
  } else {
    throw new Error(`Element found is not an input or textarea element.`);
  }
}

export { findParentOfInput, findFormByHiddenField, findChildOfForm };
