import { clean } from "themes";
import { CardHost } from "../cardHost";
import { serialise } from "./spec";
import type EvervaultClient from "../../main";
import type { CardSpecNode } from "types";

export const EV_CARD_TAG_NAME = "ev-card";

type CreateClient = (teamId: string, appId: string) => EvervaultClient;

// Given at registration: the client module is the one registering.
let createClient: CreateClient | undefined;

// What `<ev-card></ev-card>` renders: the card `ui.card()` renders by default.
const DEFAULT_SPEC: CardSpecNode[] = [
  { type: "number", id: "number", props: {} },
  { type: "expiry", id: "expiry", props: {} },
  { type: "cvc", id: "cvc", props: {} },
];

// Importing the module must not need a DOM; the element is only registered
// where there is one.
const Base = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

export class EvCard extends Base {
  #client?: EvervaultClient;
  #card?: CardHost;
  #container?: HTMLDivElement;
  #spec: CardSpecNode[] = [];
  #observer?: MutationObserver;
  #pending = false;

  get spec() {
    return this.#spec;
  }

  connectedCallback() {
    // A card that is already live is left alone. After a DOM move the client
    // from the previous mount is reused; otherwise the attributes name one.
    if (this.#card) return;

    const client = this.#client ?? this.#declaredClient();

    if (client) this.mountCard(client);
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

    this.#client = evervault;
    this.#spec = this.#readSpec();

    const card = new CardHost(evervault);

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
      theme: clean(),
      config: { fields: this.#spec },
    });

    this.#card = card;
    this.#observe();
  }

  // Declaring nothing renders the default card; declaring anything replaces it.
  #readSpec() {
    const declared = serialise(this);
    return declared.length > 0 ? declared : DEFAULT_SPEC;
  }

  #observe() {
    this.#observer = new MutationObserver(() => this.#queueSync());
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
  }

  #declaredClient() {
    const teamId = this.getAttribute("team-id");
    const appId = this.getAttribute("app-id");

    if (!teamId || !appId || !createClient) return undefined;

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
    this.#observer?.disconnect();
    this.#observer = undefined;
    this.#pending = false;
    // Destroyed, not unmounted: an unmounted card keeps its window listeners.
    this.#card?.destroy();
    this.#card = undefined;
    this.#spec = [];
  }
}

export function registerEvCard(create: CreateClient) {
  if (typeof customElements === "undefined") return;

  createClient = create;

  if (!customElements.get(EV_CARD_TAG_NAME)) {
    customElements.define(EV_CARD_TAG_NAME, EvCard);
  }
}
