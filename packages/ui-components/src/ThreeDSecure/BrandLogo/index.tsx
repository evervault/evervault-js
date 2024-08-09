import { Amex } from "./Amex";
import { DinersClub } from "./DinersClub";
import { Discover } from "./Discover";
import { JCB } from "./JCB";
import { Mastercard } from "./Mastercard";
import { UnionPay } from "./UnionPay";
import { Visa } from "./Visa";

export const BRANDS = {
  visa: <Visa />,
  mastercard: <Mastercard />,
  amex: <Amex />,
  discover: <Discover />,
  diners: <DinersClub />,
  jcb: <JCB />,
  unionpay: <UnionPay />,
};

export function BrandLogo({ brand }: { brand: keyof typeof BRANDS }) {
  const logo = BRANDS[brand];
  if (!logo) return null;
  return logo;
}
