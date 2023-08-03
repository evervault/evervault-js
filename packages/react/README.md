[![Evervault](https://evervault.com/evervault.svg)](https://evervault.com/)

# Evervault React.js SDK

The [Evervault](https://evervault.com) React.js SDK is a toolkit for encrypting data on the client. Using the Evervault React.js SDK means your customer's data never leaves their device unencrypted.

## Getting Started

Before starting with the Evervault React SDK, you will need to [create an account](https://app.evervault.com/register) and a team.

For full installation support, [book time here](https://calendly.com/evervault/support).

## Documentation

See the Evervault [React.js SDK documentation](https://docs.evervault.com/sdks/react-sdk).

## Installation

Our React.js SDK is distributed via [npm](https://www.npmjs.com/), and can be installed using your preferred package manager.

```bash
# Using npm
npm install @evervault/react

# Using yarn
yarn add @evervault/react
```

## Initialize SDK

Once installed, initialize the React.js SDK with your Team and App ID found in the [Evervault Dashboard](https://app.evervault.com).

Use the `<EvervaultProvider>` component as a provider for your app.

```jsx
import { EvervaultProvider } from "@evervault/react";
import ChildComponent from "../ChildComponent";
export default function App() {
  return (
    <EvervaultProvider teamId={"<TEAM_ID>"} appId={"<APP_ID>"}>
      <ChildComponent />
    </EvervaultProvider>
  );
}
```

## Encrypt a string

Once you've added the `<EvervaultProvider>`, you can access the `useEvervault()` hook in its children. The `useEvervault()` hook returns an initialized instance of the [JavaScript SDK](https://docs.evervault.com/sdks/javascript-sdk), which includes the `encrypt()` function. The `encrypt()` function can can be used to encrypt plaintext data in your application.

```jsx
import { useState } from "react";
import { useEvervault } from "@evervault/react";

export default function ChildComponent() {
  const evervault = useEvervault();
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const encryptedMessage = await evervault.encrypt(message);
    alert(encryptedMessage);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button>Submit</button>
    </form>
  );
}
```

---

# Reference

## `<EvervaultProvider />`

The `EvervaultProvider` component exposes the `useEvervault()` hook to any nested components.

```jsx
<EvervaultProvider teamId={String} appId={String} />
```

### Props

| Parameter | Type   | Description                                                       |
| --------- | ------ | ----------------------------------------------------------------- |
| `teamId`  | String | The unique identifier for your Team. It's found in Team Settings. |
| `appId`   | String | The unique identifier for your App. It's found in App Settings.   |

---

## `useEvervault()`

The `useEvervault` hook is accessible in children of the `EvervaultProvider`, and returns an initialized instance of the Evervault [JavaScript SDK](https://docs.evervault.com/sdks/javascript-sdk). One of the functions included in the returned object is `encrypt()`, which can be passed any plaintext data structure.

```jsx
const evervault = useEvervault();
```

---

### `evervault.encrypt(data)`

Encrypts data using [Evervault Encryption](/security/evervault-encryption). Evervault Strings can be used across all of our products. It is accessible on the returned value from the `useEvervault()` hook. To encrypt data using the React.js SDK, simply pass a `String` or an `Object` into the `evervault.encrypt()` function.

The encrypted data can be passed to your server and stored in your database as normal. It can also be used with any of Evervault’s other services.

```jsx
const evervault = useEvervault();

const encrypted = await evervault.encrypt("Hello, world!");
```

| Parameter | Type             | Description          |
| --------- | ---------------- | -------------------- |
| `data`    | String \| Object | The data to encrypt. |

---

## `<EvervaultInput />`

The `<EvervaultInput />` component makes it easy to use [Evervault Inputs](/products/inputs) in your React application. Inputs make it easy to collect encrypted cardholder data in a completely PCI-compliant environment.

Evervault Inputs are served within an iFrame retrieved directly from Evervault’s PCI-compliant infrastructure, which can reduce your PCI DSS compliance scope to the simplest form (SAQ A).

Simply include the component in your JSX to get started.

The component also supports [themes](/products/inputs/#themes) and custom styles so you can customise how Inputs looks in your UI.

### Props

| Parameter                           | Type             | Description                                                                                     |
| ----------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- |
| `onChange`                          | Function         | A function that is called whenever the submission changes.                                      |
| `onInputsLoad`                      | Function         | A function that is called when the iFrame that serves Inputs has loaded.                        |
| `config`                            | String \| Object | A theme string (supported: default, minimal or material), or a config object for custom styles. |
| `config.theme`                      | String           | The base styling for Inputs. Currently supports default, minimal and material.                  |
| `config.height`                     | String           | The height of the Evervault Inputs iframe.                                                      |
| `config.primaryColor`               | String           | The main theme color.                                                                           |
| `config.labelColor`                 | String           | The color CSS property applied to the input labels.                                             |
| `config.inputBorderColor`           | String           | The border-color CSS property applied to inputs.                                                |
| `config.inputTextColor`             | String           | The color CSS property applied to inputs.                                                       |
| `config.inputBackgroundColor`       | String           | The color CSS property applied to the ::placeholder CSS pseudo-element for inputs.              |
| `config.inputBorderRadius`          | String           | The border-radius CSS property applied to inputs.                                               |
| `config.inputHeight`                | String           | The height CSS property applied to inputs.                                                      |
| `config.cardNumberLabel`            | String           | The label for the card number input                                                             |
| `config.expirationDateLabel`        | String           | The label for the expiration date input                                                         |
| `config.securityCodeLabel`          | String           | The label for the security code input                                                           |
| `config.expirationDatePlaceholder`  | String           | The placeholder for the expiration date input                                                   |
| `config.invalidCardNumberLabel`     | String           | The message shown on an invalid card number                                                     |
| `config.invalidExpirationDateLabel` | String           | The message shown on an invalid expiration date                                                 |
| `config.invalidSecurityCodeLabel`   | String           | The message shown on an invalid security code                                                   |
| `config.fontUrl`                    | String           | Load a custom font with the Google Fonts API                                                    |
| `config.fontFamily`                 | String           | Set the font-family for the fontUrl                                                             |
| `config.inputFontSize`              | String           | Set the font-size property of the input attribute                                               |
| `config.inputBoxShadow`             | String           | Set the box-shadow property of the input attribute                                              |
| `config.labelFontSize`              | String           | Set the font-size property of the label attribute                                               |
| `config.labelWeight`                | String           | Set the font-weight property of the label attribute                                             |
| `config.disableCVV`                 | Boolean          | Removes the CVV field from Inputs, showing only the Card Number and Expiry fields               |

### Retrieving card data

There are two ways of accessing encrypted card data once it has been entered.

In each case, a `cardData` object containing details about the card data your user has entered is returned.

You can see the format of this object below:

```json
{
  "card": {
    "type": "visa_credit",
    "number": "ev:encrypted:abc123",
    "cvc": "ev:encrypted:def456",
    "expMonth": "01",
    "expYear": "23"
  },
  "isValid": true,
  "isPotentiallyValid": true,
  "isEmpty": false,
  "error": {
    "type": "invalid_pan",
    "message": "The credit card number you entered was invalid"
  }
}
```

#### onChange()

The callback function is run every time your user updates the card data.

```javascript
<EvervaultProvider teamId={"<TEAM_ID>"} appId={"<APP_ID>"}>
  <div className="App">
    <EvervaultInput onChange={(encryptedCard) => setEncryptedCard(encryptedCard)} />
  </div>
</EvervaultProvider>
```

### Localization

The iFrame can be localized on initialization by providing a set of labels in the [config](#inputs-params-config).

```javascript
const config = {
  cardNumberLabel: 'Numéro de carte:',
  expirationDateLabel: 'Date d'expiration:',
  securityCodeLabel: 'Code de sécurité:'
}

<EvervaultProvider teamId={'<TEAM_ID>'} appId={'<APP_ID>'}>
  <div className="App">
    <EvervaultInput onChange={(encryptedCard) => setEncryptedCard(encryptedCard)} config={config} />
  </div>
</EvervaultProvider>
```

### Custom Fonts

A custom font can be loaded from Google's [Fonts API](https://fonts.google.com) and the `font-family` set with the `fontFamily` config paramerter

```javascript
const config = {
  fontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@100;800&display=swap',
  fontFamily: 'Poppins, sans-serif',
  inputFontSize: '20px',
  inputBoxShadow: '2px 2px 2px 1px rgba(0, 0, 255, .2)',
  labelFontSize: '13px',
  labelWeight: '400'
}

<EvervaultProvider teamId={'<TEAM_ID>'} appId={'<APP_ID>'}>
  <div className="App">
    <EvervaultInput onChange={(encryptedCard) => setEncryptedCard(encryptedCard)} config={config} />
  </div>
</EvervaultProvider>
```

### iFrame loading status

If you need to wait for the iFrame that serves Inputs to load before doing some action, you can used the `onInputsLoad` prop callback:

```javascript
<EvervaultProvider teamId={"<TEAM_ID>"} appId={"<APP_ID>"}>
  <div className="App">
    <EvervaultInput
      onInputsLoad={() => {
        console.log("Inputs has loaded!");
      }}
    />
  </div>
</EvervaultProvider>
```

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/evervault/evervault-react.

## Feedback

Questions or feedback? [Let us know](mailto:support@evervault.com).
