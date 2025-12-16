import { EvervaultFrame } from "./evervaultFrame";
import type Reveal from "./reveal";
import type EvervaultClient from "../main";
import type {
  ColorScheme,
  EvervaultFrameHostMessages,
  RevealConsumerClientMessages,
  RevealFormat,
  SelectorType,
  ThemeDefinition,
} from "types";

export interface RevealTextOptions {
  colorScheme?: ColorScheme;
  theme?: ThemeDefinition;
  format?: RevealFormat;
}

export default class RevealText {
  path: string;
  ready = false;
  #reveal: Reveal;
  #frame: EvervaultFrame<
    RevealConsumerClientMessages,
    EvervaultFrameHostMessages
  >;

  #options: RevealTextOptions;

  constructor(
    reveal: Reveal,
    client: EvervaultClient,
    path: string,
    options?: RevealTextOptions
  ) {
    this.path = path;
    this.#reveal = reveal;
    this.#options = options ?? {};
    this.#frame = new EvervaultFrame(client, "RevealText", {
      colorScheme: this.#options.colorScheme,
    });

    this.#frame.on("EV_REVEAL_CONSUMER_READY", () => {
      this.ready = true;
      reveal.checkIfReady();
    });
  }

  mount(selector: SelectorType) {
    this.#frame.mount(selector, {
      theme: this.#options.theme,
      config: {
        path: this.path,
        channel: this.#reveal.channel,
        format: this.#options.format,
      },
    });

    return this;
  }

  unmount() {
    this.#frame.unmount();
    return this;
  }
}
