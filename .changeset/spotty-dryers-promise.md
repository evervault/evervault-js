---
"@evervault/evervault-react-native": minor
---

Added 3DS support. 

* Added the `<ThreeDSecure />` provider component which allows the use of `<ThreeDSecure.Modal />` and `<ThreeDSecure.Frame />` components which can both be used for completing a 3DS Session. The modal is an out-of-the-box solution for 3DS, while the frame allows for more customisation.  
* One new hook is available, `useThreeDSecure()`, which must be used in conjunction with the 3DS components.
