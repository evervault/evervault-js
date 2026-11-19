import type { BrowserDetails } from "./types";

export function getBrowserDetails(): BrowserDetails {
  return {
    javaEnabled: window.navigator.javaEnabled(),
    javascriptEnabled: true,
    language: navigator.language,
    colorDepth: window.screen.colorDepth,
    screenHeight: window.screen.height,
    screenWidth: window.screen.width,
    timeZone: new Date().getTimezoneOffset(),
  };
}
