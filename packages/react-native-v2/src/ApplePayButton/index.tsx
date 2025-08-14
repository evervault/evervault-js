import { ApplePayButtonProps } from './types';

export * from './types';
export const ApplePayButton: React.FC<ApplePayButtonProps> = () => null;

/**
 * Apple pay is not available on web or on Android.
 */
export const isApplePayAvailable = () => false;
