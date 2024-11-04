import { TransactionDetails } from "types";

export function buildPaymentRequest(tx: TransactionDetails) {
  const paymentMethodData = [
    {
      supportedMethods: "https://apple.com/apple-pay",
      data: {
        version: 3,
        merchantIdentifier: "merchant.com.apdemo",
        merchantCapabilities: ["supports3DS"],
        supportedNetworks: ["amex", "discover", "masterCard", "visa"],
        countryCode: "US",
      },
    },
  ];
  // Define PaymentDetails
  const paymentDetails = {
    total: {
      label: "Demo (Card is not charged)",
      amount: {
        value: "27.50",
        currency: "USD",
      },
    },
  };

  const request = new PaymentRequest(paymentMethodData, paymentDetails);

  request.onmerchantvalidation = (event) => {
    console.log("Merchant Validation Event", event);
    // Call your own server to request a new merchant session.
    const merchantSessionPromise = new Promise((resolve) =>
      setTimeout(resolve, 2000)
    );
    event.complete(merchantSessionPromise);
  };

  return request;
}
