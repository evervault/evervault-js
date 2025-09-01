#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import "RCTBridge.h"

@interface ApplePayButtonViewManager : RCTViewManager
@end

@implementation ApplePayButtonViewManager

RCT_EXPORT_MODULE(ApplePayButtonView)

- (UIView *)view
{
  return [[UIView alloc] init];
}

RCT_CUSTOM_VIEW_PROPERTY(color, NSString, UIView)
{
  [view setBackgroundColor: [[UIColor alloc] initWithRed:255.0 green:0.0 blue:255.0 alpha:1.0]];
}

@end