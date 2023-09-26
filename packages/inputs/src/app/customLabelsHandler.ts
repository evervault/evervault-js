const defaultInputLabels = {
  cardNumberLabel: "Card number",
  expirationDateLabel: "Expiration date",
  securityCodeLabel: "Security code",
  expirationDatePlaceholder: "MM/YY",
};

const defaultErrorLabels = {
  invalidCardNumberLabel: "Your card number is invalid",
  invalidExpirationDateLabel: "Your expiration date is invalid",
  invalidSecurityCodeLabel: "Your CVC is invalid",
};

export type Labels = typeof defaultErrorLabels & Record<string, string>;

export function setInputLabels(
  theme: string | null,
  urlParams: URLSearchParams,
  isReveal: boolean
): void {
  for (const [key, v] of Object.entries(defaultInputLabels)) {
    const param = urlParams.get(key);
    let value = v;
    if (param) {
      value = param;
    } else if (isReveal) {
      value = "";
    } else if (key === "cardNumberLabel" && theme === "minimal") {
      value = "Card information";
    }

    // Sanitize
    value = value.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    setLabel(key, value);
    setPlaceholder(key, value);
  }
}

export function updateInputLabels(labelUpdates: Labels): void {
  for (const [key, value] of Object.entries(labelUpdates)) {
    setLabel(key, value);
    setPlaceholder(key, value);
  }
}

function setPlaceholder(key: string, value: string): void {
  if (key === "expirationDateLabel") {
    return;
  }
  const elementId =
    key === "expirationDatePlaceholder"
      ? "expirationdate"
      : key.slice(0, -5).toLowerCase();
  const input = document.getElementById(elementId);
  if (input instanceof HTMLInputElement) {
    input.placeholder = value;
  }
}

function setLabel(key: string, value: string): void {
  const elements = document.getElementsByClassName(key);
  for (const element of elements) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }
    element.innerText = value;
  }
}

export function getErrorLabels(urlParams: URLSearchParams): Labels {
  return {
    invalidCardNumberLabel:
      urlParams.get("invalidCardNumberLabel") ??
      defaultErrorLabels.invalidCardNumberLabel,
    invalidExpirationDateLabel:
      urlParams.get("invalidExpirationDateLabel") ??
      defaultErrorLabels.invalidExpirationDateLabel,
    invalidSecurityCodeLabel:
      urlParams.get("invalidSecurityCodeLabel") ??
      defaultErrorLabels.invalidSecurityCodeLabel,
  };
}

export function updateErrorLabels(
  existingLabels: typeof defaultErrorLabels,
  newLabels: Labels
): Labels {
  return { ...existingLabels, ...newLabels };
}

const defaultFormOverrides = {
  disableCVV: false,
  disableExpiry: false,
};

export function setFormOverrides(
  urlParams: URLSearchParams
): typeof defaultFormOverrides {
  return {
    disableCVV: Boolean(
      urlParams.get("disableCVV") ?? defaultFormOverrides.disableCVV
    ),
    disableExpiry: Boolean(
      urlParams.get("disableExpiry") ?? defaultFormOverrides.disableExpiry
    ),
  };
}
