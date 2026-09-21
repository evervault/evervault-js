import { ScriptLoadError } from "./error";

export interface LoadScriptOptions {
  /**
   * The timeout in milliseconds for the script load.
   * If the script load takes longer than the timeout, the promise will be rejected.
   */
  timeout?: number;
}

export function loadScript(
  url: string,
  options?: LoadScriptOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Find or create the script element
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${url}"]`
    );
    if (!script) {
      script = document.createElement("script");

      const headOrBody = document.head || document.body;
      if (!headOrBody) {
        reject(
          new ScriptLoadError(
            "head_or_body_not_found",
            "Expected document.body not to be null. Evervault.js requires a <body> element."
          )
        );
        return;
      }

      headOrBody.appendChild(script);
    }

    let timeout: NodeJS.Timeout | undefined;

    // Resolve the promise if the script loads
    script.addEventListener(
      "load",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true }
    );

    // Reject the promise if the script load fails
    script.addEventListener(
      "error",
      (event) => {
        clearTimeout(timeout);
        reject(
          new ScriptLoadError(
            "script_error",
            "Failed to load Evervault.js. See the cause for more details.",
            {
              cause: event.error,
            }
          )
        );
      },
      { once: true }
    );

    script.src = url;

    if (options?.timeout) {
      // Reject the promise if the script load times out
      timeout = setTimeout(() => {
        reject(
          new ScriptLoadError(
            "timed_out",
            `Failed to load Evervault.js after ${options.timeout}ms.`
          )
        );
      }, options.timeout);
    }
  });
}
