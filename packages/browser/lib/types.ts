export interface InputSettings {
  theme?: string; // The base styling for Inputs. Currently supports default, minimal and material.
  height?: string; // The height of the Evervault Inputs iframe.
  primaryColor?: string; // The main theme color.
  labelColor?: string; // The color CSS property applied to the input labels.
  inputBorderColor?: string; // The border-color CSS property applied to inputs.
  inputTextColor?: string; // The color CSS property applied to inputs.
  inputBackgroundColor?: string; // The color CSS property applied to the ::placeholder CSS pseudo-element for inputs.
  inputBorderRadius?: string; // The border-radius CSS property applied to inputs.
  inputHeight?: string; // The height CSS property applied to inputs.
  cardNumberLabel?: string; // The label for the card number input
  expirationDateLabel?: string; // The label for the expiration date input
  securityCodeLabel?: string; // The label for the security code input
  expirationDatePlaceholder?: string; // The placeholder for the expiration date input
  invalidCardNumberLabel?: string; // The message shown on an invalid card number
  invalidExpirationDateLabel?: string; // The message shown on an invalid expiration date
  invalidSecurityCodeLabel?: string; // The message shown on an invalid security code
  fontUrl?: string; // Load a custom font with the Google Fonts API
  fontFamily?: string; // Set the font-family for the fontUrl
  inputFontSize?: string; // Set the font-size property of the input attribute
  inputBoxShadow?: string; // Set the box-shadow property of the input attribute
  labelFontSize?: string; // Set the font-size property of the label attribute
  labelWeight?: string; // Set the font-weight property of the label attribute
  disableCVV?: string; // Removes the CVV field from Inputs, showing only the Card Number and Expiry fields
  disableExpiry?: string; // Removes the Expiry field from Inputs, showing only the Card Number and CVV fields
}

export interface CustomStyles {
  cardNumberText?: CSSStyleDeclaration;
  cardNumberLabel?: CSSStyleDeclaration;
  cardNumberGroup?: CSSStyleDeclaration;
  securityCodeText?: CSSStyleDeclaration;
  securityCodeLabel?: CSSStyleDeclaration;
  securityCodeGroup?: CSSStyleDeclaration;
  expirationDateText?: CSSStyleDeclaration;
  expirationDateLabel?: CSSStyleDeclaration;
  expirationDateGroup?: CSSStyleDeclaration;
  topRow?: CSSStyleDeclaration;
  bottomRow?: CSSStyleDeclaration;
  copyButton?: CSSStyleDeclaration;
}

export interface RevealSettings {
  theme?: string; // The base styling for Inputs. Currently supports default, minimal and material.
  height?: string; // The height of the Evervault Inputs iframe.
  revealFontSize?: string; // Set the font-size property of the text in Reveal.
  revealFontWeight?: string; // Set the font-weight property of the text in Reveal.
  revealTextColor?: string; // The color CSS property applied to Reveal.
  fontUrl?: string; // Load a custom font with the Google Fonts API
  fontFamily?: string; // Set the font-family for the fon
  cardNumberLabel?: string;
  expirationDateLabel?: string;
  securityCodeLabel?: string;
  labelFontSize?: string;
  labelFontWeight?: string;
  labelColor?: string;
  customStyles?: CustomStyles;
}
