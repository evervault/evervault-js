package com.nativeevervault

import android.content.Context
import androidx.activity.ComponentActivity
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.lifecycle.ViewModelProvider
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.views.view.ReactViewGroup
import com.google.gson.Gson

import com.evervault.googlepay.EvervaultPayViewModel
import com.evervault.googlepay.EvervaultPayViewModelFactory
import com.evervault.googlepay.Config
import com.evervault.googlepay.Transaction
import com.evervault.googlepay.Amount
import com.evervault.googlepay.LineItem
import com.evervault.googlepay.CardAuthMethod
import com.evervault.googlepay.CardNetwork
import com.evervault.googlepay.EvervaultPaymentButton
import com.evervault.googlepay.EvervaultButtonTheme
import com.evervault.googlepay.EvervaultButtonType
import com.evervault.googlepay.EvervaultConstants

class EvervaultPaymentView(context: ThemedReactContext) : ReactViewGroup(context) {
    private var viewModel: EvervaultPayViewModel? = null
    private var config: Config? = null
    private var transaction: Transaction? = null
    private var buttonType: EvervaultButtonType = EvervaultButtonType.Pay
    private var buttonTheme: EvervaultButtonTheme = EvervaultButtonTheme.Dark
    private val composeView: ComposeView = ComposeView(context)

    init {
        addView(composeView)
        setupComposeView()
    }

    private fun setupComposeView() {
        composeView.setContent {
            // Only render the button if we have the required configuration
            if (transaction != null && viewModel != null) {
                EvervaultPaymentButton(
                    modifier = Modifier.fillMaxWidth(),
                    paymentRequest = transaction!!,
                    model = viewModel!!,
                    type = buttonType,
                    theme = buttonTheme
                )
            }
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        val reactContext = context as ReactContext
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("EvervaultPaymentView:$eventName", params)
    }

    fun setConfig(configMap: ReadableMap) {
        val appId = configMap.getString("appId")
        val merchantId = configMap.getString("merchantId")
        val supportedNetworks = Gson().fromJson(configMap.getString("supportedNetworks"), Array<String>::class.java)
            .toList()
            .map { cardNetworkFromString(it) }
        val supportedMethods = Gson().fromJson(configMap.getString("supportedMethods"), Array<String>::class.java)
            .toList()
            .map { authMethodFromString(it) }
        val buttonType = configMap.getString("buttonType")?.let { buttonTypeFromString(it) }
        val buttonTheme = configMap.getString("buttonTheme")?.let { buttonThemeFromString(it) }
        
        if (appId != null && merchantId != null && supportedMethods != null && supportedNetworks != null) {
            config = Config(
                appId = appId,
                merchantId = merchantId,
                supportedNetworks = supportedNetworks,
                supportedMethods = supportedMethods
            )
            this.buttonType = buttonType ?: EvervaultButtonType.Pay
            this.buttonTheme = buttonTheme ?: EvervaultButtonTheme.Dark

            // Create the ViewModel with the new config
            createViewModel()
        }
    }

    fun setTransactionFromMap(transactionMap: ReadableMap) {
        // TODO: Total is an amount object, not a string.
        val total = transactionMap.getString("total") ?: return
        val currency = transactionMap.getString("currency") ?: return
        val country = transactionMap.getString("country") ?: return
        
        val lineItems = mutableListOf<LineItem>()
        
        // Parse line items if present
        if (transactionMap.hasKey("lineItems")) {
            val lineItemsArray = transactionMap.getArray("lineItems")
            for (i in 0 until (lineItemsArray?.size() ?: 0)) {
                val item = lineItemsArray?.getMap(i) ?: continue
                val itemAmount = item.getString("amount") ?: continue
                val itemLabel = item.getString("label") ?: continue

                lineItems.add(
                    LineItem(
                        label = itemLabel,
                        amount = Amount(itemAmount)
                    )
                )
            }
        }
        
        transaction = Transaction(
            country = country,
            currency = currency,
            total = Amount(total),
            lineItems = lineItems.toTypedArray()
        )
        
        // Update the compose view
        setupComposeView()
    }

    fun setButtonType(type: String) {
        buttonType = when (type.uppercase()) {
            "PLAIN" -> EvervaultButtonType.Plain
            "BOOK" -> EvervaultButtonType.Book
            "BUY" -> EvervaultButtonType.Buy
            "CHECKOUT" -> EvervaultButtonType.Checkout
            "ORDER" -> EvervaultButtonType.Order
            "SUBSCRIBE" -> EvervaultButtonType.Subscribe
            "PAY" -> EvervaultButtonType.Pay
            else -> EvervaultButtonType.Pay
        }
        setupComposeView()
    }

    fun setButtonTheme(theme: String) {
        buttonTheme = when (theme.uppercase()) {
            "LIGHT" -> EvervaultButtonTheme.Light
            "DARK" -> EvervaultButtonTheme.Dark
            else -> EvervaultButtonTheme.Dark
        }
        setupComposeView()
    }

    private fun authMethodFromString(method: String): CardAuthMethod {
        return when (method.uppercase()) {
            "PAN_ONLY" -> CardAuthMethod.PAN_ONLY
            "CRYPTOGRAM_3DS" -> CardAuthMethod.CRYPTOGRAM_3DS
            else -> CardAuthMethod.PAN_ONLY
        }
    }

    private fun cardNetworkFromString(network: String): CardNetwork {
        return when (network.uppercase()) {
            "VISA" -> CardNetwork.VISA
            "MASTERCARD" -> CardNetwork.MASTERCARD
            "AMEX" -> CardNetwork.AMEX
            "DISCOVER" -> CardNetwork.DISCOVER
            "JCB" -> CardNetwork.JCB
            else -> CardNetwork.VISA
        }
    }

    private fun createViewModel() {
        if (config != null) {
            val activity = (context as? ReactContext)?.currentActivity as? ComponentActivity
            if (activity != null) {
                val factory = EvervaultPayViewModelFactory(activity.application, config!!)
                viewModel = ViewModelProvider(activity, factory)[EvervaultPayViewModel::class.java]
                viewModel?.start()
                setupComposeView()
            }
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        viewModel?.let { vm ->
            // Clean up the ViewModel if needed
        }
    }
}
