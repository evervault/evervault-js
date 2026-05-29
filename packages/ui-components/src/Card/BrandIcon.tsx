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
  // TODO: Remove ` as Record<string, string>` cast once @evervault/ui-components is updated
  let icon = (icons as Record<string, string>)[
    brand ?? localBrands?.[0] ?? "default"
  ];
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
