import Evervault

@objc(EvervaultSdk)
class EvervaultSdk: NSObject {
    var ev: Evervault?

    @objc(initialize:withAppUuid:withResolver:withRejecter:)
    func initialize(teamUuid: String, appUuid: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                let evervault = Evervault(teamId: teamUuid, appId: appUuid)
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
