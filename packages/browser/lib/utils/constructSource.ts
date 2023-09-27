import type { InputConfig } from "../config";
import type { InputSettings, RevealSettings } from "../types";

const INPUTS_URL_SLUG = "/v2/index.html";
const REVEAL_URL_SLUG = "/v2/reveal.html";

type Key = keyof (InputSettings | RevealSettings);
interface ConstructSourceConfig {
  teamId: string;
  appId: string;
  input: InputConfig;
}

// Settings will become more specific in future
export default function constructSource(
  config: ConstructSourceConfig,
  isReveal: boolean,
  settings?: InputSettings | RevealSettings
) {
  let settingsQuery = "";

  // TODO: use URLSearchParams
  if (settings) {
    Object.keys(settings)
      .filter((k) => k !== "customStyles")
      .forEach((key) => {
        const value = settings[key as Key];
        if (value !== undefined) {
          settingsQuery += `&${key}=${encodeURIComponent(value)}`;
        }
      });
  }

  const { inputsOrigin } = config.input;
  const { teamId, appId } = config;

  let inputsUrl = inputsOrigin + INPUTS_URL_SLUG;
  if (isReveal) {
    inputsUrl = inputsOrigin + REVEAL_URL_SLUG;
  }

  return `${inputsUrl}?team=${teamId}&app=${appId}${settingsQuery}&mode=${
    isReveal ? "reveal" : "inputs"
  }`;
}
