class EvervaultError extends Error {
  constructor(message) {
    super(message);
    this.type = this.constructor.name;
  }
}

class InitializationError extends EvervaultError {}

class CryptoError extends EvervaultError {}

class AccountError extends EvervaultError {}

class ApiKeyError extends EvervaultError {}

class CageKeyError extends EvervaultError {}

class RequestError extends EvervaultError {}

const mapApiResponseToError = ({ statusCode, body }) => {
  if (statusCode === 401) return new ApiKeyError("Invalid Api Key provided.");
  if (statusCode === 423)
    return new AccountError(
      body.message ||
        "Your account is still being set up. Refer to the account status page on app.evervault.com"
    );
  if (statusCode === 424)
    return new AccountError(
      body.message ||
        "An error occurred during account creation. Please contact evervault support."
    );
  return new RequestError(`Request returned with status [${statusCode}]`);
};

module.exports = {
  EvervaultError,
  CageKeyError,
  CryptoError,
  ApiKeyError,
  AccountError,
  InitializationError,
  mapApiResponseToError,
  RequestError,
};
