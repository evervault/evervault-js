type ConstructSourceConfig = {
  teamId: string;
  appId: string;
  input: {
    inputsUrl: string;
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
    Object.keys(settings).map((key) => {
      settingsQuery += `&${key}=${encodeURIComponent(settings[key])}`;
    });
  }

  const { inputsUrl } = config.input;
  const { teamId, appId } = config;

  return `${inputsUrl}?team=${teamId}&app=${appId}${settingsQuery}&mode=${
    isReveal ? "reveal" : "inputs"
  }`;
}
