// What the card logs for the developer, shared with the tests that check it.

export function unreportableFieldName(name: string) {
  return `Card.Field "${name}" is never reported: a name cannot contain ".".`;
}

export function duplicateFieldName(name: string) {
  return `Card.Field "${name}" is declared more than once; only the first is reported.`;
}
