function findParentOfInput(input: Element): Element {
  let parent = input.parentElement;

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
