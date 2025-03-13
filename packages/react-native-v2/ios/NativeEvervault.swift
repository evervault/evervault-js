import Evervault

@objc(NativeEvervault)
class NativeEvervault: NSObject {
    var ev: Evervault?

    @objc(initialize:withAppId:)
    func initialize(teamId: String, appId: String) {
        let evervault = Evervault(teamId: teamId, appId: appId)
        self.ev = evervault
    }
    
    func encrypt(_ value: Any, _ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                guard let evervault = self.ev else {
                    reject("Error", "Evervault is not initialized", nil)
                    return
                }
                let enc = try await evervault.encrypt(value)
                resolve(enc)
            } catch {
                reject("Error", "Failed to encrypt: \(error.localizedDescription)", error)
            }
        }
    }

    @objc(encryptString:withResolver:withRejecter:)
    func encryptString(value: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        return self.encrypt(value, resolve, reject)
    }

    @objc(encryptNumber:withResolver:withRejecter:)
    func encryptNumber(value: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        return self.encrypt(value, resolve, reject)
    }

    @objc(encryptBoolean:withResolver:withRejecter:)
    func encryptBoolean(value: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        return self.encrypt(value, resolve, reject)
    }

    @objc(encryptObject:withResolver:withRejecter:)
    func encryptObject(value: [String: Any], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        return self.encrypt(value, resolve, reject)
    }

    @objc(encryptArray:withResolver:withRejecter:)
    func encryptArray(value: [Any], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        return self.encrypt(value, resolve, reject)
    }
}
