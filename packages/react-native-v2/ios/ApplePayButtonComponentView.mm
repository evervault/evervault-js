#ifdef RCT_NEW_ARCH_ENABLED

#import "ApplePayButtonComponentView.h"

#import <react/renderer/components/NativeEvervaultSpec/ComponentDescriptors.h>
#import <react/renderer/components/NativeEvervaultSpec/EventEmitters.h>
#import <react/renderer/components/NativeEvervaultSpec/Props.h>
#import <react/renderer/components/NativeEvervaultSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import "native_evervault-Swift.h"

using namespace facebook::react;

@interface ApplePayButtonComponentView () <RCTApplePayButtonComponentViewViewProtocol, ApplePayButtonDelegate>

@end

@implementation ApplePayButtonComponentView {
    ApplePayButton * _view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<ApplePayButtonComponentViewComponentDescriptor>();
}

- (const ApplePayButtonComponentViewEventEmitter &)eventEmitter
{
  return static_cast<const ApplePayButtonComponentViewEventEmitter &>(*_eventEmitter);
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ApplePayButtonComponentViewProps>();
    _props = defaultProps;

    _view = [[ApplePayButton alloc] init];
    _view.delegate = self;

    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<ApplePayButtonComponentViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<ApplePayButtonComponentViewProps const>(props);

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
    if (oldViewProps.paymentType != newViewProps.paymentType) {
        [_view setPaymentType:[NSString stringWithUTF8String:toString(newViewProps.paymentType).c_str()]];
    }
    if (oldViewProps.appearance != newViewProps.appearance) {
        [_view setAppearance:[NSString stringWithUTF8String:toString(newViewProps.appearance).c_str()]];
    }

    [super updateProps:props oldProps:oldProps];
}

#pragma mark - ApplePayButtonDelegate

- (void)applePayButton:(ApplePayButton *)button didAuthorizePayment:(NSString *)result {
    if (_eventEmitter) {
        ApplePayButtonComponentViewEventEmitter::OnAuthorizePayment event{[result UTF8String]};
        self.eventEmitter.onAuthorizePayment(event);
    }
}

- (void)applePayButton:(ApplePayButton *)button didError:(NSString *)result {
    if (_eventEmitter) {
        ApplePayButtonComponentViewEventEmitter::OnError event{[result UTF8String]};
        self.eventEmitter.onError(event);
    }
}

- (void)applePayButton:(ApplePayButton *)button didRequestTransaction:(NSString *)request {
    if (_eventEmitter) {
        ApplePayButtonComponentViewEventEmitter::OnPrepareTransaction event{[request UTF8String]};
        self.eventEmitter.onPrepareTransaction(event);
    }
}

#pragma mark - Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
    RCTApplePayButtonComponentViewHandleCommand(self, commandName, args);
}

- (void)prepareTransaction:(const NSString *)transaction
{
    [_view prepareTransaction:[NSString stringWithUTF8String:transaction.UTF8String]];
}

Class<RCTComponentViewProtocol> ApplePayButtonComponentViewCls(void)
{
    return ApplePayButtonComponentView.class;
}

@end

#endif /* RCT_NEW_ARCH_ENABLED */
