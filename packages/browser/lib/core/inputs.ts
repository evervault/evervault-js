import type { Config } from "../config";

import { constructSource, calculateHeight } from "../utils";

export default function Inputs(config: Config) {
  return {
    generate: function (id: string, settings: Record<string, any>) {
      // TODO: add error check in a seperate pr (small behavour change)
      (
        document.getElementById(id) as HTMLIFrameElement
      ).innerHTML = `<iframe src="${constructSource(
        config,
        // TODO: better typings for this (will affect user facing typings)
        settings
      )}" id="ev-iframe" title="Payment details" frameborder="0" scrolling="0" height=${calculateHeight(
        settings
      )}></iframe>`;

      window.addEventListener("message", (event) => {
        if (event.origin !== config.input.inputsOrigin) return;
        if (
          settings?.height === "auto" &&
          event.data?.type === "EV_FRAME_HEIGHT"
        ) {
          (document.getElementById(id) as HTMLIFrameElement).height =
            event.data.height;
        }
      });

      const isInputsLoaded = new Promise<boolean>((resolve) => {
        window.addEventListener("message", (event) => {
          if (event.origin !== config.input.inputsOrigin) return;
          if (event.data?.type === "EV_INPUTS_LOADED") {
            resolve(true);
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
