#ifdef RCT_NEW_ARCH_ENABLED
#import "ApplePayButtonView.h"

#import <react/renderer/components/NativeEvervaultSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeEvervaultSpec/EventEmitters.h>
#import <react/renderer/components/NativeEvervaultSpec/Props.h>
#import <react/renderer/components/NativeEvervaultSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface ApplePayButtonView () <RCTApplePayButtonViewViewProtocol>

@end

@implementation ApplePayButtonView {
    UIView * _view;
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

    _view = [[UIView alloc] init];

    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<ApplePayButtonViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<ApplePayButtonViewProps const>(props);

    if (oldViewProps.color != newViewProps.color) {
        NSString * colorToConvert = [[NSString alloc] initWithUTF8String: newViewProps.color.c_str()];
        [_view setBackgroundColor: [[UIColor alloc] initWithRed:255.0 green:0.0 blue:255.0 alpha:1.0]];
    }

    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> ApplePayButtonViewCls(void)
{
    return ApplePayButtonView.class;
}

@end
#endif