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

    // Simpler conversion using ObjC literals and std::transform for supportedNetworks
    NSString *appId = @(newViewProps.config.appId.c_str());
    NSString *merchantId = @(newViewProps.config.merchantId.c_str());
    NSArray<NSString *> *supportedNetworks = ({
        std::vector<std::string> const &vec = newViewProps.config.supportedNetworks;
        NSMutableArray *arr = [NSMutableArray arrayWithCapacity:vec.size()];
        for (const auto &s : vec) [arr addObject:@(s.c_str())];
        [arr copy];
    });
    NSString *buttonType = @(newViewProps.config.buttonType.c_str());
    NSString *buttonStyle = @(newViewProps.config.buttonStyle.c_str());

    [_view setConfigWithAppId:appId merchantId:merchantId supportedNetworks:supportedNetworks buttonType:buttonType buttonStyle:buttonStyle];

    // if (oldViewProps.red != newViewProps.red) {
    //     [_view setRed:@(newViewProps.red)];
    // }

    // if (oldViewProps.green != newViewProps.green) {
    //     [_view setGreen:@(newViewProps.green)];
    // }

    // if (oldViewProps.blue != newViewProps.blue) {
    //     [_view setBlue:@(newViewProps.blue)];
    // }

    [super updateProps:props oldProps:oldProps];
}

// - (NSArray<NSString *> *)convertStringVectorToArray:(const std::vector<std::string> &)vector {
//     NSMutableArray<NSString *> *array = [NSMutableArray arrayWithCapacity:vector.size()];
//     for (const auto &str : vector) {
//         [array addObject:[NSString stringWithUTF8String:str.c_str()]];
//     }
//     return [array copy];
// }

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