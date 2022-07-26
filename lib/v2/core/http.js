const { errors } = require("../utils");

module.exports = (config, teamId, appId, context) => {
  if (!window.fetch)
    throw errors.InitializationError(
      "Your browser is outdated and does not support window.fetch(). Please upgrade it."
    );
  const request = (method, path, baseUrl, headers = {}, data = undefined) => {
    const options = {
      method,
      headers: { ...config.headers, ...headers },
    };
    if (data) {
      options.body = JSON.stringify(data);
    }

    return window.fetch(`${baseUrl}/${path}`, options);
  };
  const get = async (baseUrl, path, headers) => {
    const response = await request("GET", path, baseUrl, headers);
    return {
      headers: response.headers,
      body: await response.json(),
    };
  };
  const post = async (
    baseUrl,
    path,
    data,
    headers = { "Content-Type": "application/json" }
  ) => {
    const response = await request("POST", path, baseUrl, headers, data);

    return await response.json();
  };

  const getCageKey = async () => {
    try {
      const { headers, body } = await get(
        config.keysUrl,
        `${teamId}/apps/${appId}?context=${context}`
      );
      return {
        ...body,
        isDebugMode: headers.get("X-Evervault-Inputs-Debug-Mode") === "true",
      };
    } catch (err) {
      throw new errors.CageKeyError(
        "An error occurred while retrieving the cage's key"
      );
    }
  };

  const reportMetric = () => {
    try {
      post(config.metricsUrl, "", {
        teamUuid: teamId,
        appUuid: appId,
        event: "Data Encrypted",
      });
    } catch (err) {}
  };

  return { getCageKey, reportMetric };
};
