package com.evervaultsdk

import com.evervault.sdk.Evervault
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext


class EvervaultSdkModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  private val evervaultScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun initialize(teamUuid: String, appUuid: String, promise: Promise) {
    try {
      Evervault.shared.configure(teamUuid, appUuid)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("InitializationError", "Failed to initialize Evervault SDK", e)
    }
  }

  @ReactMethod
  fun encrypt(value: String, promise: Promise) {
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
    const val NAME = "EvervaultSdk"
  }
}
