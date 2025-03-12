package com.nativeevervault

import com.nativeevervault.NativeEvervaultSpec
import com.evervault.sdk.Evervault
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class NativeEvervaultModule(reactContext: ReactApplicationContext) : NativeEvervaultSpec(reactContext) {
  private val evervaultScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

  override fun getName() = NAME

  override fun initialize(teamId: String, appId: String, promise: Promise) {
    try {
      Evervault.shared.configure(teamId, appId)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("InitializationError", "Failed to initialize Evervault SDK", e)
    }
  }
  
  override fun encrypt(value: String, promise: Promise) {
    evervaultScope.launch {
      try {
        val encrypted = withContext(context = Dispatchers.IO) {
          Evervault.shared.encrypt(value)
        }

        promise.resolve(encrypted)
      } catch (e: Exception) {
        promise.reject("EncryptionError", "Failed to encrypt with the Evervault SDK $e")
      }
    }
  }

  companion object {
    const val NAME = "NativeEvervault"
  }
}