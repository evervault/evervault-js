import type EvervaultClient from "@evervault/browser";

declare global {
  interface Window {
    Evervault: typeof EvervaultClient;
  }
}
