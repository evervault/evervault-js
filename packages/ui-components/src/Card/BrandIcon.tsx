import { validateNumber } from "@evervault/card-validator";
import { CustomBrand, CardIcons } from "types";

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
  const customIcons = Object.fromEntries(
    customBrands?.map((b) => [b.name, b.iconSrc]) ?? []
  );
  const allIcons: Record<string, string | undefined> = {
    ...icons,
    ...customIcons,
  };
  // local or custom brand > global brand > default icon
  const icon = allIcons[localBrands[0] ?? brand ?? "default"] ?? icons.default;

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
