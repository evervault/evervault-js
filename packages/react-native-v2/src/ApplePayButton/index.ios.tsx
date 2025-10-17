import { ApplePayButtonProps } from "./types";
import NativeApplePayButton from "../specs/ApplePayButtonNativeComponent";
import { Fragment } from "react/jsx-runtime";
import { Text } from "react-native";
export * from "./types";

export const isApplePayAvailable = () => {
  // TODO: Call the native method to check if Apple Pay is available
  return true;
};

export const isApplePayDisbursementAvailable = () => {
  // TODO: Call the native method to check if Apple Pay Disbursement is available
  return false;
};

export const ApplePayButton: React.FC<ApplePayButtonProps> = ({
  appId,
  merchantId,
  supportedNetworks = ["visa", "mastercard", "amex", "discover", "jcb"],
  buttonType = "buy",
  buttonTheme = "automatic",
  transaction,
  onDidAuthorizePayment,
  onDidFinishWithResult,
  onPrepareTransaction,
  ...props
}) => {
  return (
    <Fragment>
      <Text>Hello</Text>
      <NativeApplePayButton
        config={{
          appId,
          merchantId,
          supportedNetworks,
          buttonType,
          buttonTheme,
        }}
        transaction={transaction}
        // TODO: Add handlers
        // onDidAuthorizePayment={onDidAuthorizePayment}
        // onDidFinishWithResult={onDidFinishWithResult}
        // onPrepareTransaction={onPrepareTransaction}
        {...props}
      />
    </Fragment>
  );
};
