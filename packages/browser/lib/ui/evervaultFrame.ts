import { Theme } from "./theme";
import { generateID, resolveSelector } from "./utils";
import type { EvervaultFrameMessageDetail } from "./types";
import type EvervaultClient from "../main";
import type {
  ColorScheme,
  EvervaultFrameClientMessages,
  EvervaultFrameHostMessages,
  SelectorType,
  ThemeDefinition,
} from "types";

const VALID_COLOR_SCHEMES: ColorScheme[] = [
  "normal",
  "light",
  "dark",
  "only light",
  "only dark",
  "light dark",
];

interface FrameConfiguration {
  theme?: ThemeDefinition;
  config?: unknown;
  onError?: OnErrorEventHandler;
}

interface FrameOptions {
  colorScheme?: ColorScheme;
  allow?: string;
  size?: {
    width: string;
    height: string;
  };
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
  #component: string;
  #ready = false;
  #size?: { width: string; height: string };
  #lifecycle: "unmounted" | "hidden" | "visible" = "unmounted";
  #preloadWidth: string | null = null;
  #preloadResizeObserver: ResizeObserver | null = null;
  #destroyed = false;
  #unsubscribes: (() => void)[] = [];
  #mountUnsubscribes: (() => void)[] = [];

  // The constructor accepts an EV client and component name and generates the URL
  // for the iframe. The component param is used to determine which component to render
  // in the iframe.
  constructor(
    client: EvervaultClient,
    component: string,
    options?: FrameOptions
  ) {
    this.#client = client;
    this.#component = component;
    this.iframe = document.createElement("iframe");
    this.iframe.id = this.#id;
    this.iframe.src = this.#generateUrl(component, options);
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
    if (!this.#live()) return this;

    if (this.isMounted) {
      throw new Error("Evervault frame already mounted");
    }

    this.#boot(resolveSelector(selector), opts);
    this.#lifecycle = "visible";

    return this;
  }

  preload(selector: SelectorType, opts: FrameConfiguration = {}) {
    if (!this.#live()) return this;

    if (this.#lifecycle !== "unmounted") {
      return this;
    }

    const element = resolveSelector(selector);

    this.iframe.style.visibility = "hidden";
    this.iframe.style.position = "absolute";

    this.iframe.style.top = "0";

    this.#pinWidth(element);
    if (typeof ResizeObserver !== "undefined") {
      this.#preloadResizeObserver = new ResizeObserver(() => {
        if (this.#lifecycle !== "hidden") return;
        this.#pinWidth(element);
      });
      this.#preloadResizeObserver.observe(element);
    }

    this.#boot(element, opts);
    this.#lifecycle = "hidden";

    return this;
  }

  #pinWidth(element: Element) {
    if (this.#preloadWidth && this.iframe.style.width !== this.#preloadWidth) {
      return;
    }

    if (element.clientWidth > 0) {
      this.#preloadWidth = `${element.clientWidth}px`;
      this.iframe.style.width = this.#preloadWidth;
    }
  }

  reveal(): this {
    if (!this.#live()) return this;

    if (this.#lifecycle === "visible") {
      return this;
    }

    if (this.#lifecycle !== "hidden") {
      throw new Error(
        "Evervault frame must be preloaded before it can be revealed. Call preload(selector) first."
      );
    }

    this.iframe.style.visibility = "";
    this.iframe.style.position = "";
    this.iframe.style.top = "";
    this.#restoreWidth();
    this.#lifecycle = "visible";

    return this;
  }

  #restoreWidth() {
    this.#preloadResizeObserver?.disconnect();
    this.#preloadResizeObserver = null;

    if (this.#preloadWidth && this.iframe.style.width === this.#preloadWidth) {
      this.iframe.style.width = "100%";
    }
    this.#preloadWidth = null;
  }

  #boot(element: Element, opts: FrameConfiguration) {
    // A theme given through update() while unmounted still holds listeners.
    this.#theme?.destroy();
    this.#theme = opts.theme ? new Theme(this, opts.theme) : null;

    // Answered on every handshake: a moved iframe loads and handshakes again.
    this.#subscribe("EV_FRAME_HANDSHAKE", this.#mountUnsubscribes, () => {
      this.send("EV_INIT", {
        theme: this.#theme?.compile(),
        config: opts.config,
      });
    });

    this.#subscribe("EV_RESIZE", this.#mountUnsubscribes, (size) => {
      const { height, width, minWidth, minHeight } = size;
      if (!this.#size) {
        this.iframe.style.height = `${height}px`;
        if (width) this.iframe.style.width = `${width}px`;
      }
      if (minWidth) this.iframe.style.minWidth = `${minWidth}px`;
      if (minHeight) this.iframe.style.minHeight = `${minHeight}px`;
    });

    this.iframe.onerror = opts.onError ?? null;

    element.appendChild(this.iframe);
  }

  // Undoes mount() only: threeDSecure unmounts mid-lifecycle and keeps its
  // own subscriptions.
  unmount(): this {
    this.iframe.remove();
    this.iframe.style.visibility = "";
    this.iframe.style.position = "";
    this.iframe.style.top = "";
    this.#restoreWidth();
    this.#lifecycle = "unmounted";

    const overlay = document.getElementById(`ev-modal-${this.#id}`);
    overlay?.remove();

    for (const release of this.#mountUnsubscribes.splice(0)) release();
    this.#theme?.destroy();
    this.#theme = null;
    this.#ready = false;

    return this;
  }

  destroy(): this {
    if (this.#destroyed) return this;

    this.unmount();

    for (const release of this.#unsubscribes.splice(0)) release();
    this.#destroyed = true;

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
    if (!this.#live()) return this;

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
    if (!this.#live()) return () => {};
    return this.#subscribe(event, this.#unsubscribes, callback);
  }

  // Released before the callback runs, so a callback that subscribes again is
  // not undone.
  once<K extends keyof ReceivableMessages>(
    event: K,
    callback: (message: ReceivableMessages[K]) => void
  ) {
    const release = this.on(event, (message) => {
      release();
      callback(message);
    });

    return release;
  }

  // The send method is used to send messages to the iframe.
  send<K extends keyof SendableMessages>(
    type: K,
    payload?: SendableMessages[K]
  ) {
    if (!this.#live() || !this.iframe.contentWindow) return;

    const data = { type, payload };
    this.iframe.contentWindow?.postMessage(data, this.url);
  }

  get isMounted() {
    return this.#lifecycle !== "unmounted";
  }

  get url() {
    return this.#client.config.components.url;
  }

  #generateUrl(component: string, options?: FrameOptions) {
    const url = new URL(this.url);
    url.searchParams.set("id", this.#id);
    url.searchParams.set("app", this.#client.config.appId);
    url.searchParams.set("team", this.#client.config.teamId);
    url.searchParams.set("component", component);

    // Validate the color scheme (to prevent injection) and add to search params
    if (
      options?.colorScheme &&
      VALID_COLOR_SCHEMES.includes(options?.colorScheme)
    ) {
      url.searchParams.set("colorScheme", options.colorScheme);
    }

    return url.toString();
  }

  get isDestroyed() {
    return this.#destroyed;
  }

  // A destroyed frame stays inert: the call is reported, not honoured.
  #live() {
    if (this.#destroyed) {
      console.error(`Evervault ${this.#component} frame has been destroyed`);
    }

    return !this.#destroyed;
  }

  // Held in `held` until released, by hand or with the rest of the list.
  #subscribe<K extends keyof ReceivableMessages>(
    event: K,
    held: (() => void)[],
    callback: (message: ReceivableMessages[K]) => void
  ) {
    const handleMessage = (e: MessageEvent<EvervaultFrameMessageDetail>) => {
      if (!e.data || e.data.frame !== this.#id) return;
      // Noted here, ahead of every listener, so one that updates from the
      // component's ready event finds the frame ready.
      if (e.data.type === "EV_FRAME_READY") this.#ready = true;
      if (e.data.type !== event) return;
      callback(e.data.payload as ReceivableMessages[K]);
    };

    const release = () => {
      window.removeEventListener("message", handleMessage);
      const index = held.indexOf(release);
      if (index !== -1) held.splice(index, 1);
    };

    window.addEventListener("message", handleMessage);
    held.push(release);

    return release;
  }
}
