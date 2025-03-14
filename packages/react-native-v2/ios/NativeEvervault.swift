import Evervault

@objc(NativeEvervault)
class NativeEvervault: NSObject {
    var instances: [String: Evervault] = [:]

    func getInstanceId(_ teamId: String, _ appId: String) -> String {
        return "\(teamId):\(appId)"
    }

    func getInstance(_ instanceId: String) -> Evervault? {
        return self.instances[instanceId]
    }

    @objc(initialize:withAppId:)
    func initialize(teamId: String, appId: String) -> String {
        let evervault = Evervault(teamId: teamId, appId: appId)
        let instanceId = getInstanceId(teamId, appId)
        self.instances[instanceId] = evervault
        return instanceId
    }

    func encrypt(instanceId: String, _ value: Any, _ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
        Task {
            do {
                guard let instance = getInstance(instanceId) else {
                    reject("Error", "Instance not found", nil)
                    return
                }
                let enc = try await instance.encrypt(value)
                resolve(enc)
            } catch {
                reject("Error", "Failed to encrypt: \(error.localizedDescription)", error)
            }
        }
    }

    @objc(encryptString:withValue:withResolver:withRejecter:)
    func encryptString(instanceId: String, value: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        return self.encrypt(instanceId: instanceId, value, resolve, reject)
    }

    @objc(encryptNumber:withValue:withResolver:withRejecter:)
    func encryptNumber(instanceId: String, value: Double, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        return self.encrypt(instanceId: instanceId, value, resolve, reject)
    }

    @objc(encryptBoolean:withValue:withResolver:withRejecter:)
    func encryptBoolean(instanceId: String, value: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        return self.encrypt(instanceId: instanceId, value, resolve, reject)
    }

    @objc(encryptObject:withValue:withResolver:withRejecter:)
    func encryptObject(instanceId: String, value: [String: Any], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        return self.encrypt(instanceId: instanceId, value, resolve, reject)
    }

    @objc(encryptArray:withValue:withResolver:withRejecter:)
    func encryptArray(instanceId: String, value: [Any], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        return self.encrypt(instanceId: instanceId, value, resolve, reject)
    }
}
