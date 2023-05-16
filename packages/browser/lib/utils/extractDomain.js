// @ts-check

/**
 * 
 * @param {string} url 
 * @returns {string | undefined}
 */
export default function extractDomain(url) {
  // This is only used in the auto function which is 
  // deprecated/not documented ,so were not doing a full 
  // ts conversion

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
