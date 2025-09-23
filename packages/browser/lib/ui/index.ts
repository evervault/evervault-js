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
} from "types";
import { Transaction } from "../resources/transaction";
import GooglePay from "./googlePay";
import ApplePayButton, { ApplePayButtonOptions } from "./ApplePay/index";
import CardWithProfiling from "./cardWithProfiling";
import ThreeDSecureWithProfiling from "./threeDSecureWithProfiling";

export default class UIComponents {
  client: EvervaultClient;
  themes = themes;

  constructor(client: EvervaultClient) {
    this.client = client;
  }

  card(opts?: CardOptions) {
    return new Card(this.client, opts);
  }

  cardWithProfiling(opts?: CardOptions) {
    return new CardWithProfiling(this.client, opts);
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

  threeDSecureWithProfiling(session: string, opts?: ThreeDSecureOptions) {
    return new ThreeDSecureWithProfiling(this.client, session, opts);
  }

  googlePay(tx: Transaction, opts: GooglePayOptions) {
    return new GooglePay(this.client, tx, opts);
  }

  applePay(tx: Transaction, opts: ApplePayButtonOptions) {
    return new ApplePayButton(this.client, tx, opts);
  }

  /**
   * @deprecated Use `applePay` instead.
   */
  applePayButton(tx: Transaction, opts: ApplePayButtonOptions) {
    return new ApplePayButton(this.client, tx, opts);
  }
}
