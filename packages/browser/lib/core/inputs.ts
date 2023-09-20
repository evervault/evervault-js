import { constructSource, calculateHeight } from "../utils";
import type { Config } from "../config";
import type { EvervaultRequestProps } from "../main";

export default function Inputs(config: Config) {
  return {
    generate(
      id: string,
      settings: Record<string, unknown>,
      isReveal = false,
      request?: Request | EvervaultRequestProps,
      onCopyCallback?: () => void
    ) {
      // TODO: add error check in a seperate pr (small behavour change)
      (
        document.getElementById(id) as HTMLIFrameElement
      ).innerHTML = `<iframe src="${constructSource(
        config,
        // TODO: better typings for this (will affect user facing typings)
        isReveal,
        settings
      )}" id="ev-iframe" title="Payment details" frameborder="0" scrolling="0" height=${calculateHeight(
        settings,
        isReveal
      )} ${
        isReveal ? 'width="100%"' : ""
      } allowTransparency="true" allow="clipboard-write"></iframe>`;

      window.addEventListener("message", (event) => {
        if (event.origin !== config.input.inputsOrigin) return;
        if (
          settings?.height === "auto" &&
          event.data?.type === "EV_FRAME_HEIGHT"
        ) {
          (
            (document.getElementById(id) as HTMLDivElement)
              .firstChild as HTMLIFrameElement
          ).height = event.data.height;
        }
      });

      const isInputsLoaded = new Promise<boolean>((resolve, reject) => {
        window.addEventListener("message", (event) => {
          if (event.origin !== config.input.inputsOrigin) return;
          if (event.data?.type === "EV_INPUTS_LOADED") {
            if (isReveal) {
              if (!request) {
                throw new Error("Request is required for Evervault Reveal");
              }

              const requestSerializable: EvervaultRequestProps = {
                cache: request.cache,
                credentials: request.credentials,
                destination: request.destination,
                integrity: request.integrity,
                keepalive: request.keepalive,
                method: request.method,
                mode: request.mode,
                referrer: request.referrer,
                referrerPolicy: request.referrerPolicy,
                url: request.url,
              };

              if (request.headers instanceof Headers) {
                requestSerializable.headers = Object.fromEntries(
                  request.headers.entries()
                );
              } else if (request.headers instanceof Object) {
                requestSerializable.headers = request.headers;
              }

              const requestStr = JSON.stringify(requestSerializable);

              // filter any urls from the custom styles
              const customStyles = settings?.customStyles
                ? removeUrlsFromStyles(settings?.customStyles)
                : undefined;
              const channel = new MessageChannel();
              (
                document.getElementById("ev-iframe") as HTMLIFrameElement
              ).contentWindow?.postMessage(
                {
                  type: "revealRequestConfig",
                  request: requestStr,
                  customStyles,
                },
                "*",
                [channel.port2]
              );
            } else {
              resolve(true);
            }
          } else if (event.data?.type === "EV_REVEAL_COPY_EVENT") {
            if (isReveal && onCopyCallback) {
              onCopyCallback();
            }
          }
          if (event.data?.type === "EV_REVEAL_ERROR_EVENT") {
            const errorStr = event.data?.error;
            if (errorStr) {
              try {
                const error = JSON.parse(errorStr);
                try {
                  // @ts-ignore
                  // Try and reconstruct the exact error type if available in this window context.
                  // TS despises this but we catch and throw a generic error so its fine.
                  reject(new window[error.type](error.message));
                } catch (e) {
                  reject(new Error(error.message));
                }
              } catch (e) {
                reject(`Failed to parse Error: ${e}, Unparsed: ${errorStr}`);
              }
            }
          }
          if (
            event.data?.type === "EV_REVEAL_LOADED" ||
            event.data?.type === "EV_REVEAL_ERROR_EVENT"
          ) {
            if (isReveal) {
              resolve(true);
            }
          }
        });
      });

      return {
        isInputsLoaded,
        getData: () =>
          new Promise((res, rej) => {
            const channel = new MessageChannel();

            channel.port1.onmessage = ({ data }) => {
              channel.port1.close();
              return res(data);
            };

            (
              document.getElementById("ev-iframe") as HTMLIFrameElement
            ).contentWindow?.postMessage("message", "*", [channel.port2]);
          }),
        on: (event: "change" | unknown, fn: (data: unknown) => void) => {
          if (event === "change") {
            window.addEventListener(
              "message",
              (event) => {
                if (event.origin !== config.input.inputsOrigin) return;
                if (event.data?.type === "EV_FRAME_HEIGHT") return;
                if (event.data?.type === "EV_INPUTS_LOADED") return;
                if (event.data?.type === "EV_FRAME_READY") return;
                if (event.data?.type === "EV_REVEAL_COPY_EVENT") return;
                if (event.data?.type === "EV_REVEAL_LOADED") return;
                if (event.data?.type === "EV_REVEAL_ERROR_EVENT") return;
                fn(event.data);
              },
              false
            );
          }
        },
        setLabels: (labels: Record<string, unknown>) => {
          const channel = new MessageChannel();
          (
            document.getElementById("ev-iframe") as HTMLIFrameElement
          ).contentWindow?.postMessage(labels, "*", [channel.port2]);
        },
      };
    },
  };
}

function removeUrlsFromStyles(customStyles: unknown) {
  const newStyles = { ...customStyles };
  for (const group in newStyles) {
    for (const key in newStyles[group]) {
      if (typeof newStyles[group][key] === "string") {
        if (newStyles[group][key].match(/url\([^)]+\)/g, "none")) {
          delete newStyles[group][key];
        }
      }
    }
  }
  return newStyles;
}
