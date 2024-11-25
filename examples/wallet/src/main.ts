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
  amount: 0,
  currency: "USD",
  country: "US",
  merchant: {
    name: "Doni Donuts",
    id: "merchant_d8e4353154df",
    applePayIdentifier: "ev-wallet.ngrok.app",
  },
  lineItems: [
    {
      amount: 125,
      label: "Product Fee",
    },
    {
      amount: 0,
      label: "Support Fee (Free)" 
    },
  ]
});

const google = evervault.ui.googlePay(transaction, {
  type: "book",
  color: "white",
  locale: "en-US",
  borderRadius: 15,
  size: { width: "250px", height: "50px" },
  allowedAuthMethods: ["PAN_ONLY"],
  allowedCardNetworks: ["MASTERCARD", "VISA"],
  process: async (data, { fail }) => {
    console.log("google process called", data);

    fail({
      message: "Cannot pay with payment credentials",
    });
  },
});

google.on("cancel", () => {
  console.log("cancelled");
});

google.mount("#google-pay-button");

const card = evervault.ui.card({
  icons: true,
  theme: {
    styles: {
      fieldSet: {
        marginTop: 4,
      },
    },
  },
});

card.on("change", (values) => {
  console.log("change", values);
});

card.on("swipe", (values) => {
  console.log("swipe", values);
});

card.on("validate", (values) => {
  console.log("validate", values);
});

card.mount("#form");

const apple = evervault.ui.applePay(transaction, {
  type: "rent",
  style: "white-outline",
  size: { width: "250px", height: "50px" },
  process: async (data, { fail }) => {
    console.log("apple pay process called - purchasing product", data);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("product purchased");
  },
});

apple.on("cancel", () => {
  console.log("cancelled");
});

apple.on("error", (error) => {
  console.error("Apple Pay failed with error.", error);
  alert(`Error: Please try again.`);
});

apple.mount("#container-apple");
