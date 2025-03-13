[![Evervault](https://evervault.com/evervault.svg)](https://evervault.com/)

# Evervault React Native SDK

The [Evervault](https://evervault.com/) React Native SDK is a toolkit for encrypting data on the client. Using the Evervault React Native SDK means your customer's data never leaves their device unencrypted.

## Getting Started

Before starting with the Evervault React Native SDK, you will need to [create an account](https://app.evervault.com/register) and a team.

For full installation support, [book time here](https://calendly.com/evervault/support).

## Documentation

See the Evervault [React Native SDK documentation](https://docs.evervault.com/sdks/react-native).

## Installation

Our React Native SDK is distributed via [npm](https://www.npmjs.com/), and can be installed using your preferred package manager.

```sh
# Using npm
npm install @evervault/react-native

# Using yarn
yarn add @evervault/react-native

# Using pnpm
pnpm add @evervault/react-native
```

## Usage

Once installed, initialize the React Native SDK with your Team and App ID found in the [Evervault Dashboard](https://app.evervault.com/).

Use the `<EvervaultProvider>` component as a provider for your app.

```tsx
import { EvervaultProvider, Card, type CardPayload } from "@evervault/evervault-react-native";

function App() {
  const [data, setData] = useState<CardPayload | null>(null);

  return (
    <EvervaultProvider teamId="team_xxx" appId="app_xxx">
      <Card onChange={setData}>
        <Card.Holder />
        <Card.Number />
        <Card.Expiry />
        <Card.CVC />
      </Card>
    </EvervaultProvider>
  );
}
```

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/evervault/js.

## Feedback

Questions or feedback? [Let us know](mailto:support@evervault.com).
