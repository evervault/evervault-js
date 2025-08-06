# iOS EvervaultPay SDK Integration

This document describes the iOS integration of the EvervaultPay SDK into the React Native SDK.

## Overview

The iOS integration provides a native wrapper around the EvervaultPay iOS SDK, allowing React Native applications to use Apple Pay functionality with Evervault's encryption services.

## Architecture

### Native Components

1. **EvervaultPaymentViewWrapper.swift** - Main wrapper class that bridges React Native props to the native EvervaultPaymentView
2. **EvervaultPaymentViewManager.swift** - View manager that handles React Native view creation and prop updates
3. **EvervaultPaymentViewManager.mm** - Objective-C bridge that exports the view manager to React Native

### Key Features

- **Apple Pay Integration**: Full integration with Apple Pay using the native EvervaultPaymentView
- **Event Handling**: Delegate pattern for payment authorization, completion, and transaction preparation
- **Configuration**: Support for custom button types, themes, and card networks
- **Transaction Management**: Support for one-off payments with line items

## Usage

### Basic Implementation

```tsx
import React from 'react';
import { EvervaultPaymentView } from '@evervault/react-native-v2';

const PaymentScreen = () => {
  const config = {
    appId: 'your-evervault-app-id',
    merchantId: 'your-apple-merchant-id'
  };

  const transaction = {
    total: '29.99',
    currency: 'USD',
    country: 'US',
    lineItems: [
      {
        label: 'Premium Subscription',
        amount: '29.99'
      }
    ]
  };

  const handleDidAuthorizePayment = (data) => {
    console.log('Payment authorized:', data);
    // Handle the encrypted payment token
  };

  const handleDidFinishWithResult = (data) => {
    if (data.success) {
      console.log('Payment completed successfully');
    } else {
      console.log('Payment failed:', data.error);
    }
  };

  return (
    <EvervaultPaymentView
      config={config}
      transaction={transaction}
      buttonType="buy"
      buttonTheme="automatic"
      onDidAuthorizePayment={handleDidAuthorizePayment}
      onDidFinishWithResult={handleDidFinishWithResult}
    />
  );
};
```

### Configuration Options

#### Config
- `appId`: Your Evervault application ID
- `merchantId`: Your Apple Merchant ID

#### Transaction
- `total`: Total amount as a string (e.g., "29.99")
- `currency`: ISO currency code (e.g., "USD")
- `country`: ISO country code (e.g., "US")
- `lineItems`: Array of line items (optional)

#### Button Customization
- `buttonType`: "plain" | "book" | "buy" | "checkout" | "order" | "subscribe" | "pay"
- `buttonTheme`: "light" | "dark" | "automatic"
- `borderRadius`: Number for corner radius
- `allowedCardNetworks`: Array of supported networks ("VISA", "MASTERCARD", "AMEX", "DISCOVER", "JCB")

### Event Handlers

#### onDidAuthorizePayment
Called when Apple Pay authorizes the payment. Returns encrypted payment data:

```tsx
{
  networkToken: {
    number: string;
    expiry: { month: string; year: string };
    rawExpiry: string;
    tokenServiceProvider: string;
  };
  card: {
    brand?: string;
    funding?: string;
    segment?: string;
    country?: string;
    currency?: string;
    issuer?: string;
  };
  cryptogram: string;
  eci?: string;
  paymentDataType: string;
  deviceManufacturerIdentifier: string;
}
```

#### onDidFinishWithResult
Called when the payment flow completes:

```tsx
{
  success: boolean;
  error?: string;
}
```

#### onPrepareTransaction
Called before the payment sheet is displayed, allowing transaction modification.

## Setup Requirements

### iOS Requirements
- iOS 11.0 or later
- Apple Pay capability enabled in your app
- Valid Apple Merchant ID
- EvervaultPay SDK dependency (already included in podspec)

### Podspec Configuration
The integration automatically includes the necessary dependencies:

```ruby
s.dependency "EvervaultPayment"
```

### Apple Pay Setup
1. Enable Apple Pay capability in your Xcode project
2. Configure your Apple Merchant ID
3. Add the required entitlements

## Differences from Android

### Transaction Structure
- iOS uses `total` instead of `amount`
- Line items use `amount` as string instead of number
- No `merchantId` in transaction (moved to config)

### Button Themes
- iOS: "light" | "dark" | "automatic"
- Android: "light" | "dark"

### Event Handling
- iOS uses delegate pattern with specific event names
- Android uses callback pattern with generic success/error events

## Testing

### Unit Tests
Run the test suite to verify the integration:

```bash
npm test
```

### Manual Testing
1. Use a physical iOS device (Apple Pay doesn't work in simulator)
2. Ensure Apple Pay is set up on the device
3. Test with valid Evervault app ID and merchant ID

## Troubleshooting

### Common Issues

1. **Apple Pay not available**: Ensure Apple Pay is enabled on the device and in your app
2. **Merchant ID errors**: Verify your Apple Merchant ID is correct and properly configured
3. **Transaction errors**: Check that all required transaction fields are provided
4. **Build errors**: Ensure the EvervaultPayment pod is properly installed

### Debug Logging
The integration includes debug logging for key events. Check the console for:
- Transaction parsing errors
- Payment authorization events
- Completion events

## Future Enhancements

- Support for recurring payments
- Support for disbursements (iOS 17+)
- Enhanced error handling
- Additional customization options 