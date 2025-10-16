import { loadEvervault } from "@evervault/js";
import "./style.css";

const evervault = await loadEvervault(
  import.meta.env.VITE_EV_TEAM_UUID,
  import.meta.env.VITE_EV_APP_UUID,
  {
    urls: {
      keysUrl: import.meta.env.VITE_KEYS_URL!,
      apiUrl: import.meta.env.VITE_API_URL!,
      componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL!,
    },
  }
);

const transaction = evervault.transactions.create({
  amount: 1000,
  currency: "USD",
  country: "US",
  merchantId: import.meta.env.VITE_MERCHANT_ID,
  lineItems: [{ label: "Product", amount: 1000 }],
});

const google = evervault.ui.googlePay(transaction, {
  type: "pay",
  locale: "en",
  size: { width: "100%", height: "80px" },
  borderRadius: 10,
  allowedCardNetworks: ["VISA", "MASTERCARD"], 
  process: async (data, {}) => {
    console.log("Google Pay data", data);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  },
  buttonSize: { width: "240px", height: "40px" }
});

google.on("success", (data) => {
  console.log("Google Pay success", data);
});

google.on("error", (error) => {
  console.log("Google Pay error", error);
});

google.mount("#form");