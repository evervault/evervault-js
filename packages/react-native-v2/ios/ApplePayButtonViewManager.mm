#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import "RCTBridge.h"
#import "native_evervault-Swift.h"

@interface ApplePayButtonViewManager : RCTViewManager
@end

@implementation ApplePayButtonViewManager

RCT_EXPORT_MODULE(ApplePayButtonView)

- (UIView *)view
{
  return [[ApplePayButton alloc] init];
}

RCT_CUSTOM_VIEW_PROPERTY(appId, NSString, ApplePayButton)
{
  [view setAppId:json];
}

RCT_CUSTOM_VIEW_PROPERTY(merchantId, NSString, ApplePayButton)
{
  [view setMerchantId:json];
}

RCT_CUSTOM_VIEW_PROPERTY(supportedNetworks, NSArray, ApplePayButton)
{
  [view setSupportedNetworks:json];
}

RCT_CUSTOM_VIEW_PROPERTY(buttonType, NSString, ApplePayButton)
{
  [view setButtonType:json];
}

RCT_CUSTOM_VIEW_PROPERTY(buttonStyle, NSString, ApplePayButton)
{
  [view setButtonStyle:json];
}

RCT_CUSTOM_VIEW_PROPERTY(transaction, NSDictionary, ApplePayButton)
{
  [view setTransaction:json];
}

RCT_EXPORT_VIEW_PROPERTY(onAuthorizePayment, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFinishWithResult, RCTDirectEventBlock)

@end