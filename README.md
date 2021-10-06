[![Evervault](https://evervault.com/evervault.svg)](https://evervault.com/)

# Evervault JavaScript SDK

The [Evervault](https://evervault.com) JavaScript SDK is a toolkit for encrypting data in the browser. Using the Evervault React.js SDK means your customer's data never leaves their browser unencrypted.

## Getting Started

Before starting with the Evervault JavaScript SDK, you will need to [create an account](https://app.evervault.com/register) and a team.

For full installation support, [book time here](https://calendly.com/evervault/cages-onboarding).

## Documentation

See the Evervault [JavaScript SDK documentation](https://docs.evervault.com/javascript).

## Installation

To make Evervault available for use in your app, add this script to your page's footer:

```html
<script src="https://js.evervault.com/v1"></script>
```
## Setup

Once installed, initialize the JavaScript SDK with your team's unique ID found in the [Settings](https://app.evervault.com/settings).

```js
const evervault = new Evervault('<TEAM_ID>');
```


## Reference

The Evervault JavaScript SDK exposes one function.

### evervault.encrypt()

`evervault.encrypt()` encrypts data for use in your [Cages](https://docs.evervault.com/tutorial). To encrypt data in the browser, simply pass an object or string into the `evervault.encrypt()` function. Store the encrypted data in your database as normal.

```javascript
async evervault.encrypt(data: Object | String);
```

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| data | Object or String | Data to be encrypted. |

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/evervault/evervault-js.

## Feedback

Questions or feedback? [Let us know](mailto:support@evervault.com).
