export class EvervaultError extends Error {
  type: string;

  constructor(message?: string, options?: { cause?: unknown }) {
    if (message != null && options != null) {
      super(message, options);
    } else {
      super(message);
    }
    this.type = this.constructor.name;
  }
}

export class InitializationError extends EvervaultError {}

export class CryptoError extends EvervaultError {}

export class CageKeyError extends EvervaultError {}

export class ExceededMaxFileSizeError extends EvervaultError {}

export class DecryptError extends EvervaultError {}
