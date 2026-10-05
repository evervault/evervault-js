// Arrays are the same when their items are.
export default function isSameValue(current: unknown, next: unknown) {
  if (Array.isArray(current) && Array.isArray(next)) {
    return (
      current.length === next.length &&
      current.every((item, index) => item === next[index])
    );
  }

  return current === next;
}
