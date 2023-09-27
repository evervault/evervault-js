import type { InputElementsManager } from "./InputElementsManager";

interface Track {
  number: string;
  expMonth: string;
  expYear: string;
}

interface TrackOne extends Track {
  name: string;
}

interface TrackOneAndTwo extends TrackOne {
  typename: "TrackOneAndTwo";
  trackOne: string;
  trackTwo: string;
}

interface TrackTwoOnly extends Track {
  typename: "TrackTwoOnly";
  trackTwo: string;
}

const toTitleCase = (name: string): string =>
  name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase();

function parseName(nameData: string): string {
  const splitName = nameData.split("/");
  const surname = toTitleCase(splitName[0]);
  const firstName = toTitleCase(splitName[1].split(".")[0]);
  return `${firstName} ${surname}`;
}

function parseTrackOne(trackOneData: string): TrackOne {
  const data = trackOneData.split("^");
  const number = data[0];
  const name = parseName(data[1]);
  const expYear = data[2].substring(0, 2);
  const expMonth = data[2].substring(2, 4);
  return {
    number,
    name,
    expMonth,
    expYear,
  };
}

function parseTrackTwo(trackOneData: string): Track {
  const data = trackOneData.split("=");
  const number = data[0];
  const expYear = data[1].substring(0, 2);
  const expMonth = data[1].substring(2, 4);
  return {
    number,
    expMonth,
    expYear,
  };
}

function parseCard(cardString: string): TrackOneAndTwo | TrackTwoOnly {
  if (cardString.substring(0, 2).toLowerCase() === "%B".toLowerCase()) {
    const tracks = cardString.split("?;");
    const trackOne = tracks[1] ? `${tracks[0]}?` : tracks[0];
    const trackTwo = tracks[1] ? `;${tracks[1]}` : "";
    return {
      typename: "TrackOneAndTwo",
      trackOne,
      trackTwo,
      ...parseTrackOne(trackOne.substring(2)),
    };
  }
  if (cardString.startsWith(";")) {
    return {
      typename: "TrackTwoOnly",
      trackTwo: cardString,
      ...parseTrackTwo(cardString.substring(1)),
    };
  }
  throw new Error("Invalid card string");
}

export class MagStripe {
  #inputsManager: InputElementsManager;

  #mostRecentPresses: string[];

  constructor(inputsManager: InputElementsManager) {
    this.#inputsManager = inputsManager;
    this.#mostRecentPresses = [];
  }

  swipeCapture = (event: KeyboardEvent): void => {
    this.#mostRecentPresses.push(event.key);
    if (this.#mostRecentPresses.slice(-2).join("") === "%B") {
      this.#mostRecentPresses.splice(0, this.#mostRecentPresses.length - 2);
    }
    if (
      this.#mostRecentPresses.slice(0, 2).join("") !== "%B" &&
      this.#mostRecentPresses.slice(-1)[0] === ";"
    ) {
      this.#mostRecentPresses.splice(0, this.#mostRecentPresses.length - 1);
    }
    if (
      (this.#mostRecentPresses.slice(0, 2).join("") === "%B" ||
        this.#mostRecentPresses[0] === ";") &&
      JSON.stringify(this.#mostRecentPresses.slice(-2)) ===
        JSON.stringify(["?", "Enter"])
    ) {
      // If track one and track two are present

      const trackData = this.#mostRecentPresses.slice(0, -1).join("");

      const parsedTrackData = parseCard(trackData);

      if (parsedTrackData.typename === "TrackOneAndTwo") {
        console.debug("Card swipe: Track 1 and 2 present");
        const { number, name, expMonth, expYear, trackOne, trackTwo } =
          parsedTrackData;
        this.#inputsManager.masks.cardNumber.unmaskedValue = number;
        this.#inputsManager.masks.expirationDate.value = `${expMonth} / ${expYear}`;

        this.#inputsManager.elements.name.value = name;
        this.#inputsManager.elements.trackData.value = trackData;
        this.#inputsManager.elements.trackOne.value = trackOne;
        this.#inputsManager.elements.trackTwo.value = trackTwo;

        this.#inputsManager.elements.cardNumber.dispatchEvent(
          new Event("input")
        );
        this.#inputsManager.elements.cardNumber.disabled = true;
        this.#inputsManager.elements.expirationDate.disabled = true;

        this.#mostRecentPresses.length = 0;
      } else if (parsedTrackData.typename === "TrackTwoOnly") {
        console.debug("Card swipe: Track 2 present");
        // If just track two is present
        const { number, expMonth, expYear, trackTwo } = parsedTrackData;

        this.#inputsManager.masks.cardNumber.unmaskedValue = number;
        this.#inputsManager.masks.expirationDate.value = `${expMonth} / ${expYear}`;

        this.#inputsManager.elements.name.value = "";
        this.#inputsManager.elements.trackData.value = trackData;
        this.#inputsManager.elements.trackOne.value = "";
        this.#inputsManager.elements.trackTwo.value = trackTwo;

        this.#inputsManager.elements.cardNumber.dispatchEvent(
          new Event("input")
        );
        this.#inputsManager.elements.cardNumber.disabled = true;
        this.#inputsManager.elements.expirationDate.disabled = true;

        this.#mostRecentPresses.length = 0;
      }
    }
  };
}
