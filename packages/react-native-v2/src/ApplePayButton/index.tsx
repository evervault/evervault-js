import { Platform } from 'react-native';
import { ApplePayButtonProps } from './types';

console.log('Platform', Platform.OS);
let ApplePayButton: React.FC<ApplePayButtonProps>;
if (Platform.OS === 'ios') {
    ApplePayButton = require('./ios').ApplePayButton
} else {
    ApplePayButton = require('./default').ApplePayButton
}

export * from './types';
export { ApplePayButton };
