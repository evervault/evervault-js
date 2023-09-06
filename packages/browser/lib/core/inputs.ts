import type { Config } from "../config";
import { EvervaultRequestProps } from "../main";

import { constructSource, calculateHeight } from "../utils";

export default function Inputs(config: Config) {
  return {
    generate: function (
      id: string,
      settings: Record<string, any>,
      isReveal: boolean = false,
      request?: Request | EvervaultRequestProps
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
        settings
      )} allowTransparency="true"></iframe>`;

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

      const isInputsLoaded = new Promise<boolean>((resolve) => {
        window.addEventListener("message", (event) => {
          if (event.origin !== config.input.inputsOrigin) return;
          if (event.data?.type === "EV_INPUTS_LOADED") {
            if (isReveal) {
              if (!request) {
                throw new Error("Request is required for Evervault Reveal");
              }
              const requestStr = JSON.stringify(request, [
                "bodyUsed",
                "cache",
                "credentials",
                "destination",
                "headers",
                "integrity",
                "isHistoryNavigation",
                "keepalive",
                "method",
                "mode",
                "redirect",
                "referrer",
                "referrerPolicy",
                "url",
              ]);

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
          }
          if (event.data?.type === "EV_REVEAL_LOADED") {
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
