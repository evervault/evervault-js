import { clean, material, minimal } from "themes";
import { CardFrame } from "../cardFrame";
import { serialise } from "./spec";
import type EvervaultClient from "../../main";
import type {
  CardFrameConfig,
  CardSpecNode,
  ColorScheme,
  ThemeDefinition,
} from "types";

export const EV_CARD_TAG_NAME = "ev-card";

const THEMES: Record<string, () => ThemeDefinition> = {
  clean,
  material,
  minimal,
};

// Declaring the attribute is what turns it on; only an explicit denial is false.
function flag(value: string) {
  return value.trim().toLowerCase() !== "false";
}

type CreateClient = (teamId: string, appId: string) => EvervaultClient;

// Given at registration: the client module is the one registering.
let createClient: CreateClient | undefined;

// What `<ev-card></ev-card>` renders: the card `ui.card()` renders by default.
const DEFAULT_SPEC: CardSpecNode[] = [
  { type: "number", id: "number", props: {} },
  { type: "expiry", id: "expiry", props: {} },
  { type: "cvc", id: "cvc", props: {} },
];

export class EvCard extends HTMLElement {
  #client?: EvervaultClient;
  #card?: CardFrame;
  #container?: HTMLDivElement;
  #spec: CardSpecNode[] = [];
  #observer?: MutationObserver;
  #pending = false;
  #attributesChanged = false;
  #theme?: ThemeDefinition | string;

  get spec() {
    return this.#spec;
  }

  // A theme name, or a theme `ui.card()` would take; the attribute holds the
  // name when neither is set.
  get theme(): ThemeDefinition | string | undefined {
    return this.#theme ?? this.getAttribute("theme") ?? undefined;
  }

  set theme(value: ThemeDefinition | string | undefined) {
    this.#theme = value;
    this.#card?.update({ theme: this.#resolveTheme() });
  }

  connectedCallback() {
    this.#adoptProperties();

    if (this.hasAttribute("team-id") && this.hasAttribute("app-id")) {
      const teamId = this.getAttribute("team-id") ?? "";
      const appId = this.getAttribute("app-id") ?? "";

      if (!createClient) return;

      this.mountCard(createClient(teamId, appId));
      return;
    }

    // Without attributes, the client from a previous mount is the only route
    // back after a DOM move; a card that is already live is left alone.
    if (!this.#client || this.#card) return;

    this.mountCard(this.#client);
  }

  mountCard(evervault: EvervaultClient) {
    // `ui.mount()` sweeps every card on the page, so a live card is never
    // replaced: mounting must not throw away details already entered.
    if (this.#card) {
      console.error(`<${EV_CARD_TAG_NAME}> has already been mounted`);
      return;
    }

    this.#client = evervault;
    this.#spec = this.#read();

    // The colour scheme goes into the frame URL, so it is read once here.
    const card = new CardFrame(evervault, {
      colorScheme: (this.getAttribute("color-scheme") ?? undefined) as
        | ColorScheme
        | undefined,
    });

    // The payload `ui.card()` hands to `on("change")`, as a DOM event on the
    // customer's own element.
    card.on("change", (payload) => {
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: payload,
          bubbles: true,
          composed: true,
        })
      );
    });

    card.mount(this.#mountPoint(), {
      theme: this.#resolveTheme(),
      config: { ...this.#readConfig(), fields: this.#spec },
    });

    this.#card = card;
    this.#observe();
  }

  // A property set before the element upgraded sits on the instance, where it
  // shadows the accessor; it is taken through the accessor instead.
  #adoptProperties() {
    if (!Object.prototype.hasOwnProperty.call(this, "theme")) return;

    const own = this as { theme?: ThemeDefinition | string };
    const value = own.theme;
    delete own.theme;
    this.theme = value;
  }

  #resolveTheme(): ThemeDefinition {
    const declared = this.theme ?? "clean";

    if (typeof declared !== "string") return declared;

    const named = THEMES[declared];

    if (!named) {
      console.warn(
        `<${EV_CARD_TAG_NAME}> has no "${declared}" theme and will use "clean". Themes are: ${Object.keys(
          THEMES
        ).join(", ")}.`
      );
      return clean();
    }

    return named();
  }

  // The card-level options read off the element's own attributes. Every key is
  // present so a removed attribute takes its option back to the default.
  #readConfig(): CardFrameConfig {
    const autoProgress = this.getAttribute("auto-progress");

    return {
      autoProgress: autoProgress === null ? undefined : flag(autoProgress),
    };
  }

  // Declaring nothing renders the default card; declaring anything replaces it.
  #read() {
    const declared = serialise(this);
    return declared.length > 0 ? declared : DEFAULT_SPEC;
  }

  #observe() {
    this.#observer = new MutationObserver((records) => {
      const own = (record: MutationRecord) =>
        record.type === "attributes" && record.target === this;

      if (records.some(own)) {
        this.#attributesChanged = true;
      }

      this.#queueSync();
    });
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }

  // One read per tick, however many children a render inserts.
  #queueSync() {
    if (this.#pending) return;
    this.#pending = true;

    queueMicrotask(() => {
      this.#pending = false;
      this.#sync();
    });
  }

  #sync() {
    this.#spec = this.#read();
    this.#card?.setSpec(this.#spec);

    if (!this.#attributesChanged) return;

    this.#attributesChanged = false;
    this.#card?.update({
      theme: this.#resolveTheme(),
      config: this.#readConfig(),
    });
  }

  // The frame lives in a closed shadow root with no slot, so the declared
  // children are read but never rendered.
  #mountPoint() {
    if (!this.#container) {
      const root = this.attachShadow({ mode: "closed" });
      const style = document.createElement("style");
      style.textContent = ":host { display: block; }";
      this.#container = document.createElement("div");
      root.append(style, this.#container);
    }

    return this.#container;
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = undefined;
    this.#pending = false;
    this.#attributesChanged = false;
    // Destroyed, not unmounted: an unmounted card keeps its window listeners.
    this.#card?.destroy();
    this.#card = undefined;
    this.#spec = [];
  }
}

export function registerEvCard(create: CreateClient) {
  createClient = create;

  if (!customElements.get(EV_CARD_TAG_NAME)) {
    customElements.define(EV_CARD_TAG_NAME, EvCard);
  }
}
