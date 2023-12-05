import themes from "themes";
import CardDetails from "./cardDetails";
import Pin from "./pin";
import Reveal from "./reveal";
import type EvervaultClient from "../main";
import type { PinOptions, CardDetailsOptions } from "types";

export default class UIComponents {
  client: EvervaultClient;
  themes = themes;

  constructor(client: EvervaultClient) {
    this.client = client;
  }

  cardDetails(opts?: CardDetailsOptions) {
    return new CardDetails(this.client, opts);
  }

  pin(opts?: PinOptions) {
    return new Pin(this.client, opts);
  }

  reveal(request: Request) {
    return new Reveal(this.client, request);
  }
}
