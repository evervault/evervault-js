import React, { useLayoutEffect, useRef, useState } from "react";
import { ComponentError, EncryptedFPAN, useEvervault, useThreeDSecure } from "@evervault/react";
import "./App.css";

function App() {
  const [name, setName] = useState("");
  const ev = useEvervault();
  const threeDSecure = useThreeDSecure();
  const initialized = useRef(false);
  const [instance, setInstance] = useState<any | null>(null);

  const onError = (error: ComponentError) => {
    console.error(error);
  };

  useLayoutEffect(() => {
    async function init() {
      if (initialized.current) return;
      initialized.current = true;
      const evervault = await ev;
      if (!evervault) return;
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


      const inst = evervault.ui.googlePay(transaction, {
        type: "pay",
        color: "black",
        size: { width: "108%", height: "48px" },
        borderRadius: 10,
        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
        allowedCardNetworks: ["VISA"],
        process: async (data, { fail }) => {
          console.log("Processing Google Pay data", data);
        }
      });

      inst.on("cancel", () => {
        console.log("Google Pay cancelled");
      });

      inst.mount("#google-pay-button");
      setInstance(inst);
    }

    init().catch(console.error);
  }, [instance]);

  return (
    <div className="app-container">
      <header>
        <div className="logo">
          <img src="/evervault.svg" alt="EverBooks Logo" width="40" height="40" />
          <h1>EverBooks</h1>
        </div>
        <nav>
          <a href={window.location.href} className="active">Checkout</a>
          <a href="https://docs.evervault.com" target="_blank" rel="noopener noreferrer">Catalogue</a>
          <a href="https://docs.evervault.com/payments/3d-secure" target="_blank" rel="noopener noreferrer">About</a>
        </nav>
      </header>

      <main>
        <div className="checkout-container">
          <div className="order-summary">
            <h2>Order Summary</h2>
            <ul>
              <li>First Edition "The Great Gatsby" (1925) <span>€2,450.00</span></li>
              <li>18th Century Atlas of the Americas <span>€1,875.00</span></li>
              <li>Archival Storage Case <span>€195.00</span></li>
              <li>Insured Priority Shipping <span>€75.00</span></li>
            </ul>
            <div className="total">
              <strong>Total</strong> <strong>€4,595.00</strong>
            </div>
          </div>

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
          </form>
        </div>
      </main>

      <footer>
        <p>&copy; 2023 EverLore. All rights reserved.</p>
        <p>Secured by <a href="https://evervault.com" target="_blank" rel="noopener noreferrer">Evervault</a></p>
      </footer>
    </div>
  );
}

export default App;