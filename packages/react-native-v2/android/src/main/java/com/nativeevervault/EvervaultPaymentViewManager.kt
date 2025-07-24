package com.nativeevervault;

import com.facebook.react.viewmanagers.EvervaultPaymentViewManagerInterface
import com.facebook.react.viewmanagers.EvervaultPaymentViewManagerDelegate
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.viewmanagers.EvervaultPaymentViewManagerInterface.Transaction
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.EvervaultPaymentViewManagerDelegate
import com.facebook.react.fabric.FabricViewManager

class EvervaultPaymentViewManager :
    FabricViewManager<EvervaultPaymentView>(),
    EvervaultPaymentViewManagerInterface<EvervaultPaymentView> {

    private val delegate: ViewManagerDelegate<EvervaultPaymentView> =
        EvervaultPaymentViewManagerDelegate(this)

    override fun getDelegate(): ViewManagerDelegate<EvervaultPaymentView> = delegate

    override fun getName(): String = "EvervaultPaymentView"

    override fun createViewInstance(context: ThemedReactContext): EvervaultPaymentView {
        return EvervaultPaymentView(context)
    }

    override fun setTransaction(view: EvervaultPaymentView, value: ReadableMap?) {
        if (value != null) {
            view.setTransactionFromMap(value)
        }
    }
}
