import { clean } from "themes";
import { cardSettingsConfig, framePermissions } from "../card";
import type { CardSettings } from "../card";
import { CardHost } from "../cardHost";
import { THEMES } from "./cardThemes";
import type { ThemeName } from "./cardThemes";
import { unknownTheme } from "./developerMessages";
import { expiryError, expiryWarning } from "./expiry";
import { registerFieldElements } from "./fields";
import { ElementBase, adoptProperties, reflect } from "./reflect";
import type { Reflection } from "./reflect";
import { serialise } from "./spec";
import type EvervaultClient from "../../main";
import type {
  CardEvents,
  CardFrameConfig,
  CardIcons,
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

const REFLECTIONS: Reflection[] = [
  ["colorScheme", "colorscheme", "text"],
  ["autoFocus", "autofocus", "flag"],
  ["acceptedBrands", "acceptedbrands", "list"],
  ["autoProgress", "autoprogress", "flag"],
  ["autoComplete", "autocomplete", "switch"],
];

// The host attributes the card is configured from after mounting.
const OPTION_ATTRIBUTES = [
  "theme",
  "icons",
  ...REFLECTIONS.map(([, attribute]) => attribute).filter(
    (attribute) => attribute !== "colorscheme"
  ),
];

// Heard only on the element itself: `focus` and the key events share their
// names with the browser's, which say more than these can.
const EVENTS: Exclude<keyof CardEvents, "change">[] = [
  "ready",
  "error",
  "complete",
  "swipe",
  "validate",
  "focus",
  "blur",
  "keydown",
  "keyup",
];

// Every property, taken through its accessor if set before the upgrade.
const PROPERTIES = [
  "theme",
  "icons",
  "validation",
  "translations",
  "customBrands",
  "defaultValues",
  "agentTools",
  ...REFLECTIONS.map(([property]) => property),
];

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
  #optionsChanged = false;
  #warned = false;
  #theme?: ThemeDefinition | ThemeName;
  #settings: CardSettings = {};
  #agentTools?: CardSettings["agentTools"];
  #iconMap?: Partial<CardIcons>;

  // Every setting a plain value holds, as an attribute of the card.
  declare colorScheme?: ColorScheme;
  declare autoFocus?: boolean;
  declare acceptedBrands?: CardSettings["acceptedBrands"];
  // Every field's default; a field element's own setting wins.
  declare autoProgress?: boolean;
  declare autoComplete?: boolean;

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
    if (value !== undefined && value !== null && typeof value !== "string") {
      this.#theme = value;
      this.#changed();
      return;
    }

    this.#theme = undefined;

    if (value === undefined || value === null) this.removeAttribute("theme");
    else this.setAttribute("theme", value);
  }

  // A brand icon map is kept here; the attribute says only whether icons show.
  get icons(): CardSettings["icons"] {
    const shown = this.hasAttribute("icons")
      ? this.getAttribute("icons")?.trim().toLowerCase() !== "false"
      : undefined;

    return shown && this.#iconMap ? this.#iconMap : shown;
  }

  set icons(value: CardSettings["icons"]) {
    this.#iconMap = typeof value === "object" ? value : undefined;

    if (value === undefined || value === null) this.removeAttribute("icons");
    else this.setAttribute("icons", value ? "" : "false");
  }

  get translations() {
    return this.#settings.translations;
  }

  set translations(value: CardSettings["translations"]) {
    this.#set({ translations: value });
  }

  get customBrands() {
    return this.#settings.customBrands;
  }

  set customBrands(value: CardSettings["customBrands"]) {
    this.#set({ customBrands: value });
  }

  get defaultValues() {
    return this.#settings.defaultValues;
  }

  set defaultValues(value: CardSettings["defaultValues"]) {
    // Replaces what the shopper typed, so only a new name is sent.
    if (value?.name && value.name !== this.#settings.defaultValues?.name) {
      this.#card?.send("EV_UPDATE_NAME", value.name);
    }

    this.#set({ defaultValues: value });
  }

  get validation() {
    return this.#settings.validation;
  }

  set validation(value: CardSettings["validation"]) {
    this.#set({ validation: value });
  }

  // Read once, when the card mounts: the frame is created with it.
  get agentTools() {
    return this.#settings.agentTools;
  }

  set agentTools(value: CardSettings["agentTools"]) {
    this.#settings = { ...this.#settings, agentTools: value };
  }

  #set(setting: CardSettings) {
    this.#settings = { ...this.#settings, ...setting };
    this.#changed();
  }

  // Settings changed together reach the card as one update.
  #changed() {
    if (!this.#card) return;

    this.#optionsChanged = true;
    this.#queueSync();
  }

  // The answer arrives as a `validate` event.
  validate() {
    this.#card?.validate();
  }

  connectedCallback() {
    adoptProperties(this, PROPERTIES);

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

    // Watched even when refused, so the card mounts once the tree is whole.
    if (!this.#observer) this.#observe();

    const spec = this.#readSpec();

    if (spec) this.#mount(evervault, spec);
  }

  #mount(evervault: EvervaultClient, spec: CardSpecNode[]) {
    this.#spec = spec;

    this.#agentTools = this.#settings.agentTools;

    // The colour scheme goes into the frame URL, so it is read once here.
    const card = new CardHost(evervault, {
      colorScheme: this.colorScheme,
      allow: framePermissions(this.#agentTools),
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

    for (const event of EVENTS) {
      card.on(event, (detail?: unknown) => {
        this.dispatchEvent(new CustomEvent(event, { detail }));
      });
    }

    card.mount(this.#mountPoint(), {
      theme: this.#resolveTheme(),
      config: { ...this.#readConfig(), fields: this.#spec },
    });

    this.#card = card;
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

  // Every key is present so a removed setting takes its option back to the
  // default.
  #readConfig(): CardFrameConfig {
    if (!this.#client) return {};

    return cardSettingsConfig(
      {
        icons: this.icons,
        autoFocus: this.autoFocus,
        translations: this.translations,
        acceptedBrands: this.acceptedBrands,
        customBrands: this.customBrands,
        defaultValues: this.defaultValues,
        autoComplete: this.autoComplete,
        autoProgress: this.autoProgress,
        validation: this.validation,
        agentTools: this.#agentTools,
      },
      this.#client
    );
  }

  // Declaring nothing renders the default card; declaring anything replaces it.
  // A tree the card cannot render is refused, with the reason logged.
  #readSpec(): CardSpecNode[] | undefined {
    const declared = serialise(this);
    const error = expiryError(declared);

    if (error) {
      console.error(error);
      return undefined;
    }

    // Warned once while the arrangement stands, however often it is re-read.
    const warning = expiryWarning(declared);

    if (warning && !this.#warned) {
      console.warn(warning);
    }

    this.#warned = warning !== null;

    return declared.length > 0 ? declared : DEFAULT_SPEC;
  }

  #observe() {
    this.#observer = new MutationObserver((records) => {
      const option = (record: MutationRecord) =>
        record.target === this &&
        OPTION_ATTRIBUTES.includes(record.attributeName ?? "");

      if (records.some(option)) {
        this.#optionsChanged = true;
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

    // A refused tree leaves the card on the last one it rendered.
    const spec = this.#readSpec();

    if (spec && !this.#card && this.#client) {
      // Mounting reads the options afresh.
      this.#optionsChanged = false;
      this.#mount(this.#client, spec);
      return;
    }

    if (spec) {
      this.#spec = spec;
      this.#card?.setSpec(spec);
    }

    if (!this.#optionsChanged) return;

    this.#optionsChanged = false;
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
    this.#optionsChanged = false;
    this.#warned = false;
    // Destroyed, not unmounted: an unmounted card keeps its window listeners.
    this.#card?.destroy();
    this.#card = undefined;
    this.#spec = [];
  }
}

export function registerEvCard(create: CreateClient) {
  if (typeof customElements === "undefined") return;

  createClient = create;

  // Before the card, so each field has taken its properties when it is read.
  registerFieldElements();

  // The tag is defined once per page, so the first SDK to load owns <ev-card>.
  if (!customElements.get(EV_CARD_TAG_NAME)) {
    customElements.define(EV_CARD_TAG_NAME, EvCard);
  }
}

reflect(EvCard.prototype, REFLECTIONS);
