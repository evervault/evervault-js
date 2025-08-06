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
}
