import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type {
  SelectorType,
  EvervaultFrameHostMessages,
  ThreeDSecureFrameClientMessages,
  ThreeDSecureOptions,
  ComponentError,
} from "types";

interface ThreeDSecureEvents {
  ready: () => void;
  success: () => void;
  failure: () => void;
  error: (error: ComponentError) => void;
}

export default class ThreeDSecure {
  #session: string;
  #isOverlay: boolean;
  #options: ThreeDSecureOptions;
  #client: EvervaultClient;
  #frame: EvervaultFrame<
    ThreeDSecureFrameClientMessages,
    EvervaultFrameHostMessages
  >;

  #events = new EventManager<ThreeDSecureEvents>();

  constructor(
    client: EvervaultClient,
    session: string,
    options?: ThreeDSecureOptions
  ) {
    this.#session = session;
    this.#options = options ?? {};
    this.#isOverlay = false;
    this.#frame = new EvervaultFrame(client, "ThreeDSecure");
    this.#client = client;

    this.#frame.on("EV_SUCCESS", (cres) => {
      void this.#handleOutcome("success", cres);
    });

    this.#frame.on("EV_FAILURE", (cres) => {
      void this.#handleOutcome("failure", cres);
    });

    this.#frame.on("EV_CANCEL", () => {
      void this.#handleOutcome("cancelled");
    });

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
    });

    this.#frame.on("EV_ERROR", (error) => {
      this.unmount();
      this.#events.dispatch("error", error);
      if (error) console.error(error.message);
    });
  }

  async #handleOutcome(outcome: string, cres?: string | null) {
    await this.#updateOutcome(outcome, cres);
    this.#events.dispatch(outcome === "success" ? "success" : "failure");
    this.unmount();
  }
  
  async #updateOutcome(outcome: string, cres?: string | null): Promise<void> {
    const api = this.#client.config.http.apiUrl;
    await fetch(`${api}/frontend/3ds/browser-sessions/${this.#session}`, {
      method: "PATCH",
      headers: {
        "X-Evervault-App-Id": this.#client.config.appId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        outcome,
        cres: cres ?? null,
      }),
    });
  }

  get config() {
    return {
      theme: this.#options.theme,
      config: {
        session: this.#session,
        size: this.#options.size,
        isOverlay: this.#isOverlay,
      },
    };
  }

  mount(selector?: SelectorType) {
    const target = selector ?? this.#frame.createOverlay();

    if (!selector) {
      this.#isOverlay = true;
      this.#frame.setSize({ width: "100%", height: "100%" });
    }

    this.#frame.mount(target, {
      ...this.config,
      onError: () => {
        this.#events.dispatch("error", {
          code: "frame-load-error",
          message: "The iframe required to mount this component failed to load",
        });
      },
    });

    return this;
  }

  update(options?: ThreeDSecureOptions) {
    if (options) {
      this.#options = { ...this.#options, ...options };
    }
    this.#frame.update(this.config);
    return this;
  }

  unmount() {
    this.#frame.unmount();
    return this;
  }

  on<T extends keyof ThreeDSecureEvents>(
    event: T,
    callback: ThreeDSecureEvents[T]
  ) {
    return this.#events.on(event, callback);
  }
}
