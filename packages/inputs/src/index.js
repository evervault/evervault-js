import BrowserEncryptor from '@evervault/browser-encryptor';

import IMask from 'imask';
import customStylesHandler from './customStylesHandler';
import './styles.css';
import { swipeCapture } from './MagStripe';
import { setInputLabels, updateInputLabels, getErrorLabels, updateErrorLabels, setFormOverrides } from './customLabelsHandler';
import EvervaultCard from './EvervaultCard';

document.addEventListener('keypress', swipeCapture, true);

const DEFAULT_CARD_CONFIG = ['cardNumber', 'cardExpiry', 'cardCVV']

const queryString = decodeURIComponent(window.location.search);
const urlParams = new URLSearchParams(queryString);

// Team ID
const team = urlParams.get('team');
// App ID
const app = urlParams.get('app');
// Theme: default, minimal or material
const theme = urlParams.get('theme');
const fontUrl = urlParams.get('fontUrl');

function insertLinkTag (id, rel, href, options = {}) {
  if (!document.getElementById(id)) {
    const head  = document.getElementsByTagName('head')[0];
    const link  = document.createElement('link');
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
  insertLinkTag(
    'font-preconnect', 
    'preconnect', 
    'https://fonts.googleapis.com'
  );

  insertLinkTag(
    'font-preconnect-cors', 
    'preconnect', 
    'https://fonts.gstatic.com', 
    { crossOrigin: '' }
  );

  insertLinkTag(
    'font-url', 
    'stylesheet', 
    fontUrl, 
    {
      type: 'text/css',
      media: 'all',
    }
  );
}

// Custom Styles
customStylesHandler(urlParams);
// Custom Labels
setInputLabels(theme, urlParams);
// Custom Form Overrides
const formOverrides = setFormOverrides(urlParams);

let errorLabels = getErrorLabels(urlParams);

const form = document.getElementById('form');
const encryptor = new BrowserEncryptor(team, app, { context: 'inputs'});
encryptor.loadKeys();

// Assign theme class if theme is minimal
if (form && theme) {
  document.getElementById('form')?.classList.add(`form-${theme}`);
}

let evCard;
if (formOverrides.disableCVV) {
  evCard = new EvervaultCard(DEFAULT_CARD_CONFIG.filter(field => field !== 'cardCVV'));
  document.getElementById('security-code-container')?.classList.add('hide');
} else {
  evCard = new EvervaultCard(DEFAULT_CARD_CONFIG);
}

const postToParent = async () => {
  parent?.postMessage(await getData(), '*');
};

const getData = async () => {
  const cardNumber = document.getElementById('cardnumber');
  const expirationDate = document.getElementById('expirationdate');
  const cvc = document.getElementById('securitycode');
  const helper = document.getElementById('helper');
  const track = {
    fullTrack: document.getElementById('trackdata').value,
    trackOne: document.getElementById('trackone').value,
    trackTwo: document.getElementById('tracktwo').value
  };
  const name = document.getElementById('name').value;

  evCard.cardNumber = cardNumber.value;
  evCard.cardExpiry = expirationDate.value;
  evCard.cardCVV = formOverrides.disableCVV ? '' : cvc.value;
  const error = evCard.generateError(errorLabels);

  helper.innerText = error.length > 0 ? error[0].message : '';

  if (error.length > 0) {
    helper.classList.add('helper-visible');
  } else {
    helper.classList.remove('helper-visible');
  }

  if (evCard.cardNumber.isPotentiallyValid) {
    cardNumber.classList.remove('input-invalid');
  } else {
    cardNumber.classList.add('input-invalid');
  }

  if (evCard.cardExpiry.isPotentiallyValid) {
    expirationDate.classList.remove('input-invalid');
  } else {
    expirationDate.classList.add('input-invalid');
  }

  if (evCard.cardCVV.isPotentiallyValid && !formOverrides.disableCVV) {
    cvc.classList.remove('input-invalid');
  } else if (!formOverrides.disableCVV) {
    cvc.classList.add('input-invalid');
  }

  // Input masking
  IMask(cardNumber, { mask: '0000 0000 0000 0000' });
  IMask(expirationDate, {
    mask: 'MM / YY',
    blocks: {
      MM: {
        mask: IMask.MaskedRange,
        placeholderChar: 'MM',
        from: 1,
        to: 12,
        maxLength: 2,
      },
      YY: {
        mask: IMask.MaskedRange,
        placeholderChar: 'YY',
        from: 0,
        to: 99,
        maxLength: 2,
      },
    },
  });
  if (!formOverrides.disableCVV) {
    IMask(cvc, { mask: '000[0]' });
  }

  let card = {
    type: evCard.cardNumber?.card?.type ?? '',
    number: cardNumber.value,
    expMonth: evCard.cardExpiry.month ?? '',
    expYear: evCard.cardExpiry.year ?? '',
    track,
    name,
    swipe: track.fullTrack.length > 0 ? true : false,
  };

  if (!formOverrides.disableCVV) {
    card = {...card, cvc: cvc.value}
  }

  const isEmpty = cardIsEmpty(card);

  const encryptedCard = {
    ...(await encryptSensitiveCardDetails(card)),
    lastFour: evCard.cardNumber.isValid
      ? cardNumber.value.substr(cardNumber.value.length - 4)
      : '',
    bin: evCard.cardNumber.isValid
      ? cardNumber.value.replace(' ', '').substr(0, 6)
      : '',
  };

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
    const strippedCardNumber = card.number.replace(/\s/g, '');
    encryptedCard.number = await encryptor.encrypt(strippedCardNumber);
  }
  if (card.cvc) {
    encryptedCard.cvc = await encryptor.encrypt(card.cvc);
  }
  if (card.track.fullTrack.length > 0) {
    encryptedCard.track.fullTrack = await encryptor.encrypt(
      card.track.fullTrack
    );
  }
  if (card.track.trackOne.length > 0) {
    encryptedCard.track.trackOne = await encryptor.encrypt(card.track.trackOne);
  }
  if (card.track.trackTwo.length > 0) {
    encryptedCard.track.trackTwo = await encryptor.encrypt(card.track.trackTwo);
  }
  return encryptedCard;
}

function cardIsEmpty(card) {
  return !card.number && !card.cvc && !card.expMonth && !card.expYear;
}

function addListener(id) {
  const input = document.getElementById(id);
  input.addEventListener('input', postToParent);
}

function mountWarningBanner() {
  const bodyElem = document.querySelector('body');
  const warningBanner = document.createElement('div');
  warningBanner.id = 'warning-banner-holder';
  warningBanner.innerHTML = `<small>⚠️ Warning: you are in <a href="https://docs.evervault.com/concepts/inputs/debug-mode">debug mode</a>.</small>`;
  bodyElem.appendChild(warningBanner);
}

function watchSDKStatus() {
  let intervalRef;
  intervalRef = setInterval(() => {
    const sdkState = encryptor.isInDebugMode();
    if (sdkState) {
      mountWarningBanner();
    }
    if (typeof sdkState !== 'undefined') {
      clearInterval(intervalRef);
    }
  }, 750);
}

window.onload = function() {
  watchSDKStatus();
  addListener('cardnumber');
  addListener('expirationdate');
  addListener('securitycode');
};

window.addEventListener(
  'message',
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
