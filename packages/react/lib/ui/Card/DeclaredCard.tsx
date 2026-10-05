import * as React from "react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useImperativeHandle,
} from "react";
import type { CardEvents } from "types";
import type { EvCard } from "@evervault/browser";
import { useEvervault } from "../../useEvervault";
import { isSameValue } from "../../utils";
import type { CardProps, CardRef } from "./Card";
import { FIELDS_IGNORED } from "./developerMessages";
import { DeprecatedCardContext } from "./fields";

type EventProp = Extract<keyof CardProps, `on${string}`>;

// Not `<ev-card>`'s: the fields, and the deprecated props they replace.
type FieldProp = "children" | "fields" | "redactCVC" | "allow3DigitAmexCVC";

type SettingProp = Exclude<keyof CardProps, EventProp | FieldProp>;

// The `<ev-card>` properties a declared card's props are passed through to,
// keyed by prop so that a prop left out fails to compile.
const SETTINGS = Object.keys({
  theme: true,
  colorScheme: true,
  autoProgress: true,
  icons: true,
  autoFocus: true,
  translations: true,
  acceptedBrands: true,
  customBrands: true,
  defaultValues: true,
  autoComplete: true,
  validation: true,
  agentTools: true,
  preload: true,
} satisfies Record<SettingProp, true>) as SettingProp[] satisfies (keyof EvCard)[];

// Keyed by prop so that a prop left out fails to compile.
const EVENTS = {
  onReady: "ready",
  onError: "error",
  onChange: "change",
  onComplete: "complete",
  onSwipe: "swipe",
  onValidate: "validate",
  onFocus: "focus",
  onBlur: "blur",
  onKeyDown: "keydown",
  onKeyUp: "keyup",
} as const satisfies Record<EventProp, keyof CardEvents>;

// A card rendered as the `<ev-card>` element, from its declared children.
export const DeclaredCard = React.forwardRef(function DeclaredCard(
  props: CardProps,
  forwardedRef: React.ForwardedRef<CardRef>
) {
  const ref = useRef<EvCard | null>(null);
  const evervault = useEvervault();

  const latest = useRef(props);

  useLayoutEffect(() => {
    latest.current = props;
  });

  useImperativeHandle(
    forwardedRef,
    () => ({
      validate: () => {
        // Until the SDK registers `<ev-card>`, the element has no methods.
        if (ref.current?.isMounted) ref.current.validate();
      },
      show: () => {
        // Before the card mounts too: it then mounts shown.
        ref.current?.show?.();
      },
    }),
    []
  );

  // Before mounting, so the card mounts with them; only a changed one is set,
  // since each sends the card its settings again.
  useLayoutEffect(() => {
    const card = ref.current as Record<string, unknown> | null;
    if (!card) return;

    // `<ev-card>` takes autofill on or off; a map by field is for the fields.
    const settings = {
      ...props,
      autoComplete:
        typeof props.autoComplete === "boolean"
          ? props.autoComplete
          : undefined,
    };

    for (const setting of SETTINGS) {
      // A list setting reads back from its attribute as a new array.
      if (!isSameValue(card[setting], settings[setting])) {
        card[setting] = settings[setting];
      }
    }
  });

  useEffect(() => {
    const card = ref.current;
    if (!card) return undefined;

    const listeners = Object.entries(EVENTS).map(([prop, event]) => {
      const listener = (dispatched: Event) => {
        // The browser's own focus and key events share these names.
        if (!(dispatched instanceof CustomEvent)) return;

        const callback = latest.current[prop as EventProp] as
          | ((detail?: unknown) => void)
          | undefined;
        callback?.(dispatched.detail ?? undefined);
      };

      card.addEventListener(event, listener);
      return () => card.removeEventListener(event, listener);
    });

    return () => listeners.forEach((remove) => remove());
  }, []);

  const fieldsIgnored = props.fields !== undefined;

  useEffect(() => {
    if (fieldsIgnored) {
      console.warn(FIELDS_IGNORED);
    }
  }, [fieldsIgnored]);

  useEffect(() => {
    let cancelled = false;

    evervault
      ?.then((client) => {
        const card = ref.current;
        if (!cancelled && card && !card.isMounted) card.mountCard(client);
      })
      .catch((error: unknown) => {
        latest.current.onError?.();
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [evervault]);

  const { autoComplete, redactCVC, allow3DigitAmexCVC } = props;
  const deprecated = useMemo(
    () => ({ autoComplete, redactCVC, allow3DigitAmexCVC }),
    [autoComplete, redactCVC, allow3DigitAmexCVC]
  );

  return (
    <DeprecatedCardContext.Provider value={deprecated}>
      {React.createElement("ev-card", { ref }, props.children)}
    </DeprecatedCardContext.Provider>
  );
});
