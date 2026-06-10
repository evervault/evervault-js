import EvervaultClient, { BrandOptions } from "@evervault/browser";
import { createBrand } from "shared";

export class PromisifiedEvervaultClient extends Promise<EvervaultClient> {
  public async encrypt(data: unknown) {
    const ev = await this;
    return ev.encrypt(data);
  }

  public async decrypt(token: string, data: unknown) {
    const ev = await this;
    return ev.decrypt(token, data);
  }

  get brands() {
    return {
      create: (name: string, options: BrandOptions) =>
        createBrand(name, options),
    };
  }
}
