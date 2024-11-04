import { Theme } from "./theme";
import { generateID, resolveSelector } from "./utils";
import type { EvervaultFrameMessageDetail } from "./types";
import type EvervaultClient from "../main";
import type {
  EvervaultFrameClientMessages,
  EvervaultFrameHostMessages,
  SelectorType,
  ThemeDefinition,
} from "types";

interface FrameConfiguration {
  theme?: ThemeDefinition;
  config?: unknown;
  onError?: OnErrorEventHandler;
}

interface FrameOptions {
  allow?: string;
  size?: { width: string; height: string };
}

// The EvervaultFrame class is responsible for creating and managing the iframe
// that is used to render the component. It also handles communication between
// the iframe and the parent window.
export class EvervaultFrame<
  ReceivableMessages extends EvervaultFrameClientMessages = EvervaultFrameClientMessages,
  SendableMessages extends EvervaultFrameHostMessages = EvervaultFrameHostMessages
> {
  iframe: HTMLIFrameElement;
  payload: unknown;
  #id = generateID();
  #theme: Theme | null = null;
  #client: EvervaultClient;
  #ready = false;
  #size?: { width: string; height: string };

  // The constructor accepts an EV client and component name and generates the URL
  // for the iframe. The component param is used to determine which component to render
  // in the iframe.
  constructor(
    client: EvervaultClient,
    component: string,
    options?: FrameOptions
  ) {
    this.#client = client;
    this.iframe = document.createElement("iframe");
    this.iframe.id = this.#id;
    this.iframe.src = this.#generateUrl(component);
    this.iframe.dataset.evervault = "component";
    this.iframe.style.height = "0";
    this.iframe.style.border = "none";
    this.iframe.style.width = "100%";
    this.iframe.style.display = "block";
    this.iframe.allow = "payment";

    if (options?.size) {
      this.setSize(options.size);
    }

    this.iframe.setAttribute("ev-component", component);

    if (options?.allow) {
      this.iframe.allow = options.allow;
    }
  }

  setSize(size: { width: string; height: string }) {
    this.#size = size;
    this.iframe.style.width = size.width;
    this.iframe.style.height = size.height;
  }

  // After instantiating the EvervaultFrame class, it needs to be mounted
  // to the DOM. This method accepts a selector or HTMLElement and appends
  // the iframe to the element.
  mount(selector: SelectorType, opts: FrameConfiguration = {}) {
    if (this.isMounted) {
      throw new Error("Evervault frame already mounted");
    }

    const element = resolveSelector(selector);

    this.#theme = opts.theme ? new Theme(this, opts.theme) : null;

    // The frame will trigger an EV_FRAME_READY event when it is ready to
    // receive messages from the parent window.
    this.on("EV_FRAME_HANDSHAKE", () => {
      this.#setupListeners();
      // Once the frame is ready, we send an EV_INIT event to the frame with
      // the theme and configurgation for the frame.
      this.send("EV_INIT", {
        theme: this.#theme?.compile(),
        config: opts.config,
      });
    });

    this.on("EV_FRAME_READY", () => {
      this.#ready = true;
    });

    this.iframe.onerror = opts.onError ?? null;

    element.appendChild(this.iframe);

    return this;
  }

  unmount(): this {
    this.iframe.remove();

    const overlay = document.getElementById(`ev-modal-${this.#id}`);
    overlay?.remove();

    return this;
  }

  // Creates a full screen container which can then be used to mount the iframe
  // into. This is useful when you want to render the iframe in a modal. Overlays
  // are automatically removed when the iframe is unmounted.
  createOverlay(): HTMLDivElement {
    const container = document.createElement("div");
    container.id = `ev-modal-${this.#id}`;
    container.style.position = "fixed";
    container.style.inset = "0px";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
    return container;
  }

  // Takes an update configuration object and posts it into the iframe via an
  // EV_UPDATE event.
  update(opts?: FrameConfiguration): this {
    if (opts?.theme) {
      if (!this.#theme) {
        this.#theme = new Theme(this, opts.theme);
      } else {
        this.#theme?.update(opts.theme);
      }
    }

    if (!this.#ready) return this;

    this.send("EV_UPDATE", {
      theme: this.#theme?.compile(),
      config: opts?.config,
    });

    return this;
  }

  // The on method can be used to setup event listeners for messages sent from
  // the iframe. This will automatically filter out messages that are not
  // intended for this instance of the EvervaultFrame class by comparing the
  // frame ID.
  on<K extends keyof ReceivableMessages>(
    event: K,
    callback: (message: ReceivableMessages[K]) => void
  ) {
    const handleMessage = (e: MessageEvent<EvervaultFrameMessageDetail>) => {
      if (e.data.frame !== this.#id) return;
      if (e.data.type === event)
        callback(e.data.payload as ReceivableMessages[K]);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }

  once<K extends keyof ReceivableMessages>(
    event: K,
    callback: (message: ReceivableMessages[K]) => void
  ) {
    const handleMessage = (e: MessageEvent<EvervaultFrameMessageDetail>) => {
      if (e.data.frame !== this.#id) return;
      if (e.data.type === event) {
        callback(e.data.payload as ReceivableMessages[K]);
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }

  // The send method is used to send messages to the iframe.
  send<K extends keyof SendableMessages>(
    type: K,
    payload?: SendableMessages[K]
  ) {
    if (!this.iframe.contentWindow) {
      return;
    }

    const data = { type, payload };
    this.iframe.contentWindow?.postMessage(data, this.url);
  }

  get isMounted() {
    return !!this.iframe.parentNode;
  }

  get url() {
    return this.#client.config.components.url;
  }

  #generateUrl(component: string) {
    const url = new URL(this.url);
    url.searchParams.set("id", this.#id);
    url.searchParams.set("app", this.#client.config.appId);
    url.searchParams.set("team", this.#client.config.teamId);
    url.searchParams.set("component", component);
    return url.toString();
  }

  #setupListeners() {
    this.on("EV_RESIZE", ({ height }) => {
      if (!this.iframe || this.#size) return;
      this.iframe.style.height = `${height}px`;
    });
  }
}
