import * as themes from "themes";
import Card from "./card";
import Form from "./form";
import Pin from "./pin";
import Reveal from "./reveal";
import type EvervaultClient from "../main";
import type { PinOptions, CardOptions, FormOptions } from "types";

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
}
