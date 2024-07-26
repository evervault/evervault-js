"use client";

import {
  Card,
  CardPayload,
  ComponentError,
  ThreeDSecure,
} from "@evervault/react";
import { useState } from "react";
import { completePayment, createThreeDSSession } from "./actons.server";
import css from "./styles.module.css";
import { theme } from "./theme";

export function Checkout() {
  const [session, setSession] = useState<string | null>(null);
  const [cardData, setCardData] = useState<CardPayload | null>(null);

  const handleCardChange = (payload: CardPayload) => {
    setCardData(payload);
  };

  const handleSubmit = () => {
    if (!cardData || !cardData.isValid) return;

    const initiateSession = async () => {
      const id = await createThreeDSSession();
      setSession(id);
    };

    void initiateSession();
  };

  const handleThreeDSecureComplete = () => {
    void completePayment(session!);
  };

  const handleError = (error: ComponentError) => {
    console.error(error);
  };

  const handleFailure = () => {
    console.log("3DS failed");
  };

  return (
    <>
      <Card theme={theme} onChange={handleCardChange} />
      <button onClick={handleSubmit} className={css.button}>
        Checkout
      </button>

      {session && (
        <ThreeDSecure
          modal
          key={session}
          session={session}
          onSuccess={handleThreeDSecureComplete}
          onFailure={handleFailure}
          onError={handleError}
        />
      )}
    </>
  );
}
