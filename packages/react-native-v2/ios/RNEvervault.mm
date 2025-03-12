#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NativeEvervault, NSObject)

RCT_EXTERN_METHOD(initialize:(NSString *)teamId 
                  withAppId:(NSString *)appId 
                  withResolver:(RCTPromiseResolveBlock)resolve 
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encrypt:(id)data
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
