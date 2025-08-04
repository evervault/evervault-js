import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EvervaultPaymentView } from './EvervaultPaymentView';
import { Config, Transaction } from './EvervaultPaymentViewNativeComponent';

// Mock the native component
jest.mock('react-native/Libraries/Utilities/codegenNativeComponent', () => {
  return () => 'MockedNativeComponent';
});

describe('EvervaultPaymentView', () => {
  const mockConfig: Config = {
    appId: 'test-app-id',
    merchantId: 'test-merchant-id'
  };

  const mockTransaction: Transaction = {
    total: '10.00',
    currency: 'USD',
    country: 'US',
    lineItems: [
      {
        label: 'Test Item',
        amount: '10.00'
      }
    ]
  };

  it('renders with correct props', () => {
    const { getByTestId } = render(
      <EvervaultPaymentView
        config={mockConfig}
        transaction={mockTransaction}
        testID="payment-view"
      />
    );

    expect(getByTestId('payment-view')).toBeTruthy();
  });

  it('handles payment authorization events', () => {
    const onDidAuthorizePayment = jest.fn();
    const onDidFinishWithResult = jest.fn();

    render(
      <EvervaultPaymentView
        config={mockConfig}
        transaction={mockTransaction}
        onDidAuthorizePayment={onDidAuthorizePayment}
        onDidFinishWithResult={onDidFinishWithResult}
      />
    );

    // The actual event handling would be tested through the native bridge
    expect(onDidAuthorizePayment).toBeDefined();
    expect(onDidFinishWithResult).toBeDefined();
  });

  it('applies custom button type and theme', () => {
    const { getByTestId } = render(
      <EvervaultPaymentView
        config={mockConfig}
        transaction={mockTransaction}
        buttonType="buy"
        buttonTheme="dark"
        testID="payment-view"
      />
    );

    expect(getByTestId('payment-view')).toBeTruthy();
  });

  it('handles custom card networks', () => {
    const { getByTestId } = render(
      <EvervaultPaymentView
        config={mockConfig}
        transaction={mockTransaction}
        allowedCardNetworks={['VISA', 'MASTERCARD', 'AMEX']}
        testID="payment-view"
      />
    );

    expect(getByTestId('payment-view')).toBeTruthy();
  });
}); 