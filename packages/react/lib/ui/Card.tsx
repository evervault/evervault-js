import * as React from "react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useImperativeHandle,
} from "react";
import type {
  AgentToolsConfig,
  CardBrandName,
  CardEvents,
  CardField as CardFieldName,
  CardIcons,
  CardOptions,
  CardPayload,
  CardTranslations,
  ColorScheme,
  CustomBrand,
  FieldEvent,
  SwipedCard,
  ThemeDefinition,
} from "types";
import { useEvInstance } from "../useEvInstance";
import { useEvervault } from "../useEvervault";
import EvervaultClient from "@evervault/browser";
import type { EvCard } from "@evervault/browser";
import {
  CardCvc,
  CardExpiry,
  CardExpiryMonth,
  CardExpiryYear,
  CardField,
  CardHolder,
  CardNumber,
  CardRow,
  DeprecatedCardContext,
} from "./cardElements";
import { FIELDS_IGNORED } from "./developerMessages";

export interface CardRef {
  validate: () => void;
  show: () => void;
}

export interface CardProps {
  /** The card's fields, in order; given, they replace `fields`. */
  children?: React.ReactNode;
  autoFocus?: boolean;
  colorScheme?: ColorScheme;
  theme?: ThemeDefinition;
  icons?: boolean | Partial<CardIcons>;
  translations?: CardTranslations;
  /** @deprecated Declare the fields as the card's children instead. */
  fields?: CardFieldName[];
  onReady?: () => void;
  onError?: () => void;
  onSwipe?: (data: SwipedCard) => void;
  onChange?: (data: CardPayload) => void;
  onComplete?: (data: CardPayload) => void;
  onValidate?: (data: CardPayload) => void;
  /** A map by field is deprecated: give each field its own `autoComplete`. */
  autoComplete?: CardOptions["autoComplete"];
  autoProgress?: boolean;
  acceptedBrands?: CardBrandName[];
  defaultValues?: { name?: string };
  onFocus?: (event: FieldEvent) => void;
  onBlur?: (event: FieldEvent) => void;
  onKeyUp?: (event: FieldEvent) => void;
  onKeyDown?: (event: FieldEvent) => void;
  /** @deprecated Use `<Card.Cvc redact />` instead. */
  redactCVC?: boolean;
  /** @deprecated Use `<Card.Cvc allow3DigitAmex />` instead. */
  allow3DigitAmexCVC?: boolean;
  validation?: CardOptions["validation"];
  customBrands?: CustomBrand[];
  agentTools?: AgentToolsConfig;
  preload?: boolean;
}

type CardInstance = ReturnType<EvervaultClient["ui"]["card"]>;

const OptionsCard = React.forwardRef(function OptionsCard(
  {
    colorScheme,
    theme,
    icons,
    fields,
    autoFocus,
    translations,
    onSwipe,
    onReady,
    onError,
    onChange,
    onComplete,
    onValidate,
    onFocus,
    onBlur,
    onKeyUp,
    onKeyDown,
    autoComplete,
    autoProgress,
    acceptedBrands,
    defaultValues,
    redactCVC,
    allow3DigitAmexCVC,
    validation,
    customBrands,
    agentTools,
    preload,
  }: CardProps,
  forwardedRef: React.ForwardedRef<CardRef>
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inst = useRef<CardInstance | null>(null);

  useImperativeHandle(
    forwardedRef,
    () => {
      return {
        validate: () => {
          inst.current?.validate();
        },
        show: () => {
          inst.current?.show();
        },
      };
    },
    []
  );

  const config = useMemo(
    () => ({
      colorScheme,
      theme,
      icons,
      fields,
      autoFocus,
      translations,
      autoComplete,
      autoProgress,
      acceptedBrands,
      defaultValues,
      redactCVC,
      allow3DigitAmexCVC,
      validation,
      customBrands,
      agentTools,
    }),
    [
      colorScheme,
      theme,
      icons,
      translations,
      fields,
      autoFocus,
      autoComplete,
      autoProgress,
      acceptedBrands,
      defaultValues,
      redactCVC,
      allow3DigitAmexCVC,
      validation,
      customBrands,
      agentTools,
    ]
  );

  const instance = useEvInstance({
    onMount(evervault) {
      if (!ref.current) return;
      const inst = evervault.ui.card(config);
      if (preload) {
        inst.preload(ref.current);
      } else {
        inst.mount(ref.current);
      }
      return inst;
    },
    onUpdate(instance) {
      instance.update(config);
    },
    onMountError: onError,
  });

  inst.current = instance;

  // setup ready event listener
  useEffect(() => {
    if (!instance || !onReady) return undefined;
    return instance?.on("ready", onReady);
  }, [instance, onReady]);

  // setup error event listener
  useEffect(() => {
    if (!instance || !onError) return undefined;
    return instance?.on("error", onError);
  }, [instance, onError]);

  // setup swipe event listener
  useEffect(() => {
    if (!instance || !onSwipe) return undefined;
    return instance?.on("swipe", onSwipe);
  }, [instance, onSwipe]);

  // setup change event listener
  useEffect(() => {
    if (!instance || !onChange) return undefined;
    return instance?.on("change", onChange);
  }, [instance, onChange]);

  // setup complete event listener
  useEffect(() => {
    if (!instance || !onComplete) return undefined;
    return instance?.on("complete", onComplete);
  }, [instance, onComplete]);

  // setup focus event listener
  useEffect(() => {
    if (!instance || !onFocus) return undefined;
    return instance?.on("focus", onFocus);
  }, [instance, onFocus]);

  // setup blur event listener
  useEffect(() => {
    if (!instance || !onBlur) return undefined;
    return instance?.on("blur", onBlur);
  }, [instance, onBlur]);

  // setup keyup event listener
  useEffect(() => {
    if (!instance || !onKeyUp) return undefined;
    return instance?.on("keyup", onKeyUp);
  }, [instance, onKeyUp]);

  // setup keydown event listener
  useEffect(() => {
    if (!instance || !onKeyDown) return undefined;
    return instance?.on("keydown", onKeyDown);
  }, [instance, onKeyDown]);

  // setup validate event listener
  useEffect(() => {
    if (!instance || !onValidate) return undefined;
    return instance?.on("validate", onValidate);
  }, [instance, onValidate]);

  return <div ref={ref} />;
});

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
} satisfies Record<SettingProp, true>) as SettingProp[] satisfies (keyof EvCard)[];

// A list setting reads back from its attribute as a new array.
function same(current: unknown, next: unknown) {
  if (Array.isArray(current) && Array.isArray(next)) {
    return (
      current.length === next.length &&
      current.every((item, index) => item === next[index])
    );
  }

  return current === next;
}

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
const DeclaredCard = React.forwardRef(function DeclaredCard(
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
      if (!same(card[setting], settings[setting])) {
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

const CardRoot = React.forwardRef<CardRef, CardProps>(function Card(
  props,
  forwardedRef
) {
  // Children that render nothing for a moment must not remount the card.
  if (props.children === undefined) {
    return <OptionsCard {...props} ref={forwardedRef} />;
  }

  return <DeclaredCard {...props} ref={forwardedRef} />;
});

export const Card = Object.assign(CardRoot, {
  Row: CardRow,
  Holder: CardHolder,
  Number: CardNumber,
  Expiry: CardExpiry,
  ExpiryMonth: CardExpiryMonth,
  ExpiryYear: CardExpiryYear,
  Cvc: CardCvc,
  Field: CardField,
});
