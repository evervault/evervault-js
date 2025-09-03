import Evervault
import NitroModules

class HybridEvervaultSdk : HybridEvervaultSdkSpec {
  var instances: [String: Evervault] = [:]

  func getInstanceId(_ teamId: String, _ appId: String) -> String {
      return "\(teamId):\(appId)"
  }

  func getInstance(_ instanceId: String) -> Evervault? {
      return self.instances[instanceId]
  }

  func initialize(teamId: String, appId: String) -> String {
      let evervault = Evervault(teamId: teamId, appId: appId)
      let instanceId = getInstanceId(teamId, appId)
      self.instances[instanceId] = evervault
      return instanceId
  }

  func encrypt<T, U>(instanceId: String, _ data: T) throws -> Promise<U> {
    return Promise.async {
        guard let instance = self.getInstance(instanceId) else {
              throw RuntimeError.error(withMessage: "Instance not found.")
        }
        return try await instance.encrypt(data) as! U
    }
  }

  func encryptString(instanceId: String, data: String) throws -> Promise<String> {
    return try self.encrypt(instanceId: instanceId, data)
  }

  func encryptNumber(instanceId: String, data: Double) throws -> Promise<String> {
    return try self.encrypt(instanceId: instanceId, data)
  }

  func encryptBoolean(instanceId: String, data: Bool) throws -> Promise<String> {
    return try self.encrypt(instanceId: instanceId, data)
  }

  func encryptObject(instanceId: String, data: AnyMap) throws -> Promise<AnyMap> {
      return try self.encrypt(instanceId: instanceId, data)
  }

  func encryptArray(instanceId: String, data: [AnyMap]) throws -> Promise<[AnyMap]> {
      return try self.encrypt(instanceId: instanceId, data)
  }
}
