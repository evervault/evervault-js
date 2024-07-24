import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type {
  SelectorType,
  EvervaultFrameHostMessages,
  ThreeDSecureFrameClientMessages,
  ThreeDSecureOptions,
} from "types";

interface ThreeDSecureEvents {
  ready: () => void;
  error: () => void;
  complete: () => void;
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

    this.#frame.on("EV_COMPLETE", (payload) => {
      this.#events.dispatch("complete", payload);
      this.unmount();
    });

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
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
        this.#events.dispatch("error");
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
