"use client";

import {
  Card,
  CardPayload,
  ComponentError,
  ThreeDSecure,
} from "@evervault/react";
import { useState } from "react";
import { completePayment, createThreeDSSession } from "./actons.server";

export function Checkout() {
  const [session, setSession] = useState<string | null>(null);
  const [cardData, setCardData] = useState<CardPayload | null>(null);

  const handleCardChange = (payload: CardPayload) => {
    setCardData(payload);
  };

  const handleSubmit = () => {
    const initiateSession = async () => {
      const id = await createThreeDSSession();
      setSession(id);
    };

    void initiateSession();
    if (!cardData || !cardData.isValid) return;
  };

  const handleThreeDSecureComplete = () => {
    console.log("COMPLETE!");
    void completePayment(session!);
  };

  const handleError = (error: ComponentError) => {
    console.error(error);
  };

  const handleFailure = () => {
    console.log("3DS failed");
  };

  return (
    <div>
      <Card onChange={handleCardChange} />
      <button onClick={handleSubmit}>Checkout</button>

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
    </div>
  );
}
