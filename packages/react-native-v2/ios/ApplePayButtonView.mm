#ifdef RCT_NEW_ARCH_ENABLED
#import "ApplePayButtonView.h"

#import <react/renderer/components/NativeEvervaultSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeEvervaultSpec/EventEmitters.h>
#import <react/renderer/components/NativeEvervaultSpec/Props.h>
#import <react/renderer/components/NativeEvervaultSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import "native_evervault-Swift.h"

using namespace facebook::react;

@interface ApplePayButtonView () <RCTApplePayButtonViewViewProtocol, ApplePayButtonDelegate>

@end

@implementation ApplePayButtonView {
    ApplePayButton * _view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<ApplePayButtonViewComponentDescriptor>();
}

- (const ApplePayButtonViewEventEmitter &)eventEmitter
{
  return static_cast<const ApplePayButtonViewEventEmitter &>(*_eventEmitter);
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ApplePayButtonViewProps>();
    _props = defaultProps;

    _view = [[ApplePayButton alloc] init];
    _view.delegate = self;

    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<ApplePayButtonViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<ApplePayButtonViewProps const>(props);

    if (oldViewProps.appId != newViewProps.appId) {
        [_view setAppId:[NSString stringWithUTF8String:newViewProps.appId.c_str()]];
    }
    if (oldViewProps.merchantId != newViewProps.merchantId) {
        [_view setMerchantId:[NSString stringWithUTF8String:newViewProps.merchantId.c_str()]];
    }
    if (oldViewProps.supportedNetworks != newViewProps.supportedNetworks) {
        // Convert std::vector<std::string> to NSArray<NSString *>
        NSMutableArray<NSString *> *networksArray = [NSMutableArray arrayWithCapacity:newViewProps.supportedNetworks.size()];
        for (const auto &network : newViewProps.supportedNetworks) {
            [networksArray addObject:[NSString stringWithUTF8String:network.c_str()]];
        }
        [_view setSupportedNetworks:networksArray];
    }
    if (oldViewProps.buttonType != newViewProps.buttonType) {
        [_view setButtonType:[NSString stringWithUTF8String:toString(newViewProps.buttonType).c_str()]];
    }
    if (oldViewProps.buttonStyle != newViewProps.buttonStyle) {
        [_view setButtonStyle:[NSString stringWithUTF8String:toString(newViewProps.buttonStyle).c_str()]];
    }

    [super updateProps:props oldProps:oldProps];
}

#pragma mark - ApplePayButtonDelegate

- (void)applePayButton:(ApplePayButton *)button didChangeRedValue:(NSInteger)red {
    if (_eventEmitter) {
        ApplePayButtonViewEventEmitter::OnRedChange event{static_cast<int>(red)};
        self.eventEmitter.onRedChange(event);
    }
}

Class<RCTComponentViewProtocol> ApplePayButtonViewCls(void)
{
    return ApplePayButtonView.class;
}

@end
#endif