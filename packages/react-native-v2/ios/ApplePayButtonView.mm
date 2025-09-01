#ifdef RCT_NEW_ARCH_ENABLED
#import "ApplePayButtonView.h"

#import <react/renderer/components/NativeEvervaultSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeEvervaultSpec/EventEmitters.h>
#import <react/renderer/components/NativeEvervaultSpec/Props.h>
#import <react/renderer/components/NativeEvervaultSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import "native_evervault-Swift.h"

using namespace facebook::react;

@interface ApplePayButtonView () <RCTApplePayButtonViewViewProtocol>

@end

@implementation ApplePayButtonView {
    ApplePayButton * _view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<ApplePayButtonViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ApplePayButtonViewProps>();
    _props = defaultProps;

    _view = [[ApplePayButton alloc] init];

    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<ApplePayButtonViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<ApplePayButtonViewProps const>(props);

    if (oldViewProps.red != newViewProps.red) {
        [_view setRed:@(newViewProps.red)];
    }

    if (oldViewProps.green != newViewProps.green) {
        [_view setGreen:@(newViewProps.green)];
    }

    if (oldViewProps.blue != newViewProps.blue) {
        [_view setBlue:@(newViewProps.blue)];
    }

    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> ApplePayButtonViewCls(void)
{
    return ApplePayButtonView.class;
}

@end
#endif