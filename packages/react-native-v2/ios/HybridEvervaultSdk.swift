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

  func encrypt(instanceId: String, json: String) throws -> Promise<String> {
    return Promise.async {
        guard let instance = self.getInstance(instanceId) else {
              throw RuntimeError.error(withMessage: "Instance not found.")
        }

        let obj = try JSONSerialization.jsonObject(with: Data(json.utf8), options: [.fragmentsAllowed])
        let encrypted = try await instance.encrypt(obj)
        let result = try JSONSerialization.data(withJSONObject: encrypted, options: [.fragmentsAllowed])
        
        guard let string = String(data: result, encoding: .utf8) else {
            throw RuntimeError.error(withMessage: "JSON encoding error.")
        }

        return string
    }
  }
}
