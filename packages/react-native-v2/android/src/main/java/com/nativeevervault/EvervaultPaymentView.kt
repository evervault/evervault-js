import android.content.Context
import android.view.View
import androidx.activity.ComponentActivity
import androidx.compose.ui.platform.ComposeView
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext

import com.evervault.googlepay.EvervaultPayViewModel
import com.evervault.googlepay.EvervaultPayViewModelFactory
import com.evervault.googlepay.Config

class EvervaultPaymentView(context: Context) : ComposeView(context) {
    private var transaction: Transaction? = null
    private var viewModel: EvervaultPayViewModel? = null

    fun setTransactionFromMap(map: ReadableMap) {
        val country = map.getString("country") ?: "GB"
        val currency = map.getString("currency") ?: "GBP"
        val total = Amount(map.getString("total") ?: "0.00")

        val lineItemsArray = map.getArray("lineItems") ?: return
        val lineItems = mutableListOf<LineItem>()

        for (i in 0 until lineItemsArray.size()) {
            val item = lineItemsArray.getMap(i)
            val label = item.getString("label") ?: continue
            val amt = item.getString("amount") ?: continue
            lineItems.add(LineItem(label, Amount(amt)))
        }

        transaction = Transaction(
            country = country,
            currency = currency,
            total = total,
            lineItems = lineItems.toTypedArray()
        )

        setUpComposeView()
    }

    private fun setUpComposeView() {
        if (transaction == null) return
        val activity = context as? ComponentActivity ?: return

        if (viewModel == null) {
            viewModel = ViewModelProvider(
                activity,
                EvervaultPayViewModelFactory(
                    activity.application,
                    Config(
                        appId = "app_1234567890", // TODO: dynamic via prop
                        merchantId = "merchant_1234567890",
                        supportedNetworks = listOf(CardNetwork.VISA, CardNetwork.MASTERCARD)
                    )
                )
            )[EvervaultPayViewModel::class.java]
        }

        val tx = transaction!!
        val vm = viewModel!!

        setContent {
            EvervaultPaymentButton(
                modifier = Modifier.fillMaxWidth(),
                transaction = tx,
                model = vm,
                theme = EvervaultButtonTheme.Light,
                type = EvervaultButtonType.Order,
            )
        }
    }
}
