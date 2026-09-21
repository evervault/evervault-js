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
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${url}"]`
    );
    let injected = false;
    if (!script) {
      script = document.createElement("script");
      injected = true;

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

    script.addEventListener(
      "load",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true }
    );

    script.addEventListener(
      "error",
      (event) => {
        clearTimeout(timeout);
        if (injected) script.remove();
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

    // A script element that has already started never re-fetches, so setting
    // src on an adopted element would leave both listeners waiting forever.
    if (injected) script.src = url;

    if (options?.timeout) {
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
