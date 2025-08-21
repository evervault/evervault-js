import Foundation
import React
import EvervaultPayment
import PassKit

@objc(ApplePayButton)
class ApplePayButton: RCTViewManager {
    
    override func view() -> UIView! {
        return EvervaultPaymentViewWrapper()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc func setConfig(_ view: EvervaultPaymentViewWrapper, config: NSDictionary) {
        view.setConfig(config)
    }
    
    @objc func setTransaction(_ view: EvervaultPaymentViewWrapper, transaction: NSDictionary) {
        view.setTransaction(transaction)
    }
}
