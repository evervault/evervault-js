---
"@evervault/ui-components": major
---

Fix Google Pay amounts for currencies that do not have two minor units. Amounts
were always divided by 100 and rendered with two decimal places, so a
zero-decimal currency (JPY, KRW, VND, ISK) was displayed and authorised at
1/100th of the intended value, and a three-decimal currency (KWD, BHD, OMR, JOD,
TND) at 10x. The total and line items are now converted using the currency's own
exponent.

Google Pay carries at most two fraction digits, so three-decimal currencies are
supported down to hundredths of a major unit: 1.000 KWD works, 1.005 KWD does
not and now throws instead of being rounded to a different amount. Previously
such an amount rendered a button that failed mid-checkout with `OR_BIBED_06`.

Note for anyone already live in a zero-decimal currency: amounts were being
divided by 100, so if you compensated by passing 100x the intended amount, the
Google Pay sheet will now show 100x too much and no longer match what you
charge. Pass the true minor-unit amount.
