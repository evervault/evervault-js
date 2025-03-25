import * as themes from "themes";
import Card from "./card";
import Form from "./form";
import Pin from "./pin";
import Reveal from "./reveal";
import ThreeDSecure from "./threeDSecure";
import type EvervaultClient from "../main";
import type {
  PinOptions,
  CardOptions,
  FormOptions,
  ThreeDSecureOptions,
  GooglePayOptions,
  ApplePayOptions,
} from "types";
import { Transaction } from "../resources/transaction";
import GooglePay from "./googlePay";
import ApplePay from "./applePay";
import ApplePayButton, { ApplePayButtonOptions } from "./ApplePay/index";

export default class UIComponents {
  client: EvervaultClient;
  themes = themes;

  constructor(client: EvervaultClient) {
    this.client = client;
  }

  card(opts?: CardOptions) {
    return new Card(this.client, opts);
  }

  pin(opts?: PinOptions) {
    return new Pin(this.client, opts);
  }

  reveal(request: Request) {
    return new Reveal(this.client, request);
  }

  form(opts?: FormOptions) {
    return new Form(this.client, opts);
  }

  threeDSecure(session: string, opts?: ThreeDSecureOptions) {
    return new ThreeDSecure(this.client, session, opts);
  }

  googlePay(tx: Transaction, opts: GooglePayOptions) {
    return new GooglePay(this.client, tx, opts);
  }

  applePay(tx: Transaction, opts: ApplePayOptions) {
    return new ApplePay(this.client, tx, opts);
  }

  applePayButton(tx: Transaction, opts: ApplePayButtonOptions) {
    return new ApplePayButton(this.client, tx, opts);
  }
}
