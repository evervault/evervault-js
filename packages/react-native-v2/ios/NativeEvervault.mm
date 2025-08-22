#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NativeEvervault, NSObject)

RCT_EXTERN_METHOD(initialize:(NSString *)teamId
                  withAppId:(NSString *)appId)

RCT_EXTERN_METHOD(encryptString:(NSString *)instanceId
                  withValue:(NSString *)value
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptNumber:(NSString *)instanceId
                  withValue:(double)value
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptBoolean:(NSString *)instanceId
                  withValue:(BOOL)value
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptObject:(NSString *)instanceId
                  withValue:(NSDictionary *)value
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(encryptArray:(NSString *)instanceId
                  withValue:(NSArray *)value
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

@end
