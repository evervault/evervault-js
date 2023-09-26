export interface InputMessage {
  origin: string;
  data?: {
    type:
      | "EV_FRAME_HEIGHT"
      | "EV_INPUTS_LOADED"
      | "EV_FRAME_READY"
      | "EV_REVEAL_COPY_EVENT"
      | "EV_REVEAL_LOADED"
      | "EV_REVEAL_ERROR_EVENT";
  };
}

export interface EvFrameHeight extends InputMessage {
  data: {
    type: "EV_FRAME_HEIGHT";
    height: string;
  };
}

export interface EvRevealErrorEvent extends InputMessage {
  data: {
    type: "EV_REVEAL_ERROR_EVENT";
    error: string;
  };
}

export interface InputError {
  message: string;
  type: string;
}

export interface CardData {
  number?: string;
  cvc?: string;
  lastFour: string;
  bin: string;
  track?: {
    fullTrack: string;
    trackOne: string;
    trackTwo: string;
  };
}
export interface InputsData {
  encryptedCard: CardData;
  isValid: boolean;
  isPotentiallyValid: boolean;
  isEmpty: boolean;
  error: { type: string; message: string }[];
}
