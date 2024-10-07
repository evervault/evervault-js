import { constructSource, calculateHeight } from "../utils";
import type { Config } from "../config";
import type { EvervaultRequestProps } from "../main";
import type {
  InputMessage,
  InputError,
  EvFrameHeight,
  EvRevealErrorEvent,
} from "../messages";
import type { InputSettings, RevealSettings } from "../types";

const isFrameHeightEvent = (event: InputMessage): event is EvFrameHeight =>
  event.data?.type === "EV_FRAME_HEIGHT";

const isRevealError = (event: InputMessage): event is EvRevealErrorEvent =>
  event.data?.type === "EV_REVEAL_ERROR_EVENT";

export default function Inputs(config: Config) {
  return {
    generate(
      id: string,
      settings: InputSettings | RevealSettings,
      isReveal = false,
      request: Request | EvervaultRequestProps | undefined = undefined,
      onCopyCallback: (() => void) | undefined = undefined
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

      window.addEventListener("message", (event: InputMessage) => {
        if (event.origin !== config.input.inputsOrigin) return;
        if (settings?.height === "auto" && isFrameHeightEvent(event)) {
          (
            (document.getElementById(id) as HTMLDivElement)
              .firstChild as HTMLIFrameElement
          ).height = event.data.height;
        }
      });

      const isInputsLoaded = new Promise<boolean>((resolve, reject) => {
        window.addEventListener("message", (event: InputMessage) => {
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
              const { customStyles } = settings as RevealSettings;
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
          if (isRevealError(event)) {
            const errorStr = event.data.error;
            if (errorStr) {
              try {
                const error = JSON.parse(errorStr) as InputError;
                try {
                  // Try and reconstruct the exact error type if available in this window context.
                  // TS despises this but we catch and throw a generic error so its fine.
                  const ErrorType = window[
                    error.type as keyof Window
                  ] as typeof Error;
                  reject(new ErrorType(error.message));
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e) {
                  reject(new Error(error.message));
                }
              } catch (e) {
                // eslint-disable-next-line prefer-promise-reject-errors
                reject(
                  `Failed to parse Error: ${
                    (e as Error).message
                  }, Unparsed: ${errorStr}`
                );
              }
            }
          }
          if (event.data?.type === "EV_REVEAL_LOADED" || isRevealError(event)) {
            if (isReveal) {
              resolve(true);
            }
          }
        });
      });

      return {
        isInputsLoaded,
        getData: () =>
          new Promise((res) => {
            const channel = new MessageChannel();

            channel.port1.onmessage = ({ data }) => {
              channel.port1.close();
              return res(data);
            };

            (
              document.getElementById("ev-iframe") as HTMLIFrameElement
            ).contentWindow?.postMessage("message", "*", [channel.port2]);
          }),
        on: (e: unknown, fn: (data: unknown) => void) => {
          if (e === "change") {
            window.addEventListener(
              "message",
              (event: InputMessage) => {
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
