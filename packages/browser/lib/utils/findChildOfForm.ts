export default function findChildOfForm(form: Element, fieldType: string, name: string): Element {
  const field = form.querySelector(`${fieldType}[name="${name}"]`);
  if (field === null) {
    throw new Error(`Could not find field with type ${fieldType} and name ${name}`);
  }
  return field;
}
