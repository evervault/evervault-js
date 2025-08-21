import { ApplePayButtonProps } from './types';
import { Text } from 'react-native';
export * from './types';

export const ApplePayButton: React.FC<ApplePayButtonProps> = () => {
    return <Text>Fake</Text>;
};

/**
 * Apple pay is not available on web or on Android.
 */
export const isApplePayAvailable = () => false;


export const isApplePayDisbursementAvailable = () => false;
