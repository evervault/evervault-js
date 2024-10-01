import { validateNumber } from "@evervault/card-validator";
import { CardIcons } from "types";

export function BrandIcon({
  number,
  icons,
}: {
  number: string;
  icons: CardIcons;
}) {
  const { brand, localBrands } = validateNumber(number);
  let icon = icons[brand ?? localBrands?.[0] ?? "default"];
  icon = icon || icons.default;

  return (
    <img
      src={icon}
      className="icon"
      ev-brand={brand}
      alt={`${brand} icon`}
      ev-has-brand={Boolean(brand).toString()}
    />
  );
}
