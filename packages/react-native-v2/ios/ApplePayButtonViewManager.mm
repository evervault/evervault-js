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

RCT_CUSTOM_VIEW_PROPERTY(config, NSDictionary, ApplePayButton)
{
  [view setConfigWithAppId:json[@"appId"] merchantId:json[@"merchantId"] supportedNetworks:json[@"supportedNetworks"] buttonType:json[@"buttonType"] buttonStyle:json[@"buttonStyle"]];
}

// RCT_CUSTOM_VIEW_PROPERTY(green, NSNumber, ApplePayButton)
// {
//   [view setGreen:json];
// }

// RCT_CUSTOM_VIEW_PROPERTY(blue, NSNumber, ApplePayButton)
// {
//   [view setBlue:json];
// }

RCT_EXPORT_VIEW_PROPERTY(onRedChange, RCTDirectEventBlock)

@end