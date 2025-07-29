import android.content.Context
import androidx.activity.ComponentActivity
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.setContent
import androidx.lifecycle.ViewModelProvider
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

import com.evervault.googlepay.EvervaultPayViewModel
import com.evervault.googlepay.EvervaultPayViewModelFactory
import com.evervault.googlepay.Config
import com.evervault.googlepay.Transaction
import com.evervault.googlepay.Amount
import com.evervault.googlepay.LineItem
import com.evervault.googlepay.CardNetwork
import com.evervault.googlepay.EvervaultPaymentButton
import com.evervault.googlepay.EvervaultButtonTheme
import com.evervault.googlepay.EvervaultButtonType

class EvervaultPaymentView(context: ThemedReactContext) : ComposeView(context) {
    private var viewModel: EvervaultPayViewModel? = null
    private var config: Config? = null
    private var transaction: Transaction? = null
    private var buttonType: EvervaultButtonType = EvervaultButtonType.PAY
    private var buttonTheme: EvervaultButtonTheme = EvervaultButtonTheme.BLACK
    private var borderRadius: Int = 4
    private var allowedAuthMethods: List<String> = listOf("PAN_ONLY", "CRYPTOGRAM_3DS")
    private var allowedCardNetworks: List<CardNetwork> = listOf(CardNetwork.VISA, CardNetwork.MASTERCARD)

    init {
        setupComposeView()
    }

    private fun setupComposeView() {
        setContent {
            // Only render the button if we have the required configuration
            if (viewModel != null && transaction != null) {
                EvervaultPaymentButton(
                    viewModel = viewModel!!,
                    transaction = transaction!!,
                    type = buttonType,
                    theme = buttonTheme,
                    borderRadius = borderRadius,
                    allowedAuthMethods = allowedAuthMethods,
                    allowedCardNetworks = allowedCardNetworks,
                    modifier = Modifier.fillMaxWidth(),
                    onSuccess = { 
                        sendEvent("success", null)
                    },
                    onError = { error ->
                        val params = Arguments.createMap().apply {
                            putString("error", error)
                        }
                        sendEvent("error", params)
                    },
                    onCancel = {
                        sendEvent("cancel", null)
                    }
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
        
        if (appId != null && merchantId != null) {
            config = Config(
                appId = appId,
                merchantId = merchantId
            )
            
            // Create the ViewModel with the new config
            createViewModel()
        }
    }

    fun setTransactionFromMap(transactionMap: ReadableMap) {
        val amount = transactionMap.getDouble("amount")
        val currency = transactionMap.getString("currency") ?: "USD"
        val country = transactionMap.getString("country") ?: "US"
        val merchantId = transactionMap.getString("merchantId")
        
        if (merchantId != null) {
            val lineItems = mutableListOf<LineItem>()
            
            // Parse line items if present
            if (transactionMap.hasKey("lineItems")) {
                val lineItemsArray = transactionMap.getArray("lineItems")
                for (i in 0 until lineItemsArray.size()) {
                    val item = lineItemsArray.getMap(i)
                    val itemAmount = item.getDouble("amount")
                    val itemLabel = item.getString("label") ?: ""
                    val itemQuantity = item.getInt("quantity")
                    
                    lineItems.add(
                        LineItem(
                            amount = Amount(itemAmount),
                            label = itemLabel,
                            quantity = itemQuantity
                        )
                    )
                }
            }
            
            transaction = Transaction(
                amount = Amount(amount),
                currency = currency,
                country = country,
                merchantId = merchantId,
                lineItems = lineItems
            )
            
            // Update the compose view
            setupComposeView()
        }
    }

    fun setButtonType(type: String) {
        buttonType = when (type.uppercase()) {
            "PLAIN" -> EvervaultButtonType.PLAIN
            "BOOK" -> EvervaultButtonType.BOOK
            "BUY" -> EvervaultButtonType.BUY
            "CHECKOUT" -> EvervaultButtonType.CHECKOUT
            "ORDER" -> EvervaultButtonType.ORDER
            "SUBSCRIBE" -> EvervaultButtonType.SUBSCRIBE
            "PAY" -> EvervaultButtonType.PAY
            else -> EvervaultButtonType.PAY
        }
        setupComposeView()
    }

    fun setButtonTheme(theme: String) {
        buttonTheme = when (theme.uppercase()) {
            "WHITE" -> EvervaultButtonTheme.WHITE
            "BLACK" -> EvervaultButtonTheme.BLACK
            else -> EvervaultButtonTheme.BLACK
        }
        setupComposeView()
    }

    fun setBorderRadius(radius: Int) {
        borderRadius = radius
        setupComposeView()
    }

    fun setAllowedAuthMethods(methods: List<String>) {
        allowedAuthMethods = methods
        setupComposeView()
    }

    fun setAllowedCardNetworks(networks: List<String>) {
        allowedCardNetworks = networks.map { network ->
            when (network.uppercase()) {
                "VISA" -> CardNetwork.VISA
                "MASTERCARD" -> CardNetwork.MASTERCARD
                "AMEX" -> CardNetwork.AMEX
                "DISCOVER" -> CardNetwork.DISCOVER
                "JCB" -> CardNetwork.JCB
                "INTERAC" -> CardNetwork.INTERAC
                else -> CardNetwork.VISA
            }
        }
        setupComposeView()
    }

    private fun createViewModel() {
        if (config != null) {
            val activity = context.currentActivity as? ComponentActivity
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

