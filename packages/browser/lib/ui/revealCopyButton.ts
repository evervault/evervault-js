import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type Reveal from "./reveal";
import type EvervaultClient from "../main";
import type {
  EvervaultFrameHostMessages,
  RevealConsumerClientMessages,
  RevealFormat,
  SelectorType,
  ThemeDefinition,
} from "types";

export interface RevealCopyButtonOptions {
  theme?: ThemeDefinition;
  text?: string;
  icon?: string;
  format?: RevealFormat;
}

interface RevealCopyButtonEvents {
  copy: () => void;
}

export default class RevealCopyButton {
  path: string;
  ready = false;
  options: RevealCopyButtonOptions;
  #reveal: Reveal;
  #frame: EvervaultFrame<
    RevealConsumerClientMessages,
    EvervaultFrameHostMessages
  >;

  #events = new EventManager<RevealCopyButtonEvents>();

  constructor(
    reveal: Reveal,
    client: EvervaultClient,
    path: string,
    options?: RevealCopyButtonOptions
  ) {
    this.path = path;
    this.#reveal = reveal;
    this.options = options ?? {};

    this.#frame = new EvervaultFrame(client, "RevealCopyButton", {
      allow: "clipboard-read; clipboard-write",
    });

    this.#frame.on("EV_REVEAL_CONSUMER_READY", () => {
      this.ready = true;
      reveal.checkIfReady();
    });

    this.#frame.on("EV_COPY", () => {
      this.#events.dispatch("copy");
    });
  }

  mount(selector: SelectorType) {
    this.#frame.mount(selector, {
      theme: this.options.theme,
      config: {
        path: this.path,
        text: this.options.text,
        icon: this.options.icon,
        channel: this.#reveal.channel,
        format: this.options.format,
      },
    });

    return this;
  }

  unmount() {
    this.#frame.unmount();
    return this;
  }

  on<T extends keyof RevealCopyButtonEvents>(
    event: T,
    callback: RevealCopyButtonEvents[T]
  ) {
    return this.#events.on(event, callback);
  }
}
