import { createContext } from "react";
import type { PromisifiedEvervaultClient } from "./main";

export const EvervaultContext =
  createContext<PromisifiedEvervaultClient | null>(null);
