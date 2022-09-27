module.exports = function (config, theme, styles) {
  let stylesQuery = "";
  if (styles) {
    Object.keys(styles).map((key) => {
      stylesQuery += `&${key}=${encodeURIComponent(styles[key])}`;
    });
  }

  const { inputsUrl } = config.input;
  const { teamId, appId } = config;

  return `${inputsUrl}?team=${teamId}&app=${appId}${
    theme ? `&theme=${theme}` : ""
  }${stylesQuery}
  `;
};
