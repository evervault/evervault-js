export class EvervaultError extends Error {
  type: string;

  constructor(message?: string) {
    super(message);
    this.type = this.constructor.name;
  }
}

export class InitializationError extends EvervaultError {}

export class CryptoError extends EvervaultError {}

export class CageKeyError extends EvervaultError {}

export class ExceededMaxFileSizeError extends EvervaultError {}
