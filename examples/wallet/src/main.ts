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
  amount: 125,
  currency: "USD",
  country: "US",
  merchant: {
    id: "12345678901234567890",
    name: "Test Merchant",
    evervaultId: "merchant_8f3dc605aa5d",
    applePayIdentifier: "donaltuohy.ngrok.app",
  },
});

const google = evervault.ui.googlePay(transaction, {
  type: "book",
  color: "white",
  allowedAuthMethods: ["PAN_ONLY"],
  allowedCardNetworks: ["MASTERCARD", "VISA"],
  process: async (data, { fail }) => {
    console.log("google process called", data);

    fail({
      reason: "PAYMENT_DATA_INVALID",
      message: "Cannot pay with payment credentials",
      intent: "PAYMENT_AUTHORIZATION",
    });
  },
});

google.on("cancel", () => {
  console.log("cancelled");
});

google.mount("#container");

const apple = evervault.ui.applePay(transaction, {
  type: "rent",
  style: "black",
  process: async (data) => {
    console.log("apple pay process called", data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  },
});

apple.on("cancel", () => {
  console.log("cancelled");
});

apple.mount("#container");
