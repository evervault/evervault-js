"use client";

import { Card, CardPayload, useThreeDSecure } from "@evervault/react";
import { useState } from "react";
import { completePayment, createThreeDSSession } from "./actons.server";
import css from "./styles.module.css";
import { theme } from "./theme";

export function Checkout() {
  const [cardData, setCardData] = useState<CardPayload | null>(null);
  const threeDSecure = useThreeDSecure();

  const handleCardChange = (payload: CardPayload) => {
    setCardData(payload);
  };

  const handleSubmit = () => {
    if (!cardData || !cardData.isValid) return;

    const initiateSession = async () => {
      const id = await createThreeDSSession();

      const handleComplete = () => {
        void completePayment(id);
      };

      const handleFailure = () => {
        // 3DS failed
      };

      threeDSecure.start(id, {
        onSuccess: handleComplete,
        onFailure: handleFailure,
      });
    };

    void initiateSession();
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
