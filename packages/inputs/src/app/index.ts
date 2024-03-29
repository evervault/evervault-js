import type { InputsData, CardData } from "@evervault/browser";
import Evervault from "@evervault/browser";
import "./styles.css";
import EvervaultCard from "./EvervaultCard";
import { InputElementsManager } from "./InputElementsManager";
import { MagStripe } from "./MagStripe";
import { setupReveal } from "./RevealManager";
import {
  setInputLabels,
  updateInputLabels,
  getErrorLabels,
  updateErrorLabels,
  setFormOverrides,
} from "./customLabelsHandler";
import { customStyles, urlStyles } from "./customStylesHandler";
import type { Labels } from "./customLabelsHandler";
import type { CustomRevealStyles } from "./customStylesHandler";

const DEFAULT_CARD_CONFIG = ["cardNumber", "cardExpiry", "cardCVV"];

const queryString = decodeURIComponent(window.location.search);
const urlParams = new URLSearchParams(queryString);

// Team ID
const team = urlParams.get("team");
// App ID
const app = urlParams.get("app");
// Theme: default, minimal or material
const theme = urlParams.get("theme");
const fontUrl = urlParams.get("fontUrl");
const isReveal = urlParams.get("mode") === "reveal";

let inputElementsManager: InputElementsManager;

function insertLinkTag(
  id: string,
  rel: string,
  href: string,
  options: { crossOrigin?: string; type?: string; media?: string } = {}
): void {
  if (!document.getElementById(id)) {
    const head = document.getElementsByTagName("head")[0];
    const link = document.createElement("link");
    link.id = id;
    link.rel = rel;
    link.href = href;
    if (options.crossOrigin) link.crossOrigin = options.crossOrigin;
    if (options.type) link.type = options.type;
    if (options.media) link.media = options.media;
    head.appendChild(link);
  }
}

if (fontUrl) {
  try {
    const parsedFontUrl = new URL(fontUrl);

    // Only allow fonts from fonts.googleapis.com
    if (parsedFontUrl.hostname !== "fonts.googleapis.com") {
      throw new Error(
        "Invalid fontUrl. Please use a fontUrl from fonts.googleapis.com"
      );
    } else {
      // Avoid CSRF or Clickjacking attacks by reconstructing the URL
      const reconstructedGoogleFontUrl = new URL(
        parsedFontUrl.pathname,
        "https://fonts.googleapis.com"
      );

      // Turns out `searchParams` is a read-only property
      reconstructedGoogleFontUrl.search = parsedFontUrl.search;

      insertLinkTag(
        "font-preconnect",
        "preconnect",
        "https://fonts.googleapis.com"
      );

      insertLinkTag(
        "font-preconnect-cors",
        "preconnect",
        "https://fonts.gstatic.com",
        { crossOrigin: "" }
      );

      insertLinkTag(
        "font-url",
        "stylesheet",
        reconstructedGoogleFontUrl.toString(),
        {
          type: "text/css",
          media: "all",
        }
      );
    }
  } catch (e) {
    console.error(e);
    console.error(
      "The above error means that your custom font's have not been set."
    );
  }
}

// Custom Styles
urlStyles(urlParams);
// Custom Labels
setInputLabels(theme, urlParams, isReveal);
// Custom Form Overrides
const formOverrides = setFormOverrides(urlParams);

let errorLabels = getErrorLabels(urlParams);

const form = document.getElementById("form");
const evervault = new Evervault(team!, app!);

// Assign theme class if theme is minimal
if (form && theme) {
  document.getElementById("form")?.classList.add(`form-${theme}`);
}

let evCard: EvervaultCard;
if (formOverrides.disableCVV || formOverrides.disableExpiry) {
  const reducedConfig = DEFAULT_CARD_CONFIG.reduce((acc, current) => {
    if (
      (current !== "cardCVV" || !formOverrides.disableCVV) &&
      (current !== "cardExpiry" || !formOverrides.disableExpiry)
    ) {
      acc.push(current);
    }
    return acc;
  }, [] as string[]);

  if (formOverrides.disableCVV) {
    document.getElementById("security-code-container")?.classList.add("hide");
  }
  if (formOverrides.disableExpiry) {
    document.getElementById("expiry-code-container")?.classList.add("hide");
  }
  evCard = new EvervaultCard(reducedConfig);
} else {
  evCard = new EvervaultCard(DEFAULT_CARD_CONFIG);
}

// Unhide form when all customisations are applied in order to avoid a flash of unstyled content
if (!isReveal) {
  document.getElementById("form")?.classList.remove("hide");
}

function postToParent(): void {
  void getData().then((data) => window.parent.postMessage(data, "*"));
}

async function getData(): Promise<InputsData> {
  const helper = document.getElementById("helper")!;
  const track = {
    fullTrack: inputElementsManager?.elements.trackData.value,
    trackOne: inputElementsManager?.elements.trackOne.value,
    trackTwo: inputElementsManager?.elements.trackTwo.value,
  };
  const name = inputElementsManager?.elements.name.value;

  const cardNumberValue = inputElementsManager?.masks.cardNumber.unmaskedValue;
  const expirationDateValue =
    inputElementsManager?.masks.expirationDate.unmaskedValue;
  const cvvValue = formOverrides.disableCVV
    ? undefined
    : inputElementsManager?.masks.cvv?.unmaskedValue;

  evCard.cardNumber = cardNumberValue;
  evCard.cardExpiry = formOverrides.disableExpiry ? "" : expirationDateValue;
  evCard.cardCVV = cvvValue ?? "";
  const error = evCard.generateError(errorLabels);

  helper.innerText = error.length > 0 ? error[0].message : "";

  if (error.length > 0) {
    helper.classList.add("helper-visible");
  } else {
    helper.classList.remove("helper-visible");
  }

  if (evCard.cardNumberVerification.isPotentiallyValid) {
    inputElementsManager.elements.cardNumber.classList.remove("input-invalid");
  } else {
    inputElementsManager.elements.cardNumber.classList.add("input-invalid");
  }

  if (evCard.cardExpiryVerification.isPotentiallyValid) {
    inputElementsManager.elements.expirationDate.classList.remove(
      "input-invalid"
    );
  } else {
    inputElementsManager.elements.expirationDate.classList.add("input-invalid");
  }

  if (
    evCard.cardCVVVerification.isPotentiallyValid &&
    !formOverrides.disableCVV
  ) {
    inputElementsManager.elements.cvv?.classList.remove("input-invalid");
  } else if (!formOverrides.disableCVV) {
    inputElementsManager.elements.cvv?.classList.add("input-invalid");
  }

  const card = {
    type: evCard.cardNumberVerification?.card?.type ?? "",
    number: cardNumberValue,
    expMonth: formOverrides.disableExpiry
      ? undefined
      : evCard.cardExpiryVerification.month ?? "",
    expYear: formOverrides.disableExpiry
      ? undefined
      : evCard.cardExpiryVerification.year ?? "",
    track,
    name,
    swipe: track.fullTrack.length > 0,
    // We mispelled this in the our public interface, so we need to keep it for backwards compatibility
    cvc: formOverrides.disableCVV ? undefined : cvvValue,
  };

  const isEmpty = cardIsEmpty(card);
  const encryptedCard = {
    ...(await encryptSensitiveCardDetails(card)),
    lastFour: evCard.cardNumberVerification.isValid
      ? cardNumberValue.substr(cardNumberValue.length - 4)
      : "",
    bin: evCard.cardNumberVerification.isValid
      ? binNumber(cardNumberValue, evCard.cardNumberVerification?.card?.type)
      : "",
  };

  setFrameHeight();
  return {
    encryptedCard,
    isValid: evCard.isCardValid(),
    isPotentiallyValid: evCard.isPotentiallyValid(),
    isEmpty,
    error,
  };
}

// Formatting of BIN taken from https://www.pcisecuritystandards.org/faq/articles/Frequently_Asked_Question/What-are-acceptable-formats-for-truncation-of-primary-account-numbers/
function binNumber(cardNumber: string, cardType: string | undefined): string {
  if (cardType) {
    if (cardType === "amex") {
      return cardNumber.substring(0, 6);
    }
    return cardNumber.substring(0, 8);
  }
  return "";
}

async function encryptSensitiveCardDetails(card: {
  number: string;
  cvc?: string;
  track: {
    fullTrack: string;
    trackOne: string;
    trackTwo: string;
  };
}): Promise<Partial<CardData>> {
  const encryptedCard = card;
  if (card.number) {
    const strippedCardNumber = card.number.replace(/\s/g, "");
    encryptedCard.number = await evervault.encrypt(strippedCardNumber);
  }
  if (card.cvc) {
    encryptedCard.cvc = await evervault.encrypt(card.cvc);
  }
  if (card.track.fullTrack.length > 0) {
    encryptedCard.track.fullTrack = await evervault.encrypt(
      card.track.fullTrack
    );
  }
  if (card.track.trackOne.length > 0) {
    encryptedCard.track.trackOne = await evervault.encrypt(card.track.trackOne);
  }
  if (card.track.trackTwo.length > 0) {
    encryptedCard.track.trackTwo = await evervault.encrypt(card.track.trackTwo);
  }
  return encryptedCard;
}

function cardIsEmpty(card: {
  number?: string;
  cvv?: string;
  expMonth?: string;
  expYear?: string;
}): boolean {
  return !card.number && !card.cvv && !card.expMonth && !card.expYear;
}

function mountWarningBanner(): void {
  const bodyElem = document.querySelector("body")!;
  const warningBanner = document.createElement("div");
  warningBanner.id = "warning-banner-holder";
  warningBanner.innerHTML = `<small>⚠️ Warning: you are in <a href="https://docs.evervault.com/concepts/inputs/debug-mode">debug mode</a>.</small>`;
  bodyElem.appendChild(warningBanner);
}

function watchSDKStatus(): void {
  const intervalRef: ReturnType<typeof setTimeout> = setInterval(() => {
    const sdkState = evervault.isInDebugMode();
    if (sdkState) {
      mountWarningBanner();
    }
    if (typeof sdkState !== "undefined") {
      clearInterval(intervalRef);
    }
  }, 750);
}

function setFrameHeight(): void {
  const height = urlParams.get("height");
  if (height !== "auto") return;

  const { scrollHeight } = document.body;
  window.parent.postMessage(
    { type: "EV_FRAME_HEIGHT", height: scrollHeight },
    "*"
  );
}

interface RevealRequestConfigMessageData {
  type: "revealRequestConfig";
  request: string;
  customStyles: CustomRevealStyles;
}

interface RevealMessage {
  data?: "message" | RevealRequestConfigMessageData | Labels;
}

interface LabelsMessage extends RevealMessage {
  data: Labels;
}

interface RevealRequestConfigMessage extends RevealMessage {
  data: RevealRequestConfigMessageData;
}

interface RevealDataRequest extends RevealMessage {
  data: "message";
  ports: { postMessage: (data: InputsData) => void }[];
}

const isLabels = (event: RevealMessage): event is LabelsMessage =>
  event.data !== "message" && event.data?.type !== "revealRequestConfig";

const isRevealDataRequest = (
  event: RevealMessage
): event is RevealDataRequest => event.data === "message";

const isRevealRequestConfigMessage = (
  event: RevealMessage
): event is RevealRequestConfigMessage =>
  event.data !== "message" && event.data?.type === "revealRequestConfig";

function onLoad(): void {
  if (!isReveal) {
    watchSDKStatus();
    inputElementsManager = new InputElementsManager(postToParent, {
      ...formOverrides,
      reveal: isReveal,
    });

    const magStripe = new MagStripe(inputElementsManager);

    document.addEventListener("keypress", magStripe.swipeCapture, true);
  }

  setFrameHeight();

  const revealRequestReceived = new Promise((resolve, reject) => {
    window.addEventListener(
      "message",
      (event: RevealMessage): void => {
        if (isRevealDataRequest(event)) {
          getData()
            .then((data) => event.ports[0]?.postMessage(data))
            .catch((e) => reject(e));
        } else if (isRevealRequestConfigMessage(event)) {
          const revealRequestPromise = setupReveal(event.data.request);
          if (event.data.customStyles) {
            customStyles(event.data.customStyles);
          }
          revealRequestPromise
            .then(() => resolve(true))
            .catch((e) => reject(e));
        } else if (isLabels(event)) {
          updateInputLabels(event.data);
          errorLabels = updateErrorLabels(errorLabels, event.data);
          getData().catch((e) => reject(e));
        }
      },
      false
    );

    if (!isReveal) {
      resolve(true);
    }
  });

  window.parent.postMessage({ type: "EV_INPUTS_LOADED" }, "*");

  revealRequestReceived
    .then(() => {
      if (isReveal) {
        document.getElementById("reveal-group")?.classList.remove("hide");

        setFrameHeight();

        window.parent.postMessage({ type: "EV_REVEAL_LOADED" }, "*");
      } else {
        setFrameHeight();
      }
    })
    .catch((e: Error) => {
      const serializedError = JSON.stringify({
        type: e.name,
        message: e.message,
        cause: e.cause,
      });
      window.parent.postMessage(
        {
          type: "EV_REVEAL_ERROR_EVENT",
          error: serializedError,
        },
        "*"
      );
    });
}

window.addEventListener("load", onLoad);
