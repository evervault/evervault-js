import type {
  CardFrameClientMessages,
  EvervaultFrameClientMessages,
  FormFrameClientMessages,
  GooglePayClientMessages,
  PinFrameClientMessages,
  RevealConsumerClientMessages,
  RevealRequestClientMessages,
  ThreeDSecureFrameClientMessages,
} from "types";

type Guard = (payload: unknown) => boolean;

/**
 * Runtime checks for the payload of each message a frame can receive. They
 * check only the fields the SDK relies on and ignore extra ones, so a newer
 * iframe can add fields without older SDKs dropping its messages.
 */
export type MessageGuards<M> = Record<keyof M, Guard>;

/** The guards a frame supplies on top of the ones every frame shares. */
export type FrameGuards<M extends EvervaultFrameClientMessages> = Omit<
  MessageGuards<M>,
  keyof EvervaultFrameClientMessages
>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown) => typeof value === "string";

const isOptionalString = (value: unknown) =>
  value === undefined || value === null || typeof value === "string";

const ignored: Guard = () => true;

const isCardPayload: Guard = (value) =>
  isRecord(value) &&
  isRecord(value.card) &&
  isRecord(value.fields) &&
  typeof value.isValid === "boolean" &&
  typeof value.isComplete === "boolean";

const isFieldTarget: Guard = (value) =>
  typeof value === "string" ||
  (isRecord(value) && value.field === "field" && isString(value.name));

const isPinPayload: Guard = (value) =>
  isRecord(value) &&
  typeof value.isComplete === "boolean" &&
  isOptionalString(value.value);

export const BASE_GUARDS: MessageGuards<EvervaultFrameClientMessages> = {
  EV_ERROR: (value) =>
    value === undefined || (isRecord(value) && isString(value.message)),
  EV_RESIZE: (value) => isRecord(value) && typeof value.height === "number",
  EV_FRAME_READY: ignored,
  EV_FRAME_HANDSHAKE: ignored,
};

export const CARD_GUARDS: FrameGuards<CardFrameClientMessages> = {
  EV_SWIPE: isRecord,
  EV_CHANGE: isCardPayload,
  EV_COMPLETE: isCardPayload,
  EV_VALIDATED: isCardPayload,
  EV_FOCUS: isFieldTarget,
  EV_BLUR: isFieldTarget,
  EV_KEYDOWN: isFieldTarget,
  EV_KEYUP: isFieldTarget,
};

export const PIN_GUARDS: FrameGuards<PinFrameClientMessages> = {
  EV_CHANGE: isPinPayload,
  EV_COMPLETE: isPinPayload,
};

export const FORM_GUARDS: FrameGuards<FormFrameClientMessages> = {
  EV_SUBMITTED: ignored,
};

export const REVEAL_REQUEST_GUARDS: FrameGuards<RevealRequestClientMessages> = {
  EV_REVEAL_REQUEST_READY: ignored,
};

export const REVEAL_CONSUMER_GUARDS: FrameGuards<RevealConsumerClientMessages> =
  {
    EV_COPY: ignored,
    EV_REVEAL_CONSUMER_READY: ignored,
    EV_REVEAL_CONSUMER_ERROR: isString,
  };

export const THREE_D_SECURE_GUARDS: FrameGuards<ThreeDSecureFrameClientMessages> =
  {
    EV_SUCCESS: isOptionalString,
    EV_FAILURE: isOptionalString,
    EV_FAILURE_FORCED_DUE_TO_CHALLENGE: isOptionalString,
    EV_FAIL_ON_CHALLENGE: ignored,
    EV_CANCEL: ignored,
  };

export const GOOGLE_PAY_GUARDS: FrameGuards<GooglePayClientMessages> = {
  EV_GOOGLE_PAY_AUTH: (value) => isRecord(value) && isRecord(value.card),
  EV_GOOGLE_PAY_CANCELLED: ignored,
  EV_GOOGLE_PAY_ERROR: isString,
  EV_GOOGLE_PAY_SUCCESS: ignored,
  EV_GOOGLE_PAY_UNAVAILABLE: ignored,
  EV_GOOGLE_PAY_DATA_CHANGE: (value) =>
    isRecord(value) && isString(value.id) && typeof value.amount === "number",
};
