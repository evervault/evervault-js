import { useLayoutEffect, useRef, useState } from "react";

const TRACK_ONE = /^%B(\d{1,19})\^([A-Z\s/]{2,26})\^(\d{2})(\d{2})\d{3}.+\?/;
const TRACK_TWO = /^;(\d{1,19})=(\d{2})(\d{2})\d{3}(.+)\?/;

export type MagStripeData = {
  number: string;
  year: string;
  month: string;
  firstName?: string;
  lastName?: string;
};

// Some readers will emit meta keys that we want to ignore.
const IGNORED_KEYS = ["Meta", "Shift", "Enter"];

// Custom hook to read card data from a mag stripe card reader.
// The callback will be called with the card data when a card is swiped.
export function useCardReader(callback: (data: MagStripeData) => void) {
  const data = useRef("");
  const [listening, setListening] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isIgnoredKey = IGNORED_KEYS.includes(event.key);

      // Start listening if the pressed key is the first character of either
      // the track one or track two format.
      if (!listening && !isIgnoredKey && [";", "%"].includes(event.key)) {
        setListening(true);
        data.current = event.key;
      }

      if (listening) {
        if (!isIgnoredKey) data.current += event.key;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          setListening(false);
          const card = parseMagStripe(data.current);
          data.current = "";
          if (card) callback(card);
        }, 200);
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [listening, callback]);

  return listening;
}

function parseMagStripe(data: string): MagStripeData | null {
  if (data.match(TRACK_ONE)) return parseTrackOne(data);
  if (data.match(TRACK_TWO)) return parseTrackTwo(data);
  return null;
}

function parseTrackTwo(data: string) {
  const match = data.match(TRACK_TWO);
  if (!match) return null;

  const [, number, year, month, discretionary] = match;

  return {
    number,
    year,
    month,
    discretionary,
  };
}

function parseTrackOne(data: string) {
  const match = data.match(TRACK_ONE);
  if (!match) return null;

  const [, number, name, year, month] = match;

  const [lastName, firstName] = name.split("/").map((n) => n.trim());

  return {
    number,
    firstName,
    lastName,
    year,
    month,
  };
}
