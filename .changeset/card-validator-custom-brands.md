---
"@evervault/card-validator": minor
---

Add custom brand support to card-validator. `validateNumber` and `validateCVC` now accept an optional `options` parameter with a `customBrands` field, allowing callers to supply additional `CustomBrand` definitions at validation time. The `ranges` type has been tightened from `number[] | [number[]]` to `Array<number | [number, number]>`.
