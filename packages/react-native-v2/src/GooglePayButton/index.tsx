import { GooglePayButtonProps } from "./types";

export const GooglePayButton: React.FC<GooglePayButtonProps> = null;

// Google pay is not available on web or on iOS.
export const isGooglePayAvailable = () => false;
