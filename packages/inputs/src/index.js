import Evervault from "@evervault/browser";

import customStylesHandler from "./customStylesHandler";
import "./styles.css";
import {
  setInputLabels,
  updateInputLabels,
  getErrorLabels,
  updateErrorLabels,
  setFormOverrides,
} from "./customLabelsHandler";
import EvervaultCard from "./EvervaultCard";

import { InputElementsManager } from "./InputElementsManager";
import { MagStripe } from "./MagStripe";

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

let inputElementsManager;

function insertLinkTag(id, rel, href, options = {}) {
  if (!document.getElementById(id)) {
    const head = document.getElementsByTagName("head")[0];
    const link = document.createElement("link");
    link.id = id;
    link.rel = rel;
    link.href = href;
    Object.keys(options).forEach((key) => {
      link[key] = options[key];
    });
    head.appendChild(link);
  }
}

if (fontUrl) {
  try {
    const parsedFontUrl = new URL(fontUrl);

    // Only allow fonts from fonts.googleapis.com
    if (parsedFontUrl.hostname !== "fonts.googleapis.com") {
      throw new Error("Invalid fontUrl. Please use a fontUrl from fonts.googleapis.com")
    } else {
      // Avoid CSRF or Clickjacking attacks by reconstructing the URL
      const reconstructedGoogleFontUrl = new URL(parsedFontUrl.pathname, "https://fonts.googleapis.com");
      reconstructedGoogleFontUrl.params = parsedFontUrl.params;

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

      insertLinkTag("font-url", "stylesheet", reconstructedGoogleFontUrl.toString(), {
        type: "text/css",
        media: "all",
      });
    }
  } catch(e) {
    console.error(e);
    console.error("The above error means that your custom font's have not been set.")
  }
}

// Custom Styles
customStylesHandler(urlParams);
// Custom Labels
setInputLabels(theme, urlParams);
// Custom Form Overrides
const formOverrides = setFormOverrides(urlParams);

let errorLabels = getErrorLabels(urlParams);

const form = document.getElementById("form");
const evervault = new Evervault(team, app);
evervault.loadKeys();

// Assign theme class if theme is minimal
if (form && theme) {
  document.getElementById("form")?.classList.add(`form-${theme}`);
}

let evCard;
if (formOverrides.disableCVV) {
  evCard = new EvervaultCard(
    DEFAULT_CARD_CONFIG.filter((field) => field !== "cardCVV")
  );
  document.getElementById("security-code-container")?.classList.add("hide");
} else {
  evCard = new EvervaultCard(DEFAULT_CARD_CONFIG);
}

const postToParent = async () => {
  window.parent.postMessage(await getData(), "*");
};

const getData = async () => {
  const helper = document.getElementById("helper");
  const track = {
    fullTrack: document.getElementById("trackdata").value,
    trackOne: document.getElementById("trackone").value,
    trackTwo: document.getElementById("tracktwo").value,
  };
  const name = document.getElementById("name").value;

  const cardNumberValue = inputElementsManager?.masks.cardNumber.unmaskedValue;
  const expirationDateValue =
    inputElementsManager?.masks.expirationDate.unmaskedValue;
  const cvcValue = formOverrides.disableCVV
    ? null
    : inputElementsManager?.masks.cvc.unmaskedValue;

  evCard.cardNumber = cardNumberValue;
  evCard.cardExpiry = expirationDateValue;
  evCard.cardCVV = cvcValue ?? "";
  const error = evCard.generateError(errorLabels);

  helper.innerText = error.length > 0 ? error[0].message : "";

  if (error.length > 0) {
    helper.classList.add("helper-visible");
  } else {
    helper.classList.remove("helper-visible");
  }

  if (evCard.cardNumber.isPotentiallyValid) {
    inputElementsManager.els.cardNumber.classList.remove("input-invalid");
  } else {
    inputElementsManager.els.cardNumber.classList.add("input-invalid");
  }

  if (evCard.cardExpiry.isPotentiallyValid) {
    inputElementsManager.els.expirationDate.classList.remove("input-invalid");
  } else {
    inputElementsManager.els.expirationDate.classList.add("input-invalid");
  }

  if (evCard.cardCVV.isPotentiallyValid && !formOverrides.disableCVV) {
    inputElementsManager.els.cvc.classList.remove("input-invalid");
  } else if (!formOverrides.disableCVV) {
    inputElementsManager.els.cvc.classList.add("input-invalid");
  }

  let card = {
    type: evCard.cardNumber?.card?.type ?? "",
    number: cardNumberValue,
    expMonth: evCard.cardExpiry.month ?? "",
    expYear: evCard.cardExpiry.year ?? "",
    track,
    name,
    swipe: track.fullTrack.length > 0 ? true : false,
  };

  if (!formOverrides.disableCVV) {
    card = { ...card, cvc: cvcValue };
  }

  const isEmpty = cardIsEmpty(card);

  const encryptedCard = {
    ...(await encryptSensitiveCardDetails(card)),
    lastFour: evCard.cardNumber.isValid
      ? cardNumberValue.substr(cardNumberValue.length - 4)
      : "",
    bin: evCard.cardNumber.isValid ? cardNumberValue.substr(0, 6) : "",
  };

  setFrameHeight();

  return {
    encryptedCard,
    isValid: evCard.isCardValid(),
    isPotentiallyValid: evCard.isPotentiallyValid(),
    isEmpty,
    error,
  };
};

async function encryptSensitiveCardDetails(card) {
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

function cardIsEmpty(card) {
  return !card.number && !card.cvc && !card.expMonth && !card.expYear;
}

function mountWarningBanner() {
  const bodyElem = document.querySelector("body");
  const warningBanner = document.createElement("div");
  warningBanner.id = "warning-banner-holder";
  warningBanner.innerHTML = `<small>⚠️ Warning: you are in <a href="https://docs.evervault.com/concepts/inputs/debug-mode">debug mode</a>.</small>`;
  bodyElem.appendChild(warningBanner);
}

function watchSDKStatus() {
  let intervalRef;
  intervalRef = setInterval(() => {
    const sdkState = evervault.isInDebugMode();
    if (sdkState) {
      mountWarningBanner();
    }
    if (typeof sdkState !== "undefined") {
      clearInterval(intervalRef);
    }
  }, 750);
}

function setFrameHeight() {
  const height = urlParams.get("height");
  if (height !== "auto") return;

  const scrollHeight = document.body.scrollHeight;
  parent.postMessage({ type: "EV_FRAME_HEIGHT", height: scrollHeight }, "*");
}

window.onload = function() {
  watchSDKStatus();
  inputElementsManager = new InputElementsManager(postToParent, formOverrides);
  const magStripe = new MagStripe(inputElementsManager)
  setFrameHeight();

  window.addEventListener(
    "message",
    async (event) => {
      if (event.data == "message") {
        event.ports[0]?.postMessage(await getData());
      } else {
        updateInputLabels(event.data);
        errorLabels = updateErrorLabels(errorLabels, event.data);
        getData();
      }
    },
    false
  );

  document.addEventListener("keypress", magStripe.swipeCapture, true);
};
