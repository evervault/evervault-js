/**
 * @deprecated only used in the auto algorithm
 * @param url
 * @returns
 */
export default function extractDomain(url: string): string | undefined {
  let result;
  let match = url
    .trim()
    .match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im);
  if (match) {
    [, result] = match;
    match = result.match(/^[^\.]+\.(.+\..+)$/);
    if (match) {
      [, result] = match;
    }
  }
  return result;
}
