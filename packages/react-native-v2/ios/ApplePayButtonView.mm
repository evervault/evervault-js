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

- (void)applePayButton:(ApplePayButton *)button didAuthorizePayment:(NSDictionary *)payment {
    if (_eventEmitter) {
        NSLog(@"didAuthorizePayment: %@", payment);
        
        // Create the nested structs
        ApplePayButtonViewEventEmitter::OnAuthorizePaymentCard card{
            std::string([payment[@"card"][@"brand"] UTF8String]),
            std::string([payment[@"card"][@"country"] UTF8String]),
            std::string([payment[@"card"][@"currency"] UTF8String]),
            std::string([payment[@"card"][@"funding"] UTF8String]),
            std::string([payment[@"card"][@"issuer"] UTF8String]),
            std::string([payment[@"card"][@"segment"] UTF8String])
        };
        
        ApplePayButtonViewEventEmitter::OnAuthorizePaymentNetworkTokenExpiry expiry{
            [payment[@"networkToken"][@"expiry"][@"month"] intValue],
            [payment[@"networkToken"][@"expiry"][@"year"] intValue]
        };
        
        ApplePayButtonViewEventEmitter::OnAuthorizePaymentNetworkToken networkToken{
            expiry,
            std::string([payment[@"networkToken"][@"number"] UTF8String]),
            std::string([payment[@"networkToken"][@"rawExpiry"] UTF8String]),
            std::string([payment[@"networkToken"][@"tokenServiceProvider"] UTF8String])
        };
        
        // Create the main struct
        ApplePayButtonViewEventEmitter::OnAuthorizePayment response{
            card,
            std::string([payment[@"cryptogram"] UTF8String]),
            std::string([payment[@"deviceManufacturerIdentifier"] UTF8String]),
            [payment[@"eci"] intValue],
            networkToken,
            std::string([payment[@"paymentDataType"] UTF8String])
        };
        
        self.eventEmitter.onAuthorizePayment(response);
    }
}

- (void)applePayButton:(ApplePayButton *)button didFinishWithSuccess:(BOOL)success code:(NSString *)code error:(NSString *)error {
    if (_eventEmitter) {
        ApplePayButtonViewEventEmitter::OnFinishWithResult event{
            success,
            code ? std::string([code UTF8String]) : std::string(),
            error ? std::string([error UTF8String]) : std::string()
        };
        self.eventEmitter.onFinishWithResult(event);
    }
}

Class<RCTComponentViewProtocol> ApplePayButtonViewCls(void)
{
    return ApplePayButtonView.class;
}

@end
#endif