const INPUTS_URL_SLUG = "/v2/index.html";
const REVEAL_URL_SLUG = "/v2/reveal.html";

type ConstructSourceConfig = {
  teamId: string;
  appId: string;
  input: {
    inputsOrigin: string;
  };
};

// Settings will become more specific in future
export default function constructSource(
  config: ConstructSourceConfig,
  isReveal: boolean,
  settings?: Record<string, any>
) {
  let settingsQuery = "";

  // TODO: use URLSearchParams
  if (settings) {
    Object.keys(settings)
      .filter((k) => k !== "customStyles")
      .map((key) => {
        settingsQuery += `&${key}=${encodeURIComponent(settings[key])}`;
      });
  }

  let { inputsOrigin } = config.input;
  const { teamId, appId } = config;

  let inputsUrl = inputsOrigin + INPUTS_URL_SLUG;
  if (isReveal) {
    inputsUrl = inputsOrigin + REVEAL_URL_SLUG;
  }

  return `${inputsUrl}?team=${teamId}&app=${appId}${settingsQuery}&mode=${
    isReveal ? "reveal" : "inputs"
  }`;
}
