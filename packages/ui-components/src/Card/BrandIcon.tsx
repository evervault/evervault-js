import { validateNumber } from "@evervault/card-validator";
import { CustomBrand, CardIcons } from "types";
import { isDefaultCardBrand } from "./utilities";

export function BrandIcon({
  number,
  icons,
  customBrands,
}: {
  number: string;
  icons: CardIcons;
  customBrands?: CustomBrand[];
}) {
  const { brand, localBrands } = validateNumber(number, { customBrands });
  const localBrand = localBrands[0];
  const customBrand = customBrands?.find((b) => b.name === localBrand);
  const brandName = brand ?? localBrand ?? "default";

  let icon = customBrand?.iconSrc;
  if (!icon && isDefaultCardBrand(brandName)) {
    icon = icons[brandName];
  }

  icon = icon ?? icons.default;

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
