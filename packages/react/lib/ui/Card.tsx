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
  CardField,
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
  CardCustomField,
  CardCvc,
  CardExpiry,
  CardExpiryMonth,
  CardExpiryYear,
  CardHolder,
  CardNumber,
  CardRow,
} from "./cardElements";

export interface CardRef {
  validate: () => void;
  show: () => void;
}

export interface CardProps {
  // Declared fields replace `fields`, rendered in the order written.
  children?: React.ReactNode;
  autoFocus?: boolean;
  colorScheme?: ColorScheme;
  theme?: ThemeDefinition;
  icons?: boolean | Partial<CardIcons>;
  translations?: CardTranslations;
  fields?: CardField[];
  onReady?: () => void;
  onError?: () => void;
  onSwipe?: (data: SwipedCard) => void;
  onChange?: (data: CardPayload) => void;
  onComplete?: (data: CardPayload) => void;
  onValidate?: (data: CardPayload) => void;
  autoComplete?: CardOptions["autoComplete"];
  autoProgress?: boolean;
  acceptedBrands?: CardBrandName[];
  defaultValues?: { name?: string };
  onFocus?: (event: FieldEvent) => void;
  onBlur?: (event: FieldEvent) => void;
  onKeyUp?: (event: FieldEvent) => void;
  onKeyDown?: (event: FieldEvent) => void;
  redactCVC?: boolean;
  allow3DigitAmexCVC?: boolean;
  validation?: CardOptions["validation"];
  customBrands?: CustomBrand[];
  agentTools?: AgentToolsConfig;
  preload?: boolean;
}

type CardInstance = ReturnType<EvervaultClient["ui"]["card"]>;

const OptionsCard = React.forwardRef<CardRef, CardProps>(function OptionsCard(
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
  forwardedRef
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

// The `<ev-card>` properties a declared card's props are passed through to.
const SETTINGS = [
  "theme",
  "icons",
  "autoFocus",
  "translations",
  "acceptedBrands",
  "customBrands",
  "defaultValues",
  "autoComplete",
  "redactCVC",
  "allow3DigitAmexCVC",
  "validation",
  "agentTools",
] as const;

const EVENTS = {
  ready: "onReady",
  error: "onError",
  change: "onChange",
  complete: "onComplete",
  swipe: "onSwipe",
  validate: "onValidate",
  focus: "onFocus",
  blur: "onBlur",
  keydown: "onKeyDown",
  keyup: "onKeyUp",
} as const;

// A card rendered as the `<ev-card>` element, from its declared children.
const DeclaredCard = React.forwardRef<CardRef, CardProps>(function DeclaredCard(
  props,
  forwardedRef
) {
  const { children, colorScheme, autoProgress } = props;
  const ref = useRef<EvCard | null>(null);
  const evervault = useEvervault();

  const latest = useRef(props);
  latest.current = props;

  useImperativeHandle(
    forwardedRef,
    () => ({
      validate: () => {
        ref.current?.validate();
      },
    }),
    []
  );

  // Before mounting, so the card mounts with them; only a changed one is set,
  // since each sends the card its settings again.
  useLayoutEffect(() => {
    const card = ref.current as Record<string, unknown> | null;
    if (!card) return;

    for (const setting of SETTINGS) {
      if (card[setting] !== props[setting]) card[setting] = props[setting];
    }
  });

  useEffect(() => {
    const card = ref.current;
    if (!card) return undefined;

    const listeners = Object.entries(EVENTS).map(([event, prop]) => {
      const listener = (dispatched: Event) => {
        const callback = latest.current[prop] as
          | ((detail?: unknown) => void)
          | undefined;
        callback?.((dispatched as CustomEvent).detail ?? undefined);
      };

      card.addEventListener(event, listener);
      return () => card.removeEventListener(event, listener);
    });

    return () => listeners.forEach((remove) => remove());
  }, []);

  useEffect(() => {
    let cancelled = false;

    evervault?.then(
      (client) => {
        const card = ref.current;
        if (!cancelled && card && !card.isMounted) card.mountCard(client);
      },
      (error: unknown) => {
        latest.current.onError?.();
        console.error(error);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [evervault]);

  return React.createElement(
    "ev-card",
    {
      ref,
      colorscheme: colorScheme,
      autoprogress:
        autoProgress === undefined ? undefined : autoProgress ? "" : "false",
    },
    children
  );
});

const CardRoot = React.forwardRef<CardRef, CardProps>(function Card(
  props,
  forwardedRef
) {
  if (React.Children.toArray(props.children).length === 0) {
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
  Field: CardCustomField,
});
