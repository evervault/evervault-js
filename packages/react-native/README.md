# react-native-evervault-sdk


## Installation

```sh
npm install @evervault/evervault-react-native
```
or
```sh
yarn add @evervault/evervault-react-native
```

## Usage
```typescript
// .tsx
import { init } from '@evervault/evervault-react-native';


export default function Component() {
  const [cardData, setCardData] = useState<CardPayload | null>(null);

  useEffect(() => {
    async function initEvervault() {
      try {
        await init(
          process.env.EV_TEAM_UUID as string,
          process.env.EV_APP_UUID as string
        );
      } catch (error) {
        console.error(error);
      }
    }
    initEvervault();
  }, []);

  return (
    <Card onChange={setCardData} onComplete={() => console.log("Form Complete!")} style={{ gap: 24 }}>
      <Card.Number placeholder="4242 4242 4242 4242" style={{ padding: 24 }}/>
      <Card.CVC placeholder="123" />
      <Card.Holder placeholder="Mark Doyle" />
    </Card>
  );
}
```

## Reference
### `init(teamUuid, appUuid)`

Initialize the Evervault SDK, this must be called before `encrypt` to set your Apps keys on the device.

### Options

| Type     | Type   | Required |
| -------- | ------ | -------- |
| teamUuid | string | yes      |
| appUuid  | string | yes      |

### Returns

`Promise<void>`

### `encrypt(data)`
Encrypts data using [Evervault Encryption](https://docs.evervault.com/security/evervault-encryption).

To encrypt strings using the React Native SDK, simply pass a String or an Object into the `encrypt()` function.

### Options

| Type | Type                          | Required |
| ---- | ----------------------------- | -------- |
| data | String, Number, Object, Array | yes      |

### Returns

`Promise<string>`
