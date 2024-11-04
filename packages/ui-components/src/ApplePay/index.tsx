import "./styles.css";
import { useLayoutEffect, useRef } from "react";
import { ApplePayConfig } from "./types";
import { resize } from "../utilities/resize";
import { buildPaymentRequest } from "./utilities";

interface ApplePayProps {
  config: ApplePayConfig;
}

declare global {
  interface Window {
    ApplePaySession: ApplePaySession;
  }
}

export function ApplePay({ config }: ApplePayProps) {
  const initialized = useRef(false);

  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const handleLoad = () => {
      resize();
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
    const request = buildPaymentRequest(config.transaction);
    console.log(request);
    const result = await request.show();
    console.log({ result });
  };

  // device does not support Apple Pay
  if (typeof window.ApplePaySession === "undefined" || !window.PaymentRequest) {
    return null;
  }

  return <button className="apple-pay" onClick={handleClick} />;
}
