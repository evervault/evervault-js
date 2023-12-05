import type { ThemeObject } from "types";

export interface PinConfig {
  autoFocus?: boolean;
  theme?: ThemeObject;
  length?: number;
  mode?: "numeric" | "alphanumeric";
  inputType?: "number" | "text" | "password";
}
