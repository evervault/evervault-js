#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(EvervaultPaymentViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(config, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(transaction, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(buttonType, NSString)
RCT_EXPORT_VIEW_PROPERTY(buttonTheme, NSString)
RCT_EXPORT_VIEW_PROPERTY(borderRadius, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(allowedCardNetworks, NSString)

@end 