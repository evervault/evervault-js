import React, { useLayoutEffect, useRef, useState } from "react";
import { TransactionLineItem, useEvervault } from "@evervault/react";
import "./App.css";

function getLineItems(): TransactionLineItem[] {
  return [
    {
      label: "First Edition \"The Great Gatsby\" (1925)",
      amount: 245000,
    },
    {
      label: "Signed \"One Hundred Years of Solitude\" (1967)",
      amount: 185000,
    }
  ];
}

async function calculateShipping(region: string) {
  const newShipping = region === "Dublin" ? 1000 : 0;
  return Promise.resolve(newShipping);
}

function App() {
  const [name, setName] = useState("");
  const ev = useEvervault();
  const initialized = useRef(false);
  const [instance, setInstance] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useLayoutEffect(() => {
    async function init() {
      if (initialized.current) return;
      initialized.current = true;
      const evervault = await ev;
      if (!evervault) return;
      
      const transaction = evervault.transactions.create({
        amount: 430000,
        currency: "USD",
        country: "US",
        merchantId: import.meta.env.VITE_MERCHANT_ID,
        lineItems: getLineItems(),
      });

      const inst = evervault.ui.googlePay(transaction, {
        type: "pay",
        color: "white",
        borderRadius: 15,
        size: { width: 400, height: "60px" },
        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
        allowedCardNetworks: ["VISA", "MASTERCARD"],
        process: async (data, { fail }) => {
          console.log("Sending encrypted data to merchant", data);

          await new Promise((resolve) => {
            setTimeout(resolve, 2000);
          });

          if (true) {
            fail({
              message: "Something went wrong, please try again",
            });
          }
        },
      });

      inst.on("cancel", () => {
        console.log("Google Pay cancelled");
      });

      inst.on("error", (error: string) => {
        console.error("Google Pay error - ", error);
      });

      inst.on("success", () => {
        console.log("Google Pay success callback triggered - setting success");
        setSuccessMessage(
          "Payment processed successfully! Thank you for your order."
        );
      });

      inst.mount("#google-pay-button");
      setInstance(inst);

      /**
       * Disbursement transaction example
      
        const _disbursementTransaction = evervault.transactions.create({
          amount: 4300,
          currency: "USD",
          country: "US",
          merchantId: "merchant_e930d3f7bf37",
          requiredRecipientDetails: ["email", "phone", "name", "address"],
          type: "disbursement",
        });
       */

      const recurringTransaction = evervault.transactions.create({
        type: "recurring",
        amount: 4300,
        currency: "USD",
        country: "US",
        merchantId: "merchant_ef49637aa232",
        billingAgreement: "See https://example.com/terms for terms and conditions",
        managementURL: "https://applepaydemo.apple.com",
        description: "This is an example of a recurring transaction. Ipsum ut minim amet sit incididunt duis et adipisicing reprehenderit ut. Excepteur occaecat ad velit amet et labore Lorem velit dolore irure culpa nisi sunt officia.",
        regularBilling: {
          label: "Monthly Subscription",
          amount: 4.99,
          recurringPaymentStartDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
        },
        trialBilling: {
          label: "Trial Period",
          amount: 0,
          trialPaymentStartDate: new Date(),
        },
      } as any);

      const apple = evervault.ui.applePay(transaction, {
        type: "contribute",
        style: "white-outline",
        locale: "en-US",
        size: { width: "100%", height: "80px" },
        borderRadius: 10,
        allowedCardNetworks: ["visa", "masterCard"],
        requestShipping: true,
        onShippingAddressChange: async (event: PaymentRequestUpdateEvent) => {
          const newAddress = (event.target as any | null)?.shippingAddress;
          if (!newAddress) return;

          const shipping = await calculateShipping(newAddress.region);
          const newAmount = transaction.details.amount + shipping;

          return {
            amount: newAmount,
            lineItems: [
              ...getLineItems(),
              {
                label: "Shipping",
                amount: shipping,
              },
            ],
          };
        },
        process: async (data, {}) => {
          console.log("Sending encrypted data to merchant", data);

          await new Promise((resolve) => {
            setTimeout(resolve, 2000);
          });

          // console.log("Simulating failure");
          // fail({
          //   message: "Something went wrong, please try again",
          // });
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
        setSuccessMessage(
          "Payment processed successfully! Thank you for your order."
        );
      });

      apple.mount("#apple-pay-button");
    }

    init().catch(console.error);
  }, [instance]);

  return (
    <div className="app-container">
      <header>
        <div className="logo">
          <img
            src="/evervault.svg"
            alt="EverBooks Logo"
            width="40"
            height="40"
          />
          <h1>EverBooks</h1>
        </div>
        <nav>
          <a href={window.location.href} className="active">
            Checkout
          </a>
          <a
            href="https://docs.evervault.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Catalogue
          </a>
          <a
            href="https://docs.evervault.com/payments/3d-secure"
            target="_blank"
            rel="noopener noreferrer"
          >
            About
          </a>
        </nav>
      </header>

      <main>
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <div className="checkout-container">
          <div className="order-summary">
            <h2>Order Summary</h2>
            <ul>
              <li>
                First Edition "The Great Gatsby" (1925) <span>€2,450.00</span>
              </li>
              <li>
                Signed "One Hundred Years of Solitude" (1967){" "}
                <span>€1,850.00</span>
              </li>
            </ul>
            <div className="total">
              <strong>Total</strong> <strong>€4,300.00</strong>
            </div>
          </div>

          {!successMessage && (
            <form id="checkout-form">
              <h2>Checkout</h2>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div id="google-pay-button" />
              <div id="apple-pay-button" />
            </form>
          )}
        </div>
      </main>

      <footer>
        <p>&copy; 2023 EverLore. All rights reserved.</p>
        <p>
          Secured by{" "}
          <a
            href="https://evervault.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Evervault
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;

