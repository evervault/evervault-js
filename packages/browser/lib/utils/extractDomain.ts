/**
 * @deprecated only used in the auto algorithm
 * @param url
 * @returns
 */
export default function extractDomain(url: string): string | undefined {
  var result;
  var match;
  url = url.trim();
  if (
    (match = url.match(
      /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im
    ))
  ) {
    result = match[1];
    if ((match = result.match(/^[^\.]+\.(.+\..+)$/))) {
      result = match[1];
    }
  }
  return result;
}
