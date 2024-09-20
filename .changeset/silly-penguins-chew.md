---
"@evervault/evervault-react-native": minor
---

- Currently if a user enters an amex card and only enters 3 digits in the CVC it is correctly marked as invalid, however, if the user then switches to a Visa card, the CVC is still marked as invalid even though a 3 digit CVC should be considered valid.
- If a user enters an amex card and a 4 digit CVC of '1234' and then switches to a Visa card the CVC mask is updated and it is truncated to '123', however, the underlying value for the CVC will still be '1234' when it should b changed to '123'.
