export default function constructSource(config, settings) {
  let settingsQuery = "";
  if (settings) {
    Object.keys(settings).map((key) => {
      settingsQuery += `&${key}=${encodeURIComponent(settings[key])}`;
    });
  }

  const { inputsUrl } = config.input;
  const { teamId, appId } = config;

  return `${inputsUrl}?team=${teamId}&app=${appId}${settingsQuery}
  `;
}
