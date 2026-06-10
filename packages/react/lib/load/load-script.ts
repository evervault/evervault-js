export function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${url}"]`
    );

    if (!script) {
      script = document.createElement("script");

      const headOrBody = document.head || document.body;
      if (!headOrBody) {
        reject(
          new Error(
            "Expected document.body not to be null. Evervault.js requires a <body> element."
          )
        );
        return;
      }

      headOrBody.appendChild(script);
    }

    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject());

    script.src = url;
  });
}
