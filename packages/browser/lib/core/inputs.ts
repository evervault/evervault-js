import type { Config } from "../config";
import type { EvervaultRequestProps } from "../main";

import { constructSource, calculateHeight } from "../utils";

export default function Inputs(config: Config) {
  return {
    generate: function (
      id: string,
      settings: Record<string, any>,
      isReveal: boolean = false,
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

              let requestSerializable: EvervaultRequestProps = {
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

              const channel = new MessageChannel();
              (
                document.getElementById("ev-iframe") as HTMLIFrameElement
              ).contentWindow?.postMessage(
                {
                  type: "revealRequestConfig",
                  request: requestStr,
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
            reject(event.data?.error);
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
        on: (event: "change" | unknown, fn: (data: any) => void) => {
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
        setLabels: (labels: Record<string, any>) => {
          const channel = new MessageChannel();
          (
            document.getElementById("ev-iframe") as HTMLIFrameElement
          ).contentWindow?.postMessage(labels, "*", [channel.port2]);
        },
      };
    },
  };
}
