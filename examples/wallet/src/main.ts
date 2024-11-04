import "./style.css";

const evervault = new window.Evervault(
  import.meta.env.VITE_EV_TEAM_UUID,
  import.meta.env.VITE_EV_APP_UUID,
  {
    urls: {
      keysUrl: import.meta.env.VITE_KEYS_URL as string,
      apiUrl: import.meta.env.VITE_API_URL as string,
      componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL as string,
    },
  }
);

const transaction = evervault.transactions.create({
  amount: 1000,
  currency: "USD",
  country: "US",
  merchant: {
    id: "12345678901234567890",
    name: "Test Merchant",
  },
});

const google = evervault.ui.googlePay(transaction, {
  process: async (data) => {
    console.log("process called", data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  },
});

google.mount("#container");

const apple = evervault.ui.applePay(transaction, {
  process: async (data) => {
    console.log("apple pay process called", data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  },
});

apple.mount("#container");

// function mountGooglePay() {
//   const tokenizationSpecification = {
//     type: "PAYMENT_GATEWAY",
//     parameters: {
//       gateway: "example",
//       gatewayMerchantId: "exampleGatewayMerchantId",
//     },
//   };
//
//   const allowedCardNetworks = [
//     "AMEX",
//     "DISCOVER",
//     "INTERAC",
//     "JCB",
//     "MASTERCARD",
//     "VISA",
//   ];
//
//   const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];
//
//   const baseCardPaymentMethod = {
//     type: "CARD",
//     parameters: {
//       allowedAuthMethods: allowedCardAuthMethods,
//       allowedCardNetworks: allowedCardNetworks,
//     },
//     tokenizationSpecification,
//   };
//
//   const baseRequest = {
//     apiVersion: 2,
//     apiVersionMinor: 0,
//     allowedPaymentMethods: [baseCardPaymentMethod],
//     transactionInfo: {
//       totalPriceStatus: "FINAL",
//       totalPriceLabel: "Total",
//       totalPrice: "10.00",
//       currencyCode: "USD",
//       countryCode: "US",
//     },
//     merchantInfo: {
//       merchantId: "12345678901234567890",
//       merchantName: "Demo Merchant",
//     },
//     callbackIntents: ["PAYMENT_AUTHORIZATION"],
//     shippingAddressRequired: true,
//   };
//
//   const script = document.createElement("script");
//   script.src = "https://pay.google.com/gp/p/js/pay.js";
//   script.async = true;
//   script.onload = async () => {
//     console.log("TODO: add onload function");
//     const paymentsClient = new google.payments.api.PaymentsClient({
//       environment: "TEST",
//       paymentDataCallbacks: {
//         // process the payment
//         // not all customers will want to do this. They may just
//         // want access to the card info.
//         onPaymentAuthorized: async (paymentData) => {
//           console.log("paymentData", paymentData);
//           // wait for 3 seconds
//           await new Promise((resolve) => setTimeout(resolve, 3000));
//
//           return {
//             transactionState: "SUCCESS",
//           };
//         },
//       },
//     });
//
//     try {
//       await paymentsClient.isReadyToPay(baseRequest);
//       const btn = paymentsClient.createButton({
//         onClick: async () => {
//           const result = await paymentsClient.loadPaymentData({
//             ...baseRequest,
//           });
//           console.log("result", result);
//         },
//         allowedPaymentMethods: [baseCardPaymentMethod],
//       });
//
//       document.body.appendChild(btn);
//     } catch (err) {
//       console.error(err);
//     }
//   };
//
//   document.body.appendChild(script);
// }
//
// mountGooglePay();
//
// function mountApplePay() {
//   const script = document.createElement("script");
//   script.src = "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";
//   script.crossOrigin = "anonymous";
//   document.body.appendChild(script);
//
//   console.log("asdf");
//
//   const btn = document.querySelector("apple-pay-button");
//   btn.addEventListener("click", async () => {
//     const request = new PaymentRequest(
//       {
//         supportedMethods: "https://apple.com/apple-pay",
//         data: {
//           version: 3,
//           merchantIdentifier: "merchant.com.apdemo",
//           merchantCapabilities: ["supports3DS"],
//           supportedNetworks: ["amex", "discover", "masterCard", "visa"],
//           countryCode: "US",
//         },
//       },
//       {
//         total: {
//           label: "Total",
//           amount: {
//             currency: "USD",
//             value: "10.00",
//           },
//         },
//       }
//     );
//
//     const response = await request.show();
//   });
// }
//
// if (window.PaymentRequest) {
//   mountApplePay();
// }
