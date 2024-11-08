import "./styles.css";
import { CSSProperties, useLayoutEffect, useRef } from "react";
import { ApplePayConfig } from "./types";
import { resize, setSize } from "../utilities/resize";
import { buildPaymentRequest } from "./utilities";

interface ApplePayProps {
  config: ApplePayConfig;
}

declare global {
  interface Window {
    ApplePaySession?: {
      new (
        version: number,
        request: ApplePayJS.ApplePayPaymentRequest
      ): ApplePaySession;
      canMakePayments(): boolean;
    };
  }
}

export function ApplePay({ config }: ApplePayProps) {
  const button = useRef<HTMLButtonElement>(null);
  const initialized = useRef(false);

  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const handleLoad = () => {
      resize();
      setSize({
        width: button.current?.offsetWidth || 0,
        height: button.current?.offsetHeight || 0,
      });
    };

    const script = document.createElement("script");
    script.src =
      "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = handleLoad;
    document.body.appendChild(script);
  }, []);

  const handleClick = async () => {
    const session = buildPaymentRequest(config.transaction);
    session.begin();
  };

  // device does not support Apple Pay
  if (!window.ApplePaySession || !window.ApplePaySession.canMakePayments()) {
    return null;
  }

  if (!config.transaction.merchant.applePayIdentifier) {
    throw new Error(
      "Apple Pay Merchant Identifier not found, please set merchant.applePayIdentifier on the transaction"
    );
  }

  const style = {
    "--type": config.type,
    "--style": config.style,
    "--border-radius": config.borderRadius || 4,
    width: "100%",
    height: "100%",
  };

  return (
    <button
      ref={button}
      className="apple-pay"
      onClick={handleClick}
      style={style as CSSProperties}
    />
  );
}
