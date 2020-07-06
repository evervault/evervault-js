const { errors } = require('../utils');

module.exports = (config, teamId) => {
  if (!window.fetch) throw errors.InitializationError('Your browser is outdated and does not support window.fetch(). Please upgrade .');
  const request = (method, path, headers = {}, data = undefined) => {
    const options = {
        method,
        headers: { ...config.headers, ...headers },
    };

    if (data && data.length > 0) {
        options.body = JSON.stringify(data)
    }

    return window.fetch(`${config.baseUrl}/${path}`, options);
  };
  const get = async (path, headers) => {
      const response = await request('GET', path, headers);

      return response.json()
  };
  const post = async (path, data, headers = { 'Content-Type': 'application/json' }) => {
      const response = await request('POST', path, headers, data);

      return response.json()
  }

  const getCageKey = async () => {
      try {
        return await get(`teams/${teamId}/key`)
      } catch (err) {
        throw new errors.CageKeyError(
            "An error occurred while retrieving the cage's key"
        );
      }
  };

  return { getCageKey };
};