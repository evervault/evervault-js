/// <reference types="vite/client" />

import Evervault, { CustomConfig } from "@evervault/browser"; // eslint-disable-line @typescript-eslint/no-unused-vars

declare global {
  const Evervault: new (string, string, CustomConfig) => Evervault;
}
