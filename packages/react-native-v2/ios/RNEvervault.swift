import Evervault

@objc(RNEvervault)
class RNEvervault: NSObject {
    var ev: Evervault?

    @objc(initialize:withAppId:withResolver:withRejecter:)
    func initialize(teamId: String, appId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                let evervault = Evervault(teamId: teamId, appId: appId)
                self.ev = evervault
                resolve(nil)
            } catch {
                reject("Error", "Failed to initialize: \(error.localizedDescription)", error)
            }
        }
    }

    @objc(encrypt:withResolver:withRejecter:)
    func encrypt(value: Any, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
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
}
