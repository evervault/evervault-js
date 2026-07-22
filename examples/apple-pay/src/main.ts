import Evervault from "@evervault/browser";
import "./style.css";

const BASE_AMOUNT = 1000; // $10.00 in cents
const COUPON_SAVE20 = "SAVE20";

/** Distinct prefill so you can tell it apart from a Wallet default address. */
const PREFILL_BILLING = {
  givenName: "Evervault",
  familyName: "Billing",
  addressLines: ["1 Prefill Billing St"],
  locality: "Cupertino",
  administrativeArea: "CA",
  postalCode: "95014",
  countryCode: "US",
  country: "United States",
};

const PREFILL_SHIPPING = {
  givenName: "Evervault",
  familyName: "Shipping",
  emailAddress: "shipping-prefill@example.com",
  phoneNumber: "+14085550100",
  addressLines: ["2 Prefill Shipping Ave"],
  locality: "Cupertino",
  administrativeArea: "CA",
  postalCode: "95014",
  countryCode: "US",
  country: "United States",
};

function setStatus(message: string) {
  const el = document.getElementById("status");
  if (el) el.textContent = message;
  console.log("[apple-pay]", message);
}

function totalsForCoupon(code: string) {
  const normalized = code.trim().toUpperCase();

  if (normalized === COUPON_SAVE20) {
    return {
      amount: 800,
      lineItems: [
        { label: "Test item", amount: 1000 },
        { label: "Coupon SAVE20 (−20%)", amount: -200 },
      ],
    };
  }

  if (normalized === "") {
    return {
      amount: BASE_AMOUNT,
      lineItems: [{ label: "Test item", amount: BASE_AMOUNT }],
    };
  }

  return {
    amount: BASE_AMOUNT,
    lineItems: [{ label: "Test item", amount: BASE_AMOUNT }],
    error: {
      code: "couponCodeInvalid" as const,
      message: `Unknown code. Try ${COUPON_SAVE20}.`,
    },
  };
}

async function main() {
  setStatus("Starting…");

  const team = import.meta.env.VITE_EV_TEAM_UUID;
  const app = import.meta.env.VITE_EV_APP_UUID;
  const merchantId = import.meta.env.VITE_MERCHANT_ID;

  if (!team || !app || !merchantId) {
    setStatus(
      "Missing env: set VITE_EV_TEAM_UUID, VITE_EV_APP_UUID, VITE_MERCHANT_ID in evervault-js/.env"
    );
    return;
  }

  setStatus("Creating Evervault client…");
  const evervault = new Evervault(team, app, {
    urls: {
      keysUrl: import.meta.env.VITE_KEYS_URL!,
      apiUrl: import.meta.env.VITE_API_URL!,
      componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL!,
    },
  });

  const transaction = evervault.transactions.create({
    type: "payment",
    amount: BASE_AMOUNT,
    currency: "USD",
    country: "US",
    merchantId,
    priceLabel: "Contact prefill test",
    lineItems: [{ label: "Test item", amount: BASE_AMOUNT }],
  });

  const apple = evervault.ui.applePayButton(transaction, {
    size: { width: "100%", height: "40px" },
    requestBillingAddress: true,
    requestShipping: true,
    requestPayerDetails: ["name", "email", "phone"],
    billingContact: PREFILL_BILLING,
    shippingContact: PREFILL_SHIPPING,
    supportsCouponCode: true,
    couponCode: "",
    onCouponCodeChange: async (code) => {
      const update = totalsForCoupon(code);
      if (update.error) {
        setStatus(
          `Invalid "${code}" — sheet should show: ${update.error.message}`
        );
      } else if (code.trim().toUpperCase() === COUPON_SAVE20) {
        setStatus(
          `Applied ${COUPON_SAVE20} → $${(update.amount / 100).toFixed(2)}`
        );
      } else {
        setStatus("Coupon cleared → $10.00");
      }
      return update;
    },
    process: async (data) => {
      console.log("PROCESS", data);
      console.log("billingContact", data.billingContact);
      console.log("shippingContact", data.shippingContact);
      setStatus(
        "Payment authorized — check console for billingContact / shippingContact"
      );
    },
  });

  setStatus("Checking Apple Pay availability…");
  const availability = await apple.availability();
  setStatus(`Availability: ${availability}`);

  if (availability === "available") {
    apple.on("error", (error) => {
      console.log("Apple Pay error", error);
      setStatus(`Error: ${error ?? "unknown"}`);
    });

    apple.on("success", () => {
      console.log("Apple pay success!");
      setStatus("Success");
    });

    apple.on("cancel", () => {
      console.log("Apple Pay cancelled");
      setStatus("Cancelled");
    });

    apple.on("ready", () => {
      console.log("Apple Pay button is ready!");
      setStatus(
        "Ready — tap Apple Pay and check billing/shipping show the Prefill addresses"
      );
    });

    apple.mount("#apple-pay");
  } else if (availability === "unavailable") {
    const container = document.getElementById("apple-pay");
    container!.innerHTML = "Apple Pay is not available on this device";
    setStatus("Apple Pay unavailable (no Wallet credentials)");
  } else {
    const container = document.getElementById("apple-pay");
    container!.innerHTML =
      "Apple Pay is not supported here — open this page in Safari";
    setStatus("Apple Pay unsupported — use Safari with Wallet");
  }
}

main().catch((error) => {
  console.error(error);
  setStatus(
    `Failed: ${error instanceof Error ? error.message : String(error)}`
  );
});
