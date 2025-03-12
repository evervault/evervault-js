package com.nativeevervault

import com.nativeevervault.NativeEvervaultSpec
import com.evervault.sdk.Evervault
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class NativeEvervaultModule(reactContext: ReactApplicationContext) : NativeEvervaultSpec(reactContext) {
  private val evervaultScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

  override fun getName() = NAME

  override fun initialize(teamId: String, appId: String) {
    Evervault.shared.configure(teamId, appId)
  }

  fun convertToReadableArray(value: List<Any>): ReadableArray {
    return Arguments.createArray().apply {
      value.forEach { item ->
        when (item) {
          is Map<*, *> -> pushMap(convertToReadableMap(item as Map<String, Any>))
          is List<*> -> pushArray(convertToReadableArray(item as List<Any>))
          null -> pushNull()
          else -> pushString(item.toString())
        }
      }
    }
  }

  fun convertToReadableMap(value: Map<String, Any>): ReadableMap {
    return Arguments.createMap().apply {
      value.forEach { (key, value) ->
        when (value) {
          is List<*> -> putArray(key, convertToReadableArray(value as List<Any>))
          is Map<*, *> -> putMap(key, convertToReadableMap(value as Map<String, Any>))
          null -> putNull(key)
          else -> putString(key, value.toString())
        }
      }
    }
  }

  fun convertToReadable(value: Any): Any {
    return when (value) {
      is List<*> -> convertToReadableArray(value as List<Any>)
      is Map<*, *> -> convertToReadableMap(value as Map<String, Any>)
      else -> value
    }
  }

  fun encrypt(value: Any, promise: Promise) {
    evervaultScope.launch {
      try {
        val encrypted = withContext(context = Dispatchers.IO) {
          Evervault.shared.encrypt(value)
        }
        val readable = convertToReadable(encrypted)
        promise.resolve(readable)
      } catch (e: Exception) {
        promise.reject("EncryptionError", "Failed to encrypt with the Evervault SDK: ${e.message}", e)
      }
    }
  }

  override fun encryptString(value: String, promise: Promise) {
    encrypt(value, promise)
  }

  override fun encryptNumber(value: Double, promise: Promise) {
    encrypt(value, promise)
  }

  override fun encryptBoolean(value: Boolean, promise: Promise) {
    encrypt(value, promise)
  }

  override fun encryptObject(value: ReadableMap, promise: Promise) {
    encrypt(value.toHashMap(), promise)
  }

  override fun encryptArray(value: ReadableArray, promise: Promise) {
    encrypt(value.toArrayList(), promise)
  }

  companion object {
    const val NAME = "NativeEvervault"
  }
}