[![Evervault](https://evervault.com/evervault.svg)](https://evervault.com/)

# Evervault JavaScript SDK

The [Evervault](https://evervault.com) JavaScript SDK is a toolkit for encrypting data in the browser. Using the Evervault JavaScript SDK means your customer's data never leaves their browser unencrypted.

## Getting Started

Before starting with the Evervault JavaScript SDK, you will need to [create an account](https://app.evervault.com/register), a team and an app.

## Installation

To make Evervault available for use in your app, add this script to your page's footer:

```html
<script src="https://js.evervault.com/v2"></script>
```

## Setup

Once installed, initialize the JavaScript SDK with your team's unique ID found in the [Settings](https://app.evervault.com/settings).

```js
const evervault = new Evervault("<TEAM_ID>", "<APP_ID>");
```

## Reference

The Evervault JavaScript SDK exposes two functions.

### evervault.encrypt()

`evervault.encrypt()` encrypts data for use in your [Functions](https://docs.evervault.com/products/functions) and [Cages](https://docs.evervault.com/products/cages). To encrypt data in the browser, simply pass an object or string into the `evervault.encrypt()` function. Store the encrypted data in your database as normal.

```javascript
async evervault.encrypt(data: Object | Array | String | Number | File | Blob);
```

| Parameter | Type                                                    | Description           |
| --------- | ------------------------------------------------------- | --------------------- |
| data      | `Object`, `Array`, `String`, `Number`, `File` or `Blob` | Data to be encrypted. |

### evervault.inputs()

**Note: Self-Serve customers can only use Inputs in [debug mode](https://docs.evervault.com/concepts/inputs/debug-mode), which is not safe for production use.**

`evervault.inputs()` initialises Evervault Inputs which make it easy to collect encrypted cardholder data in a completely PCI-compliant environment.

Evervault Inputs are served within an iFrame retrieved directly from Evervault’s PCI-compliant infrastructure, which can reduce your PCI DSS compliance scope to the simplest form (SAQ-A) once integrated correctly.

Simply pass the id of the element in which the iFrame should be embedded.

We also support [themes](https://docs.evervault.com/concepts/inputs/overview#customising-inputs) so you can customise how Inputs looks in your UI.

```javascript
evervault.inputs(id: String, settings: Object);
```

| Parameter | Type   | Description                                                               |
| --------- | ------ | ------------------------------------------------------------------------- |
| id        | String | Id of the element in which the Evervault Inputs iFrame should be embedded |
| config    | Object | A config object for custom styling.                                       |

#### config

| Parameter                  | Type    | Description                                                                        |
| -------------------------- | ------- | ---------------------------------------------------------------------------------- |
| theme                      | String  | The base styling for Inputs. Currently supports default, minimal and material.     |
| height                     | String  | The height of the Evervault Inputs iframe.                                         |
| primaryColor               | String  | The main theme color.                                                              |
| labelColor                 | String  | The color CSS property applied to the input labels.                                |
| inputBorderColor           | String  | The border-color CSS property applied to inputs.                                   |
| inputTextColor             | String  | The color CSS property applied to inputs.                                          |
| inputBackgroundColor       | String  | The color CSS property applied to the ::placeholder CSS pseudo-element for inputs. |
| inputBorderRadius          | String  | The border-radius CSS property applied to inputs.                                  |
| inputHeight                | String  | The height CSS property applied to inputs.                                         |
| cardNumberLabel            | String  | The label for the card number input                                                |
| expirationDateLabel        | String  | The label for the expiration date input                                            |
| securityCodeLabel          | String  | The label for the security code input                                              |
| expirationDatePlaceholder  | String  | The placeholder shown for the expiration date input                                |
| invalidCardNumberLabel     | String  | The message shown on an invalid card number                                        |
| invalidExpirationDateLabel | String  | The message shown on an invalid expiration date                                    |
| invalidSecurityCodeLabel   | String  | The message shown on an invalid security code                                      |
| fontUrl                    | String  | Load a custom font with the Google Fonts API                                       |
| fontFamily                 | String  | Set the font-family for the fontUrl                                                |
| inputFontSize              | String  | Set the font-size property of the input attribute                                  |
| inputBoxShadow             | String  | Set the box-shadow property of the input attribute                                 |
| labelFontSize              | String  | Set the font-size property of the label attribute                                  |
| labelWeight                | String  | Set the font-weight property of the label attribute                                |
| disableCVV                 | Boolean | If true the CVV field will not be displayed                                        |
| disableExpiry              | Boolean | If true the Expiry field will not be displayed                                     |

```html
<body>
  <form id="ev-payment-form">
    <div id="ev-card-fields">
      <!-- Evervault will create input elements here -->
    </div>
  </form>
</body>
<script src="https://js.evervault.com/v2"></script>
<script>
  const inputs = evervault.inputs("ev-card-fields");
</script>
```

#### Retrieving card data

There are two ways of accessing encrypted card data once it has been entered.
In each case, a `cardData` object containing details about the card data your user has entered is returned.

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

##### `onChange` hook

This option is best when you are looking to handle the card values in realtime, like displaying validation errors as a user is inputting their card data. The callback for the hook is run every time your user updates the card data.

```javascript
const hook = inputs.on("change", async (cardData) => {});
```

##### `getData` method

This option is best when you are looking to retrieve card data occasionally, like when your form is submitted.

```javascript
const cardData = await inputs.getData();
```

#### Localization

The iFrame can be localized on initialization by providing a set of labels in the [config](#config). The labels can then be updated as required using the `setLabels` method.

```javascript
await inputs.setLabels({});
```

| Parameter                  | Type   | Description                                         |
| -------------------------- | ------ | --------------------------------------------------- |
| cardNumberLabel            | String | The label for the card number input                 |
| expirationDateLabel        | String | The label for the expiration date input             |
| securityCodeLabel          | String | The label for the security code input               |
| expirationDatePlaceholder  | String | The placeholder shown for the expiration date input |
| invalidCardNumberLabel     | String | The message shown on an invalid card number         |
| invalidExpirationDateLabel | String | The message shown on an invalid expiration date     |
| invalidSecurityCodeLabel   | String | The message shown on an invalid security code       |

### iFrame loading status

If you need to wait for the iFrame that serves inputs to load before doing some action, there is an easy way to do so.

#### isInputsLoaded

This is a `Promise` that resolves when the iFrame is loaded. You can listen for the iFrame load event by `await`ing this `Promise`, or using `then`:

```javascript
const evervault = new Evervault("<TEAM_ID>", "<APP_ID>");
const inputs = evervault.inputs("ev-card-fields");

await inputs.isInputsLoaded;

handleInputsLoaded();

// or

inputs.isInputsLoaded.then(() => {
  handleInputsLoaded();
});
```

### evervault.reveal()

Use [evervault.reveal](https://docs.evervault.com/products/inputs#reveal) to show encrypted card
details to show your users their encrypted card details in plaintext in a secure iFrame hosted by
Evervault. Before using Reveal you'll first have to create a Relay to decrypt the card details;
Reveal expects to receive the card data from the Relay as a JSON object with the schema below.

Note: It is important that the endpoint that you create sets the applicable CORS headers so that it
can be accessed from the Inputs iFrame. Otherwise your requests will fail!

```json
{
  "cardNumber": "string | number",
  "cvv": "string | number",
  "expiry": "string | number"
}
```

Once you have your endpoint that returns the encrypted card data, you'll need to create an
[Evervault Inbound Relay](https://docs.evervault.com/products/inbound-relay) that will decrypt the
encrypted card data as is passes through it, before it gets to the iFrame. Once you have created
your Relay you can add the component to your React app.

```html
<div id="reveal"></div>

<script>
  let request = new Request("https://example-com.relay.evervault.com/card-details", {
    method: "GET",
    headers: {
      Authorization: "Bearer ey...",
    },
  });

  let config = {
    revealFontSize: "20px",
    revealFontWeight: 200,
    revealTextColor: "#d1dce6",
  };

  evervault.reveal("reveal", request, config, () => alert("Copied from Clipboard!"));
</script>

For customising the style of the iframe and to set labels on the fields, Evervault Reveal can take an optional config
object. For a full list of all the options and to see some examples, please read [our styling
docs](https://docs.evervault.com/products/inputs#styling).
```

| Parameter | Type                                                                | Required | Description                                                                           |
| --------- | ------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------- |
| id        | String                                                              | yes      | Id of the element in which the Evervault Reveal iFrame should be embedded             |
| request   | [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) | yes      | The request that the iFrame will make to get the Card Details                         |
| config    | Object                                                              | no       | A config object for custom styling.                                                   |
| onCopy    | Function                                                            | no       | A callback Function that is called when the user clicks the Copy button in the iFrame |

#### isRevealLoaded

This is a `Promise` that resolves when the iFrame is loaded. You can listen for the iFrame load event by `await`ing this `Promise`, or using `then`, if the Reveal iFrame errors then it the promise will reject, you can handle this with a `catch`:

```javascript
let request = new Request("https://example-com.relay.evervault.com/card-details", {
  method: "GET",
  headers: {
    Authorization: "Bearer ey...",
  },
});

const reveal = evervault.reveal("reveal", request);

reveal.isRevealLoaded.then(() => {
  handleRevealLoaded();
}).catch((e) => {
  handleRevealError(e);
});

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/evervault/evervault-js.

## Feedback

Questions or feedback? [Let us know](mailto:support@evervault.com).
```
