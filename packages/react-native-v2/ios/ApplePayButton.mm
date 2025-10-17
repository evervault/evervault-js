#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(ApplePayButton, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(config, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(transaction, NSDictionary)

@end
