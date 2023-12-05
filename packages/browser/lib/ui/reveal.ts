import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import RevealCopyButton, { RevealCopyButtonOptions } from "./revealCopyButton";
import RevealText, { RevealTextOptions } from "./revealText";
import { generateID } from "./utils";
import type EvervaultClient from "../main";
import type {
  EvervaultFrameHostMessages,
  RevealRequestClientMessages,
} from "types";

interface RevealEvents {
  ready: () => void;
  error: () => void;
}

// The reveal component mounts a hidden iFrame to the page and passes a request
// object which gets carrier out inside of the hidden iFrame. The reveal component
// then exposes child "consumer" components which render their own iframes that
// communicate with the hidden iFrame to retrieve the data from the request response.
export default class Reveal {
  ready = false;
  channel: string;
  #client: EvervaultClient;
  #request: Request;
  #frame: EvervaultFrame<
    RevealRequestClientMessages,
    EvervaultFrameHostMessages
  >;

  consumers: (RevealText | RevealCopyButton)[] = [];

  #events = new EventManager<RevealEvents>();

  constructor(client: EvervaultClient, request: Request) {
    this.channel = generateID();
    this.#client = client;
    this.#request = request;
    this.#frame = new EvervaultFrame(client, "RevealRequest");
    this.#frame.iframe.style.position = "absolute";
    this.#frame.iframe.style.pointerEvents = "none";
    this.#frame.iframe.style.opacity = "0";
    this.#mount().catch(console.error);

    this.#frame.on("EV_REVEAL_REQUEST_READY", () => {
      this.ready = true;
      this.checkIfReady();
    });

    this.#frame.on("EV_ERROR", () => {
      this.#emitError();
    });
  }

  async #mount() {
    this.#frame.mount(document.body, {
      config: {
        channel: this.channel,
        request: await this.#serializedRequest(),
      },
      onError: () => {
        this.#emitError();
      },
    });
  }

  async #serializedRequest() {
    return {
      cache: this.#request.cache,
      credentials: this.#request.credentials,
      destination: this.#request.destination,
      integrity: this.#request.integrity,
      keepalive: this.#request.keepalive,
      method: this.#request.method,
      mode: this.#request.mode,
      referrer: this.#request.referrer,
      referrerPolicy: this.#request.referrerPolicy,
      url: this.#request.url,
      body: await this.#request.text(),
      headers: Object.fromEntries(this.#request.headers.entries()),
    };
  }

  #emitError() {
    this.#events.dispatch("error");
  }

  text(path: string, options?: RevealTextOptions) {
    const text = new RevealText(this, this.#client, path, options);
    this.consumers.push(text);
    return text;
  }

  copyButton(path: string, options?: RevealCopyButtonOptions) {
    const btn = new RevealCopyButton(this, this.#client, path, options);
    this.consumers.push(btn);
    return btn;
  }

  unmount() {
    this.consumers.forEach((consumer) => consumer.unmount());
    this.#frame.unmount();
    return this;
  }

  on<T extends keyof RevealEvents>(event: T, callback: RevealEvents[T]) {
    return this.#events.on(event, callback);
  }

  // Only emit the ready event when the request frame and all of its consumers are ready
  checkIfReady() {
    if (!this.ready) return;
    const consumersReady = this.consumers.every((consumer) => consumer.ready);
    if (!consumersReady) return;
    this.#events.dispatch("ready");
  }
}
