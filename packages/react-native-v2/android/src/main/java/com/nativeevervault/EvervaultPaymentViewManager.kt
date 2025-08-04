package com.nativeevervault

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.nativeevervault.EvervaultPaymentView

class EvervaultPaymentViewManager : SimpleViewManager<EvervaultPaymentView>() {

    override fun getName(): String = "EvervaultPaymentView"

    override fun createViewInstance(context: ThemedReactContext): EvervaultPaymentView {
        return EvervaultPaymentView(context)
    }

    @ReactProp(name = "config")
    fun setConfig(view: EvervaultPaymentView, value: ReadableMap?) {
        if (value != null) {
            view.setConfig(value)
        }
    }

    @ReactProp(name = "transaction")
    fun setTransaction(view: EvervaultPaymentView, value: ReadableMap?) {
        if (value != null) {
            view.setTransactionFromMap(value)
        }
    }

    @ReactProp(name = "buttonType")
    fun setButtonType(view: EvervaultPaymentView, value: String?) {
        if (value != null) {
            view.setButtonType(value)
        }
    }

    @ReactProp(name = "buttonTheme")
    fun setButtonTheme(view: EvervaultPaymentView, value: String?) {
        if (value != null) {
            view.setButtonTheme(value)
        }
    }

    @ReactProp(name = "borderRadius")
    fun setBorderRadius(view: EvervaultPaymentView, value: Int) {
        view.setBorderRadius(value)
    }

    @ReactProp(name = "allowedCardNetworks")
    fun setAllowedCardNetworks(view: EvervaultPaymentView, value: String?) {
        if (value != null) {
            try {
                val networks = mutableListOf<String>()
                val jsonArray = org.json.JSONArray(value)
                for (i in 0 until jsonArray.length()) {
                    networks.add(jsonArray.getString(i))
                }
                view.setAllowedCardNetworks(networks)
            } catch (e: Exception) {
                // Fallback to default networks if JSON parsing fails
                view.setAllowedCardNetworks(listOf("VISA", "MASTERCARD"))
            }
        }
    }
}
