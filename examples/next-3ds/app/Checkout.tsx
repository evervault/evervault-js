"use client";

import { Card, CardPayload, useThreeDSecure } from "@evervault/react";
import { useState } from "react";
import { completePayment, createThreeDSSession } from "./actons.server";
import css from "./styles.module.css";
import { theme } from "./theme";

export function Checkout() {
  const [cardData, setCardData] = useState<CardPayload | null>(null);
  const threeDSecure = useThreeDSecure();

  // keep track of the card data using the onChange prop of the Card component
  const handleCardChange = (payload: CardPayload) => {
    setCardData(payload);
  };

  const handleSubmit = () => {
    if (!cardData || !cardData.isValid) return;

    const handleThreeDSecure = async () => {
      // First we need to create a 3DS session. This must be done on the server. Here we are
      // using a Next.JS server action to create the session.
      const id = await createThreeDSSession();

      const handleComplete = () => {
        // When 3DS is complete we can call our backend to complete the payment. Your backend
        // can use the Evervault API to retrieve the cryptogram for the 3DS session to authorize
        // the payment. Again, here we are using a Next.JS server action to complete the payment.
        void completePayment(id);
      };

      const handleFailure = () => {
        // 3DS failed
      };

      // Once we have the 3DS session ID we can start the 3DS process by calling the start
      // method on the returned object from useThreeDSecure.
      threeDSecure.start(id, {
        onSuccess: handleComplete,
        onFailure: handleFailure,
      });
    };

    void handleThreeDSecure();
  };

  return (
    <>
      <Card theme={theme} onChange={handleCardChange} />
      <button onClick={handleSubmit} className={css.button}>
        Checkout
      </button>
    </>
  );
}
