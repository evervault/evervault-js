/**
 * Check if the user is using Chrome on iOS
 * @returns {boolean}
 */
export function isChromeiOS() {
  return window.navigator.userAgent.includes("CriOS");
}
