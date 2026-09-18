import { clean } from "themes";
import { CardFrame } from "../cardFrame";
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

export class EvCard extends HTMLElement {
  #client?: EvervaultClient;
  #card?: CardFrame;
  #container?: HTMLDivElement;

  connectedCallback() {
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

    const card = new CardFrame(evervault);

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
      theme: clean(),
      config: { fields: DEFAULT_SPEC },
    });

    this.#card = card;
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
    // Destroyed, not unmounted: an unmounted card keeps its window listeners.
    this.#card?.destroy();
    this.#card = undefined;
  }
}

export function registerEvCard(create: CreateClient) {
  createClient = create;

  if (!customElements.get(EV_CARD_TAG_NAME)) {
    customElements.define(EV_CARD_TAG_NAME, EvCard);
  }
}
