function findParentOfInput(input: Element): HTMLFormElement | null {
  const parent = input.parentElement;

  if (parent === null || parent === undefined) {
    return null;
  }

  if (parent.tagName === "FORM") {
    return parent as HTMLFormElement;
  }

  return findParentOfInput(parent);
}

function findFormByHiddenField(
  uuid: string,
): Element | null {
  const hiddenFieldSelectors = [`ev_${uuid}`, uuid];
  let hiddenInput = null;
  hiddenFieldSelectors.forEach((selector) => {
    const field = document.querySelector(`input[name="${selector}"]`);
    if (field !== null) {
      hiddenInput = field;
    }
  });
  return hiddenInput;
}

function findChildOfForm(
  form: Element,
  elementType: string,
  elementName: string
): Element {
  const field = form.querySelector(`${elementType}[name="${elementName}"]`);
  if (field === null) {
    throw new Error(
      `Could not find field with type ${elementType} and name ${elementName}`
    );
  }
  return field;
}

export { findParentOfInput, findFormByHiddenField, findChildOfForm };
