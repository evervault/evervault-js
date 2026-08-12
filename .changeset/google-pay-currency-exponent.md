---
"@evervault/ui-components": patch
---

Fix Google Pay amounts for currencies that do not have two minor units. Amounts
were always divided by 100 and rendered with two decimal places, so a
zero-decimal currency (JPY, KRW, VND) was authorised at 1/100th of the intended
value and a three-decimal currency (KWD, BHD, OMR) at 10x. The total and line
items are now converted using the currency's own exponent.
