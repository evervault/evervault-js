const defaultInputLabels = {
  cardNumberLabel: "Card number",
  expirationDateLabel: "Expiration date",
  securityCodeLabel: "Security code",
  expirationDatePlaceholder: "MM/YY",
};

export function setInputLabels(theme, urlParams) {
  for (let [key, value] of Object.entries(defaultInputLabels)) {
    let param = urlParams.get(key);
    if (param) {
      value = param;
    } else if (key === "cardNumberLabel" && theme === "minimal") {
      value = "Card information";
    }

    // Sanitize
    value = value.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    setLabel(key, value);
    setPlaceholder(key, value);
  }
}

export function updateInputLabels(labelUpdates) {
  for (const [key, value] of Object.entries(labelUpdates)) {
    setLabel(key, value);
    setPlaceholder(key, value);
  }
}

function setPlaceholder(key, value) {
  if (key == "expirationDateLabel") {
    return;
  }
  const elementId =
    key == "expirationDatePlaceholder"
      ? "expirationdate"
      : key.slice(0, -5).toLowerCase();
  const input = document.getElementById(elementId);
  if (input) {
    input.placeholder = value;
  }
}

function setLabel(key, value) {
  let elements = document.getElementsByClassName(key);
  for (const element of elements) {
    element.innerText = value;
  }
}

const defaultErrorLabels = {
  invalidCardNumberLabel: "Your card number is invalid",
  invalidExpirationDateLabel: "Your expiration date is invalid",
  invalidSecurityCodeLabel: "Your CVC is invalid",
};

export function getErrorLabels(urlParams) {
  const errorLabels = defaultErrorLabels;

  for (const key in errorLabels) {
    let param = urlParams.get(key);
    if (param) {
      errorLabels[key] = param;
    }
  }

  return errorLabels;
}

export function updateErrorLabels(existingLabels, newLabels) {
  for (const key in existingLabels) {
    let newLabel = newLabels[key];
    if (newLabel) {
      existingLabels[key] = newLabel;
    }
  }

  return existingLabels;
}

const defaultFormOverrides = {
  disableCVV: false,
};

export function setFormOverrides(urlParams) {
  const formOverrides = defaultFormOverrides;

  for (const key in formOverrides) {
    const param = urlParams.get(key);
    if (param) {
      formOverrides[key] = param;
    }
  }

  return defaultFormOverrides;
}
