module.exports = function (config, theme, styles) {
  let stylesQuery = "";
  if (styles) {
    Object.keys(styles).map((key) => {
      stylesQuery += `&${key}=${styles[key]}`;
    });
  }

  const { inputsUrl } = config.input;
  const { teamId } = config;

  return `${inputsUrl}/?team=${teamId}${
    theme ? `&theme=${theme}` : ""
  }${encodeURIComponent(stylesQuery)}
  `;
};
