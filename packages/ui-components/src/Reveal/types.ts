import type { RevealFormat, ThemeObject } from "types";

export interface RevealTextConfig {
  channel: string;
  path: string;
  theme?: ThemeObject;
  format?: RevealFormat;
}

export interface RevealRequestConfig {
  channel: string;
  request: Request;
}

export interface RevealBroadcastMessages {
  DATA_RECEIVED: JSON;
  REVEAL_CONSUMER_READY: null;
}

export interface RevealCopyButtonConfig {
  channel: string;
  path: string;
  text?: string;
  icon?: string;
  theme?: ThemeObject;
  format?: RevealFormat;
}
