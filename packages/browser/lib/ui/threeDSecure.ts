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

    this.#frame.on("EV_SUCCESS", () => {
      this.#events.dispatch("success");
      this.unmount();
    });

    this.#frame.on("EV_FAILURE", () => {
      this.#events.dispatch("failure");
      this.unmount();
    });

    this.#frame.on("EV_CANCEL", () => {
      this.#events.dispatch("failure");
      this.unmount();
    });

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
    });

    this.#frame.on("EV_ERROR", (error) => {
      this.#events.dispatch("error", error);
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
