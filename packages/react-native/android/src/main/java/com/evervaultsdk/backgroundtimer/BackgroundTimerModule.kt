package com.evervaultsdk.backgroundtimer

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit

class BackgroundTimerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val scheduler = Executors.newScheduledThreadPool(1)
    private var intervalTask: ScheduledFuture<*>? = null
    private var executionCount = 0

    override fun getName(): String {
        return "BackgroundTimer"
    }

    private fun sendEvent(eventName: String, params: Any?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun startBackgroundTimer(delay: Int) {
        println("[FROM KOTLIN] Background Timer start requested with delay: $delay ms, current time: ${System.currentTimeMillis()}")
        
        // stopBackgroundTimer() // Stop any existing timer

        val tick = Runnable {
            executionCount++
            println("[FROM KOTLIN] Executing tick #$executionCount, current time: ${System.currentTimeMillis()}")
            try {
                sendEvent("backgroundTimer", null)
                println("[FROM KOTLIN] Event sent successfully for tick #$executionCount, current time: ${System.currentTimeMillis()}")
            } catch (e: Exception) {
                println("[FROM KOTLIN] Error sending event for tick #$executionCount: ${e.message}, current time: ${System.currentTimeMillis()}")
            }
        }

        intervalTask = scheduler.scheduleAtFixedRate(tick, 0, delay.toLong(), TimeUnit.MILLISECONDS)
        println("[FROM KOTLIN] Timer scheduled with delay $delay ms, current time: ${System.currentTimeMillis()}")
    }

    @ReactMethod
    fun stopBackgroundTimer() {
        println("[FROM KOTLIN] Stopping background timer, current time: ${System.currentTimeMillis()}")
        // intervalTask?.cancel(true)
        // intervalTask = null
        // executionCount = 0
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // This method is required to satisfy the warning, but we don't need to implement anything here
        // as we're using a single event that's managed by the module itself
        println("[FROM KOTLIN] removeListeners called with count: $count")
    }

    override fun onCatalystInstanceDestroy() {
        println("[FROM KOTLIN] Catalyst instance being destroyed, current time: ${System.currentTimeMillis()}")
        stopBackgroundTimer()
        scheduler.shutdownNow()
        super.onCatalystInstanceDestroy()
    }
}