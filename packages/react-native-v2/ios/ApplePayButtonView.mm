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

    // Convert ApplePayButtonViewTransactionStruct to NSDictionary
    NSMutableDictionary *transactionDict = [NSMutableDictionary dictionary];
    
    // Convert type enum to string
    transactionDict[@"type"] = [NSString stringWithUTF8String:toString(newViewProps.transaction.type).c_str()];
    
    // Convert basic string fields
    transactionDict[@"country"] = [NSString stringWithUTF8String:newViewProps.transaction.country.c_str()];
    transactionDict[@"currency"] = [NSString stringWithUTF8String:newViewProps.transaction.currency.c_str()];
    
    // Convert shipping type enum to string
    transactionDict[@"shippingType"] = [NSString stringWithUTF8String:toString(newViewProps.transaction.shippingType).c_str()];
    
    // Convert payment summary items array
    NSMutableArray *paymentSummaryItems = [NSMutableArray arrayWithCapacity:newViewProps.transaction.paymentSummaryItems.size()];
    for (const auto &item : newViewProps.transaction.paymentSummaryItems) {
        NSDictionary *itemDict = @{
            @"label": [NSString stringWithUTF8String:item.label.c_str()],
            @"amount": [NSString stringWithUTF8String:item.amount.c_str()]
        };
        [paymentSummaryItems addObject:itemDict];
    }
    transactionDict[@"paymentSummaryItems"] = paymentSummaryItems;
    
    // Convert shipping methods array
    NSMutableArray *shippingMethods = [NSMutableArray arrayWithCapacity:newViewProps.transaction.shippingMethods.size()];
    for (const auto &method : newViewProps.transaction.shippingMethods) {
        NSDictionary *dateRangeDict = nil;
        // Only add dateRange if at least one of the fields is non-zero (or non-default)
        if (method.dateRange.start.year != 0 ||
            method.dateRange.start.month != 0 ||
            method.dateRange.start.day != 0 ||
            method.dateRange.end.year != 0 ||
            method.dateRange.end.month != 0 ||
            method.dateRange.end.day != 0) {
            dateRangeDict = @{
                @"start": @{
                    @"year": @(method.dateRange.start.year),
                    @"month": @(method.dateRange.start.month),
                    @"day": @(method.dateRange.start.day)
                },
                @"end": @{
                    @"year": @(method.dateRange.end.year),
                    @"month": @(method.dateRange.end.month),
                    @"day": @(method.dateRange.end.day)
                }
            };
        }
        
        NSDictionary *methodDict = @{
            @"label": [NSString stringWithUTF8String:method.label.c_str()],
            @"amount": [NSString stringWithUTF8String:method.amount.c_str()],
            @"detail": [NSString stringWithUTF8String:method.detail.c_str()],
            @"identifier": [NSString stringWithUTF8String:method.identifier.c_str()],
            @"dateRange": dateRangeDict
        };
        [shippingMethods addObject:methodDict];
    }
    transactionDict[@"shippingMethods"] = shippingMethods;
    
    // Convert required shipping contact fields array
    NSMutableArray *requiredFields = [NSMutableArray arrayWithCapacity:newViewProps.transaction.requiredShippingContactFields.size()];
    for (const auto &field : newViewProps.transaction.requiredShippingContactFields) {
        [requiredFields addObject:[NSString stringWithUTF8String:field.c_str()]];
    }
    transactionDict[@"requiredShippingContactFields"] = requiredFields;
    [_view setTransaction:transactionDict];

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