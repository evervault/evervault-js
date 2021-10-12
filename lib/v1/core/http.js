const { SourceMapDevToolPlugin } = require('webpack');
const { errors } = require('../utils');

module.exports = (config, teamId) => {
  if (!window.fetch) throw errors.InitializationError('Your browser is outdated and does not support window.fetch(). Please upgrade .');
  const request = (method, path, baseUrl, headers = {}, data = undefined) => {
    const options = {
      method,
      headers: {...config.headers, ...headers},
    };
    if (data) {
      options.body = JSON.stringify(data)
    }

    return window.fetch(`${baseUrl}/${path}`, options);
  };
  const get = async (baseUrl, path, headers) => {
      const response = await request('GET', path, baseUrl, headers);

      return response.json()
  };
  const post = async (baseUrl, path, data, headers = {'Content-Type': 'application/json'}) => {
    const response = await request('POST', path, baseUrl, headers, data);

    return response.json()
  };

  const getCageKey = async () => {
      try {
        // return await get(config.keysUrl,`${teamId}`)
        return config.keysUrl.includes("localhost") ? await get(`${config.keysUrl}`, `teams/${teamId}`) : await get(config.keysUrl,`${teamId}`)
      } catch (err) {
        throw new errors.CageKeyError(
            "An error occurred while retrieving the cage's key"
        );
      }
  };

  const reportMetric = () => {
    try {
      post(
        config.metricsUrl, '', { teamUuid: teamId, event: 'Data Encrypted'});
    } catch (err) {}
  }

  return { getCageKey, reportMetric };
};
