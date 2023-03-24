export class EvervaultError extends Error {
  constructor(message) {
    super(message);
    this.type = this.constructor.name;
  }
}

export class InitializationError extends EvervaultError {}

export class CryptoError extends EvervaultError {}

export class AccountError extends EvervaultError {}

export class ApiKeyError extends EvervaultError {}

export class CageKeyError extends EvervaultError {}

export class RequestError extends EvervaultError {}

export class ExceededMaxFileSizeError extends EvervaultError {}

export function mapApiResponseToError({ statusCode, body }) {
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
}
