import { ScriptLoadError } from "./error";

export interface LoadScriptOptions {
  /**
   * The timeout in milliseconds for the script load.
   * If the script load takes longer than the timeout, the promise will be rejected.
   */
  timeout?: number;
  /**
   * Reports whether a script element already in the document has finished.
   * A script that finished before this call never fires `load` again, so
   * adopting one without this check waits until the timeout instead.
   *
   * Nothing attributes a finished script to the URL that produced it, so a
   * caller can only answer this from a side effect the script is known to
   * have, such as a global it defines.
   */
  isLoaded?: () => boolean;
}

function findScript(url: string): HTMLScriptElement | null {
  let href: string;
  try {
    href = new URL(url, document.baseURI).href;
  } catch {
    href = url;
  }

  const scripts = document.querySelectorAll<HTMLScriptElement>("script[src]");
  for (const script of scripts) {
    if (script.src === href) return script;
  }

  return null;
}

export function loadScript(
  url: string,
  options?: LoadScriptOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    let script = findScript(url);
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
    } else if (options?.isLoaded?.()) {
      resolve();
      return;
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
