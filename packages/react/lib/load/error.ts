export type ScriptLoadErrorCode =
  | "window_not_available"
  | "head_or_body_not_found"
  | "amd_module_not_exported"
  | "amd_module_error"
  | "script_error"
  | "timed_out"
  | "evervault_not_available";

export class ScriptLoadError extends Error {
  public readonly code: ScriptLoadErrorCode;

  constructor(
    code: ScriptLoadErrorCode,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.code = code;
  }
}

export function isScriptLoadError(error: unknown): error is ScriptLoadError {
  return error instanceof ScriptLoadError;
}
