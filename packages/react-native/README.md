# react-native-evervault-sdk

Evervault react native sdk

## Installation

```sh
npm install @evervault/evervault-react-native
```
or 
```sh
yarn add @evervault/evervault-react-native
```
## Setup iOS + React Native v0.60
```
cd ios
pod install
cd ..
```

## Usage
```typescript
// .tsx
import { init, encrypt } from '@evervault/evervault-react-native';

export default function Component() {
  const [encObject, setEncObject] = React.useState<string | undefined>();
  const testEncObject = { key: 'value', boolKey: true, number: 123};

  React.useEffect(() => {
    async function initEvervault() {
      try {
        await init('TEAM_UUID', 'APP_UUID');
      } catch (error) {
        console.error(error);
      }
    }
    initEvervault();
    encrypt(testEncObject).then(setEncObject);
  }, []);
}
```

## Reference
### `init(teamUuid, appUuid)`

Initialize the Evervault SDK, this must be called before `encrypt` to set your Apps keys on the device.

### Options

| Type    | Type        | Required |
| ------- | --------    | -------- |
| teamUuid| string |yes        |
| appUuid| string |yes        |

### Returns

`Promise<void>`

### `encrypt(data)`
Encrypts data using [Evervault Encryption](https://docs.evervault.com/security/evervault-encryption). 

To encrypt strings using the React Native SDK, simply pass a String or an Object into the `encrypt()` function.

### Options

| Type    | Type        | Required |
| ------- | --------    | -------- |
| data| String, Number, Object, Array |yes        |

### Returns

`Promise<string>`