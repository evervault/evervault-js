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

const disbursementTransaction = evervault.transactions.create({
  amount: 100,
  currency: "USD",
  country: "US",
  merchantId: import.meta.env.VITE_MERCHANT_ID,
});

const apple = evervault.ui.applePay(disbursementTransaction, {
  type: "contribute",
  style: "white-outline",
  locale: "en-US",
  size: { width: "100%", height: "40px" },
  borderRadius: 10,
  requestPayerDetails: ["name", "email"],
  allowedCardNetworks: ["visa", "masterCard"],
  process: async (data) => {
    console.log("data", data);

    // simulate payment
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  },
});

apple.on("cancel", () => {
  console.log("Apple Pay cancelled");
});

apple.on("error", (error) => {
  console.error("Apple Pay error", error);
});

apple.on("success", () => {
  console.log("Apple Pay success callback triggered - setting success");
});

apple.mount("#apple-pay");
