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
  amount: 100,
  currency: "USD",
  country: "US",
  merchantId: import.meta.env.VITE_MERCHANT_ID,
});

const apple = evervault.ui.applePayButton(transaction, {
  size: { width: "100%", height: "30px" },
  process: async (data) => {
    console.log("PROCESSS", data);
  },
});

apple.on("error", (error) => {
  console.log("Apple Pay error", error);
});

apple.on("success", () => {
  console.log("Apple pay success!");
});

apple.on("cancel", () => {
  console.log("Apple Pay cancelled");
});

apple.mount("#apple-pay");
