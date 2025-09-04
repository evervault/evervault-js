#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import "RCTBridge.h"
#import "native_evervault-Swift.h"

@interface ApplePayButtonComponentViewManager : RCTViewManager
@end

@implementation ApplePayButtonComponentViewManager

RCT_EXPORT_MODULE(ApplePayButtonComponentView)
RCT_EXPORT_VIEW_PROPERTY(appId, NSString)
RCT_EXPORT_VIEW_PROPERTY(merchantId, NSString)
RCT_EXPORT_VIEW_PROPERTY(supportedNetworks, NSArray)
RCT_EXPORT_VIEW_PROPERTY(paymentType, NSString)
RCT_EXPORT_VIEW_PROPERTY(appearance, NSString)
RCT_EXPORT_VIEW_PROPERTY(onAuthorizePayment, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)

@end
