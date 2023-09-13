type CustomRevealStyles = { [key: string]: CSSStyleDeclaration };

const supportedProperties = [
  {
    name: "primaryColor",
    variable: "--color-primary",
  },
  {
    name: "errorColor",
    variable: "--color-danger",
  },
  {
    name: "labelColor",
    variable: "--label-color",
  },
  {
    name: "inputBorderColor",
    variable: "--input-border-color",
  },
  {
    name: "inputTextColor",
    variable: "--input-color",
  },
  {
    name: "inputBackgroundColor",
    variable: "--input-background",
  },
  {
    name: "inputPlaceholderColor",
    variable: "--input-placeholder",
  },
  {
    name: "inputBorderRadius",
    variable: "--input-radius",
  },
  {
    name: "inputHeight",
    variable: "--input-height",
  },
  {
    name: "inputFontSize",
    variable: "--input-font-size",
  },
  {
    name: "inputBoxShadow",
    variable: "--input-shadow",
  },
  {
    name: "labelWeight",
    variable: "--label-weight",
  },
  {
    name: "labelFontSize",
    variable: "--label-font-size",
  },
  {
    name: "fontFamily",
    variable: "--ff",
  },
  {
    name: "revealFontSize",
    variable: "--reveal-font-size",
  },
  {
    name: "revealFontWeight",
    variable: "--reveal-font-weight",
  },
  {
    name: "revealTextColor",
    variable: "--reveal-color",
  },
];

export function urlStyles(urlParams: URLSearchParams) {
  let root = document.documentElement;
  supportedProperties.forEach(({ name, variable }) => {
    const paramValue = urlParams.get(name);
    if (paramValue) {
      root.style.setProperty(variable, paramValue);
    }
  });
}

export function customStyles(styles: CustomRevealStyles) {
  if (!styles) {
    return;
  }

  Object.entries(styles).forEach(([name, value]) => {
    const id = getHtmlIdForRevealStyleProperty(name);
    if (id) {
      const element = document.getElementById(id);
      if (element) {
        for (const [styleName, styleValue] of Object.entries(value)) {
          if (Object.hasOwn(element.style, styleName)) {
            element.style.setProperty(styleName, styleValue);
          }
        }
      }
    }
  });
}

function getHtmlIdForRevealStyleProperty(propertyName: string) {
  switch (propertyName) {
    case "cardNumberText":
      return "cardnumber";
    case "cardNumberLabel":
      return "cardnumber-label";
    case "cardNumberGroup":
      return "cardnumbergroup";
    case "securityCodeText":
      return "securitycodelabelgroup";
    case "securityCodeLabel":
      return "securitycode-label";
    case "securityCodeGroup":
      return "securitycode";
    case "expirationDateText":
      return "expirationdate";
    case "expirationDateLabel":
      return "expirationdate-label";
    case "expirationDateGroup":
      return "expirationdategroup";
    case "topRow":
      return "toprow";
    case "bottomRow":
      return "bottomrow";
    case "copyButton":
      return "copybutton";
    default:
      return undefined;
  }
}
