[![Evervault](https://evervault.com/evervault.svg)](https://evervault.com/)

# Evervault JavaScript SDK

The [Evervault](https://evervault.com) JavaScript SDK is a toolkit for encrypting data in the browser. Using the Evervault React.js SDK means your customer's data never leaves their browser unencrypted.

## Getting Started

Before starting with the Evervault JavaScript SDK, you will need to [create an account](https://app.evervault.com/register) and a team.

For full installation support, [book time here](https://calendly.com/evervault/cages-onboarding).

## Installation

To make Evervault available for use in your app, add this script to your page's footer:

```html
<script src="https://js.evervault.com/v1"></script>
```

## Setup

Once installed, initialize the JavaScript SDK with your team's unique ID found in the [Settings](https://app.evervault.com/settings).

```js
const evervault = new Evervault("<TEAM_ID>");
```

## Reference

The Evervault JavaScript SDK exposes two functions.

### evervault.encrypt()

`evervault.encrypt()` encrypts data for use in your [Cages](https://docs.evervault.com/tutorial). To encrypt data in the browser, simply pass an object or string into the `evervault.encrypt()` function. Store the encrypted data in your database as normal.

```javascript
async evervault.encrypt(data: Object | Array | String | Number);
```

| Parameter | Type                                    | Description           |
| --------- | --------------------------------------- | --------------------- |
| data      | `Object`, `Array`, `String` or `Number` | Data to be encrypted. |

### evervault.inputs()

**Note: Self-Serve customers can only use Inputs in [debug mode](https://docs.evervault.com/concepts/inputs/debug-mode), which is not safe for production use.**

`evervault.inputs()` initialises Evervault Inputs which make it easy to collect encrypted cardholder data in a completely PCI-compliant environment.

Evervault Inputs are served within an iFrame retrieved directly from Evervault’s PCI-compliant infrastructure, which can reduce your PCI DSS compliance scope to the simplest form (SAQ-A) once integrated correctly.

Simply pass the id of the element in which the iFrame should be embedded.

We also support [themes](https://docs.evervault.com/concepts/inputs/overview#customising-inputs) so you can customise how Inputs looks in your UI.

```javascript
evervault.inputs(id: String, theme: String);
```

| Parameter | Type   | Description                                                               |
| --------- | ------ | ------------------------------------------------------------------------- |
| id        | string | Id of the element in which the Evervault Inputs iFrame should be embedded |
| theme     | string | Optional theme for styling Inputs, currently supported: Minimal           |

```html
<body>
  <form id="ev-payment-form">
    <div id="ev-card-fields">
      <!-- Evervault will create input elements here -->
    </div>
  </form>
</body>
<script src="https://js.evervault.com/v1"></script>
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

#### `getData` method

This option is best when you are looking to retrieve card data occasionally, like when your form is submitted.

```javascript
const cardData = await inputs.getData();
```

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/evervault/evervault-js.

## Feedback

Questions or feedback? [Let us know](mailto:support@evervault.com).
