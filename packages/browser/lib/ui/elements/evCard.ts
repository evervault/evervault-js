import { clean } from "themes";
import { CardHost } from "../cardHost";
import { THEMES } from "./cardThemes";
import type { ThemeName } from "./cardThemes";
import { unknownTheme } from "./developerMessages";
import { ElementBase, adoptProperties, readAttribute } from "./reflect";
import { serialise } from "./spec";
import type EvervaultClient from "../../main";
import type {
  CardFrameConfig,
  CardSpecNode,
  ColorScheme,
  ThemeDefinition,
} from "types";

export const EV_CARD_TAG_NAME = "ev-card";

type CreateClient = (teamId: string, appId: string) => EvervaultClient;

// Given at registration: the client module is the one registering.
let createClient: CreateClient | undefined;

// What `<ev-card></ev-card>` renders: the card `ui.card()` renders by default,
// expiry and cvc side by side.
const DEFAULT_SPEC: CardSpecNode[] = [
  { type: "number", id: "number", props: {} },
  {
    type: "row",
    id: "row",
    props: {},
    children: [
      { type: "expiry", id: "expiry", props: {} },
      { type: "cvc", id: "cvc", props: {} },
    ],
  },
];

// The host attributes the card is configured from after mounting.
const OPTION_ATTRIBUTES = ["theme", "autoprogress"];

// The parser reads top to bottom, so any node after the element means its
// closing tag, and so every child, has been read.
function parsedPast(element: Element) {
  for (let node: Node | null = element; node; node = node.parentNode) {
    if (node.nextSibling) return true;
  }

  return false;
}

export class EvCard extends ElementBase {
  #client?: EvervaultClient;
  #card?: CardHost;
  #container?: HTMLDivElement;
  #spec: CardSpecNode[] = [];
  #observer?: MutationObserver;
  #pending = false;
  #stopWaiting?: () => void;
  #attributesChanged = false;
  #theme?: ThemeDefinition | ThemeName;

  get spec() {
    return this.#spec;
  }

  // A theme name, or a theme `ui.card()` would take; the attribute holds the
  // name when neither is set.
  get theme(): ThemeDefinition | ThemeName | undefined {
    return (
      this.#theme ??
      (this.getAttribute("theme") as ThemeName | null) ??
      undefined
    );
  }

  set theme(value: ThemeDefinition | ThemeName | undefined) {
    this.#theme = value;

    if (!this.#card) return;

    this.#attributesChanged = true;
    this.#queueSync();
  }

  connectedCallback() {
    adoptProperties(this, ["theme"]);

    // A card that is already live is left alone. After a DOM move the client
    // from the previous mount is reused; otherwise the attributes name one.
    if (this.#card) return;

    const client = this.#client ?? this.#declaredClient();

    if (!client) return;

    if (document.readyState !== "loading" || parsedPast(this)) {
      this.mountCard(client);
    } else {
      this.#mountWhenParsed(client);
    }
  }

  // The parser connects the element at its opening tag, before its children.
  #mountWhenParsed(client: EvervaultClient) {
    const mount = () => this.mountCard(client);

    const observer = new MutationObserver(() => {
      if (parsedPast(this)) mount();
    });

    observer.observe(document, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", mount);

    this.#stopWaiting = () => {
      observer.disconnect();
      document.removeEventListener("DOMContentLoaded", mount);
      this.#stopWaiting = undefined;
    };
  }

  get isMounted() {
    return this.#card !== undefined;
  }

  mountCard(evervault: EvervaultClient) {
    // A live card is never replaced: mounting must not throw away details
    // already entered.
    if (this.#card) {
      console.error(`<${EV_CARD_TAG_NAME}> has already been mounted`);
      return;
    }

    // Mounting, however it is reached, is what ends the wait.
    this.#stopWaiting?.();
    this.#client = evervault;
    this.#spec = this.#readSpec();

    // The colour scheme goes into the frame URL, so it is read once here.
    const card = new CardHost(evervault, {
      colorScheme: readAttribute(this, "colorscheme", "text") as
        | ColorScheme
        | undefined,
    });

    // The card payload as a DOM event on the customer's own element.
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

  #resolveTheme(): ThemeDefinition {
    const declared = this.theme ?? "clean";

    if (typeof declared !== "string") return declared;

    const named = THEMES[declared];

    if (!named) {
      console.warn(unknownTheme(declared));
      return clean();
    }

    return named();
  }

  // The card-level options read off the element's own attributes. Every key is
  // present so a removed attribute takes its option back to the default.
  #readConfig(): CardFrameConfig {
    return {
      autoProgress: readAttribute(this, "autoprogress", "flag") as
        | boolean
        | undefined,
    };
  }

  // Declaring nothing renders the default card; declaring anything replaces it.
  #readSpec() {
    const declared = serialise(this);
    return declared.length > 0 ? declared : DEFAULT_SPEC;
  }

  #observe() {
    this.#observer = new MutationObserver((records) => {
      const option = (record: MutationRecord) =>
        record.target === this &&
        OPTION_ATTRIBUTES.includes(record.attributeName ?? "");

      if (records.some(option)) {
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
    if (!this.#observer) return;

    this.#spec = this.#readSpec();
    this.#card?.setSpec(this.#spec);

    if (!this.#attributesChanged) return;

    this.#attributesChanged = false;
    this.#card?.update({
      theme: this.#resolveTheme(),
      config: this.#readConfig(),
    });
  }

  #declaredClient() {
    if (!createClient) {
      console.error(
        `<${EV_CARD_TAG_NAME}> was used before the SDK registered it`
      );
      return undefined;
    }

    const teamId = this.getAttribute("teamid");
    const appId = this.getAttribute("appid");

    if (!teamId || !appId) return undefined;

    return createClient(teamId, appId);
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
    this.#stopWaiting?.();
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
  if (typeof customElements === "undefined") return;

  createClient = create;

  // The tag is defined once per page, so the first SDK to load owns <ev-card>.
  if (!customElements.get(EV_CARD_TAG_NAME)) {
    customElements.define(EV_CARD_TAG_NAME, EvCard);
  }
}
