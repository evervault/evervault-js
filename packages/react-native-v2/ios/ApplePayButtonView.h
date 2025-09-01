// This guard prevent this file to be compiled in the old architecture.
#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>

#ifndef ApplePayButtonViewNativeComponent_h
#define ApplePayButtonViewNativeComponent_h

NS_ASSUME_NONNULL_BEGIN

@interface ApplePayButtonView : RCTViewComponentView
@end

NS_ASSUME_NONNULL_END

#endif /* ApplePayButtonViewNativeComponent_h */
#endif /* RCT_NEW_ARCH_ENABLED */