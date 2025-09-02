import { ApplePayButtonProps } from "./types";
import ApplePayButtonView from "../specs/ApplePayButtonViewNativeComponent";
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
  supportedNetworks = [],
  buttonType = "plain",
  buttonStyle = "automatic",
  ...props
}) => {
  return (
    <Fragment>
      <Text>Hello World</Text>
      <ApplePayButtonView
        appId={appId}
        merchantId={merchantId}
        supportedNetworks={supportedNetworks}
        buttonType={buttonType}
        buttonStyle={buttonStyle}
        // red={red}
        // green={green}
        // blue={blue}
        // onRedChange={onRedChange}
        // transaction={transaction}
        // TODO: Add handlers
        // onDidAuthorizePayment={onDidAuthorizePayment}
        // onDidFinishWithResult={onDidFinishWithResult}
        // onPrepareTransaction={onPrepareTransaction}
        {...props}
      />
    </Fragment>
  );
};
