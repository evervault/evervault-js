export default function findChildOfForm(form: Element, elementType: string, elementName: string): Element {
  const field = form.querySelector(`${elementType}[name="${elementName}"]`);
  if (field === null) {
    throw new Error(`Could not find field with type ${elementType} and name ${elementName}`);
  }
  return field;
}
