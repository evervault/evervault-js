import EventManager from "./eventManager";
import { EvervaultFrame } from "./evervaultFrame";
import type EvervaultClient from "../main";
import type {
  CardPayload,
  CardOptions,
  SwipedCard,
  CardFrameClientMessages,
  CardFrameHostMessages,
  SelectorType,
  FieldEvent,
  ComponentError,
} from "types";

interface CardWithProfilingOptions extends CardOptions {
  enableEarlyProfiling?: boolean;
  onProfilingComplete?: (sessionId: string) => void;
  onProfilingError?: (error: ComponentError) => void;
}

interface CardWithProfilingEvents {
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
  profilingComplete: (sessionId: string) => void;
  profilingError: (error: ComponentError) => void;
}

export default class CardWithProfiling {
  values: CardPayload;
  #options: CardWithProfilingOptions;
  #frame: EvervaultFrame<CardFrameClientMessages, CardFrameHostMessages>;

  #events = new EventManager<CardWithProfilingEvents>();

  constructor(client: EvervaultClient, options?: CardWithProfilingOptions) {
    this.#options = options ?? {};
    this.#frame = new EvervaultFrame(client, "CardWithProfiling");

    // Update the values when the frame sends a change event and dispatch
    // a change event.
    this.#frame.on("EV_CHANGE", (payload) => {
      this.values = payload;
      this.#events.dispatch("change", payload);
    });

    this.#frame.on("EV_COMPLETE", (payload) => {
      this.#events.dispatch("complete", payload);
    });

    this.#frame.on("EV_SWIPE", (payload) => {
      this.#events.dispatch("swipe", payload);
    });

    this.#frame.on("EV_FRAME_READY", () => {
      this.#events.dispatch("ready");
    });

    this.#frame.on("EV_FOCUS", (field) => {
      this.#events.dispatch("focus", {
        field,
        data: this.values,
      });
    });

    this.#frame.on("EV_BLUR", (field) => {
      this.#events.dispatch("blur", {
        field,
        data: this.values,
      });
    });

    this.#frame.on("EV_KEYDOWN", (field) => {
      this.#events.dispatch("keydown", {
        field,
        data: this.values,
      });
    });

    this.#frame.on("EV_KEYUP", (field) => {
      this.#events.dispatch("keyup", {
        field,
        data: this.values,
      });
    });

    // Handle profiling events
    this.#frame.on("EV_PROFILING_COMPLETE", (sessionId) => {
      this.#events.dispatch("profilingComplete", sessionId);
      this.#options.onProfilingComplete?.(sessionId);
    });

    this.#frame.on("EV_PROFILING_ERROR", (error) => {
      this.#events.dispatch("profilingError", error);
      this.#options.onProfilingError?.(error);
    });

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
      fingerprintId: null,
    };
  }

  get config() {
    return {
      theme: this.#options.theme,
      config: {
        icons: this.#options.icons,
        autoFocus: this.#options.autoFocus,
        translations: this.#options.translations,
        hiddenFields: (this.#options.hiddenFields ?? [])?.join(","),
        fields: this.#options.fields,
        acceptedBrands: this.#options.acceptedBrands,
        defaultValues: this.#options.defaultValues,
        autoComplete: this.#options.autoComplete,
        autoProgress: this.#options.autoProgress,
        redactCVC: this.#options.redactCVC,
        allow3DigitAmexCVC: this.#options.allow3DigitAmexCVC,
        validation: this.#options.validation,
        enableEarlyProfiling: this.#options.enableEarlyProfiling ?? true,
        onProfilingComplete: this.#options.onProfilingComplete,
        onProfilingError: this.#options.onProfilingError,
      },
    };
  }

  mount(selector: SelectorType) {
    this.#frame.mount(selector, {
      ...this.config,
      onError: () => {
        this.#events.dispatch("error");
      },
    });

    return this;
  }

  update(options?: CardWithProfilingOptions) {
    if (options) {
      this.#options = { ...this.#options, ...options };
    }

    if (options?.defaultValues?.name) {
      this.#frame.send("EV_UPDATE_NAME", options.defaultValues.name);
    }

    this.#frame.update(this.config);
    return this;
  }

  unmount() {
    this.#frame.unmount();
    return this;
  }

  on<T extends keyof CardWithProfilingEvents>(
    event: T,
    callback: CardWithProfilingEvents[T]
  ) {
    return this.#events.on(event, callback);
  }

  validate() {
    this.#frame.send("EV_VALIDATE");
    this.#frame.once("EV_VALIDATED", (payload) => {
      this.values = payload;
      this.#events.dispatch("validate", payload);
    });
    return this;
  }
}
