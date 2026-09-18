import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import { diff } from "./specDiff";
import type EvervaultClient from "../main";
import type {
  CardPayload,
  SwipedCard,
  CardFrameClientMessages,
  CardFrameConfig,
  CardFrameHostMessages,
  CardSpecNode,
  ColorScheme,
  SelectorType,
  FieldEvent,
  ThemeDefinition,
} from "types";

export interface CardEvents {
  ready: () => void;
  error: () => void;
  change: (payload: CardPayload) => void;
  complete: (payload: CardPayload) => void;
  swipe: (payload: SwipedCard) => void;
  validate: (payload: CardPayload) => void;
  focus: (event: FieldEvent) => void;
  blur: (event: FieldEvent) => void;
  keydown: (event: FieldEvent) => void;
  keyup: (event: FieldEvent) => void;
}

export interface CardFrameOptions {
  colorScheme?: ColorScheme;
}

export interface CardFrameConfiguration {
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
export class CardFrame {
  values: CardPayload;
  #frame: EvervaultFrame<CardFrameClientMessages, CardFrameHostMessages>;
  #events = new EventManager<CardEvents>();
  #unsubscribes: (() => void)[] = [];
  #destroyed = false;
  #ready = false;
  #configuration: CardFrameConfiguration = {};
  #updatedBeforeReady = false;
  // The tree the front-end wants, the one the frame was mounted with, and the
  // one the frame holds now. Null until a tree is given: `ui.card()` never does.
  #spec: CardSpecNode[] | null = null;
  #mounted: CardSpecNode[] = [];
  #framed: CardSpecNode[] = [];

  constructor(client: EvervaultClient, options: CardFrameOptions = {}) {
    this.#frame = new EvervaultFrame(client, "Card", {
      colorScheme: options.colorScheme,
    });

    this.#unsubscribes.push(
      this.#frame.on("EV_CHANGE", (payload) => {
        this.values = payload;
        this.#events.dispatch("change", payload);
      }),

      this.#frame.on("EV_COMPLETE", (payload) => {
        this.#events.dispatch("complete", payload);
      }),

      this.#frame.on("EV_SWIPE", (payload) => {
        this.#events.dispatch("swipe", payload);
      }),

      this.#frame.on("EV_FRAME_READY", () => {
        this.#ready = true;
        // A fresh ready means a frame built from the mount configuration.
        this.#framed = this.#mounted;

        if (this.#updatedBeforeReady) {
          this.#updatedBeforeReady = false;
          // The frame flags itself ready after this listener runs.
          queueMicrotask(() => this.update({}));
        } else {
          this.#syncSpec();
        }

        this.#events.dispatch("ready");
      }),

      this.#frame.on("EV_FOCUS", (field) => {
        this.#events.dispatch("focus", { field, data: this.values });
      }),

      this.#frame.on("EV_BLUR", (field) => {
        this.#events.dispatch("blur", { field, data: this.values });
      }),

      this.#frame.on("EV_KEYDOWN", (field) => {
        this.#events.dispatch("keydown", { field, data: this.values });
      }),

      this.#frame.on("EV_KEYUP", (field) => {
        this.#events.dispatch("keyup", { field, data: this.values });
      })
    );

    this.values = {
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

  mount(selector: SelectorType, configuration: CardFrameConfiguration = {}) {
    // The subscriptions are made once, in the constructor, so a frame mounted
    // after destroy() would never report back.
    if (this.#destroyed) {
      throw new Error(
        "Evervault card has been destroyed and cannot be mounted"
      );
    }

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

  // Merges into the configuration the frame was mounted with. A declared card
  // always sends its current tree, so the frame never falls back to the fields
  // `ui.card()` would pick.
  update(configuration: CardFrameConfiguration) {
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
    this.#frame.send(type, payload);
    return this;
  }

  unmount() {
    this.#frame.unmount();
    return this;
  }

  // Unlike unmount(), releases every subscription; a destroyed frame cannot be
  // mounted again.
  destroy() {
    for (const release of this.#unsubscribes) release();

    this.#unsubscribes = [];
    this.#destroyed = true;
    this.#ready = false;
    this.#frame.destroy();

    return this;
  }

  on<T extends keyof CardEvents>(event: T, callback: CardEvents[T]) {
    return this.#events.on(event, callback);
  }

  validate() {
    if (this.#destroyed) {
      console.error(
        "Evervault card has been destroyed and cannot be validated"
      );
      return this;
    }

    this.#frame.send("EV_VALIDATE");

    // Dropped once it fires, so repeated calls do not pile up.
    const release = this.#frame.once("EV_VALIDATED", (payload) => {
      this.#unsubscribes = this.#unsubscribes.filter(
        (held) => held !== release
      );
      this.values = payload;
      this.#events.dispatch("validate", payload);
    });

    this.#unsubscribes.push(release);

    return this;
  }
}
