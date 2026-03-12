import { loadEvervault } from "../../../packages/js/src/index";
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
  type: "recurring",
  amount: 0,
  currency: "USD",
  country: "US",
  merchantId: import.meta.env.VITE_MERCHANT_ID,
  description: "Recurring payment test — every 2 weeks at $0.00",
  billingAgreement: "You will be charged $0.00 every 2 weeks.",
  managementURL: "https://example.com/manage",
  regularBilling: {
    label: "Recurring Test",
    amount: 0.0,
    recurringPaymentStartDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    recurringPaymentIntervalUnit: "week",
    recurringPaymentIntervalCount: 2,
  },
  trialBilling: {
    label: "Trial Period",
    amount: 0,
    trialPaymentStartDate: new Date(new Date().setDate(new Date().getDate() + 7)),
  },
});

const apple = evervault.ui.applePayButton(transaction, {
  size: { width: "100%", height: "30px" },
  process: async (data) => {
    console.log("PROCESSS", data);
  },
});

const availability = await apple.availability();

if (availability === "available") {
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
} else {
  const container = document.getElementById("apple-pay");
  container!.innerHTML = "Apple Pay is not available on this device";
  console.log("Apple Pay is not available");
}
