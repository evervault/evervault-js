import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import { diff } from "./specDiff";
import type EvervaultClient from "../main";
import type {
  CardEvents,
  CardPayload,
  CardFrameClientMessages,
  CardFrameConfig,
  CardFrameHostMessages,
  CardSpecNode,
  ColorScheme,
  SelectorType,
  ThemeDefinition,
} from "types";

export interface CardHostOptions {
  colorScheme?: ColorScheme;
  allow?: string;
}

export interface CardHostConfiguration {
  theme?: ThemeDefinition;
  config?: CardFrameConfig;
}

export function isSpec(
  fields: CardFrameConfig["fields"]
): fields is CardSpecNode[] {
  return (
    Array.isArray(fields) && fields.every((field) => typeof field === "object")
  );
}

// The card machinery shared by every card front-end: one frame, its
// subscriptions and their release, the values mirror, validation, and the
// tree the frame holds when the card is declared as one.
export class CardHost {
  #values: CardPayload;
  #frame: EvervaultFrame<CardFrameClientMessages, CardFrameHostMessages>;
  #events = new EventManager<CardEvents>();
  #pendingValidate?: () => void;
  #ready = false;
  #configuration: CardHostConfiguration = {};
  #updatedBeforeReady = false;
  // The tree the front-end wants, the one the frame was mounted with, and the
  // one the frame holds now. Null until a tree is given: `ui.card()` never does.
  #spec: CardSpecNode[] | null = null;
  #mounted: CardSpecNode[] = [];
  #framed: CardSpecNode[] = [];

  constructor(client: EvervaultClient, options: CardHostOptions = {}) {
    this.#frame = new EvervaultFrame(client, "Card", {
      colorScheme: options.colorScheme,
      allow: options.allow,
    });

    this.#frame.on("EV_CHANGE", (payload) => {
      this.#values = payload;
      this.#events.dispatch("change", payload);
    });

    this.#frame.on("EV_COMPLETE", (payload) => {
      this.#events.dispatch("complete", payload);
    });

    this.#frame.on("EV_SWIPE", (payload) => {
      this.#events.dispatch("swipe", payload);
    });

    this.#frame.on("EV_FRAME_READY", () => {
      this.#ready = true;
      // A fresh ready means a frame built from the mount configuration.
      this.#framed = this.#mounted;

      if (this.#updatedBeforeReady) {
        this.#updatedBeforeReady = false;
        this.update({});
      } else {
        this.#syncSpec();
      }

      this.#events.dispatch("ready");
    });

    this.#frame.on("EV_FOCUS", (field) => {
      this.#events.dispatch("focus", { field, data: this.values });
    });

    this.#frame.on("EV_BLUR", (field) => {
      this.#events.dispatch("blur", { field, data: this.values });
    });

    this.#frame.on("EV_KEYDOWN", (field) => {
      this.#events.dispatch("keydown", { field, data: this.values });
    });

    this.#frame.on("EV_KEYUP", (field) => {
      this.#events.dispatch("keyup", { field, data: this.values });
    });

    this.#values = {
      card: {
        name: null,
        brand: null,
        localBrands: [],
        bin: null,
        lastFour: null,
        number: null,
        expiry: { month: null, year: null },
        cvc: null,
      },
      isValid: false,
      isComplete: false,
      errors: null,
    };
  }

  // Kept current by the frame's change and validate replies.
  get values() {
    return this.#values;
  }

  mount(selector: SelectorType, configuration: CardHostConfiguration = {}) {
    if (!this.live()) return this;

    // A validate issued while unmounted went nowhere; its reply never comes.
    this.#pendingValidate?.();
    this.#pendingValidate = undefined;

    this.#configuration = configuration;

    const fields = configuration.config?.fields;

    if (isSpec(fields)) {
      this.#spec = fields;
      this.#mounted = fields;
    }

    this.#frame.mount(selector, {
      ...configuration,
      onError: () => {
        this.#events.dispatch("error");
      },
    });

    return this;
  }

  preload(selector: SelectorType, configuration: CardHostConfiguration = {}) {
    if (!this.live()) return this;

    // A validate issued while unmounted went nowhere; its reply never comes.
    this.#pendingValidate?.();
    this.#pendingValidate = undefined;
    this.#frame.preload(selector, {
      ...configuration,
      onError: () => {
        this.#events.dispatch("error");
      },
    });

    return this;
  }

  reveal() {
    if (!this.live()) return this;

    this.#frame.reveal();
    return this;
  }

  // Merges into the configuration the frame was mounted with. A declared card
  // always sends its current tree, so the frame never falls back to the fields
  // `ui.card()` would pick.
  update(configuration: CardHostConfiguration) {
    if (!this.live()) return this;

    const fields = configuration.config?.fields;

    if (isSpec(fields)) this.#spec = fields;

    this.#configuration = {
      theme: configuration.theme ?? this.#configuration.theme,
      config: {
        ...this.#configuration.config,
        ...configuration.config,
        ...(this.#spec ? { fields: this.#spec } : {}),
      },
    };

    // The frame drops a configuration it is not ready for; only the theme is
    // kept, so the rest is sent again once it is.
    if (!this.#ready) this.#updatedBeforeReady = true;
    else if (this.#spec) this.#framed = this.#spec;

    this.#frame.update(this.#configuration);

    return this;
  }

  // The tree the frame should hold; only the difference is sent.
  setSpec(spec: CardSpecNode[]) {
    this.#spec = spec;
    this.#syncSpec();
    return this;
  }

  #syncSpec() {
    if (!this.#ready || !this.#spec) return;

    const ops = diff(this.#framed, this.#spec);
    this.#framed = this.#spec;

    if (ops.length > 0) this.#frame.send("EV_SPEC_PATCH", { ops });
  }

  send<K extends keyof CardFrameHostMessages>(
    type: K,
    payload?: CardFrameHostMessages[K]
  ) {
    if (!this.live()) return this;

    this.#frame.send(type, payload);
    return this;
  }

  unmount() {
    if (!this.live()) return this;

    // A reply to the unmounted frame's request must not land in the next one.
    this.#pendingValidate?.();
    this.#pendingValidate = undefined;
    this.#frame.unmount();
    return this;
  }

  destroy() {
    this.#pendingValidate = undefined;
    this.#ready = false;
    this.#frame.destroy();
    // Nothing can dispatch to them again; let the callbacks go.
    this.#events = new EventManager<CardEvents>();
    return this;
  }

  on<T extends keyof CardEvents>(event: T, callback: CardEvents[T]) {
    if (!this.live()) return () => {};

    return this.#events.on(event, callback);
  }

  validate() {
    if (!this.live()) return this;

    // One reply answers the latest request, however many were sent.
    this.#pendingValidate?.();
    this.#pendingValidate = this.#frame.once("EV_VALIDATED", (payload) => {
      this.#pendingValidate = undefined;
      this.#values = payload;
      this.#events.dispatch("validate", payload);
    });

    this.#frame.send("EV_VALIDATE");

    return this;
  }

  // The frame reports a destroyed call; nothing here reaches it once it has.
  live() {
    return this.#frame.live();
  }
}
