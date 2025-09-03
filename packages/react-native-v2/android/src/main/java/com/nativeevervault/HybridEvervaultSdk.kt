class HybridEvervaultSdk : HybridEvervaultSdkSpec() {
  private val evervaultScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

  private val instances = mutableMapOf<String, Evervault>()

  private fun getInstanceId(teamId: String, appId: String): String {
    return "$teamId:$appId"
  }

  private fun getInstance(instanceId: String): Evervault? {
    return instances[instanceId]
  }

  override fun initialize(teamId: String, appId: String): String {
    val instance = Evervault(teamId, appId)
    val instanceId = getInstanceId(teamId, appId)
    instances[instanceId] = instance
    return instanceId
  }

  override fun encrypt(instanceId: String, json: String): Promise<String> {
    return Promise.async {
      evervaultScope.launch {
        val instance = getInstance(instanceId)
        if (instance == null) {
          throw Error("Instance not found.")
        }

        val encrypted = withContext(context = Dispatchers.IO) {
          instance.encrypt(json)
        }
        return@async encrypted
      }
    }
  }
}