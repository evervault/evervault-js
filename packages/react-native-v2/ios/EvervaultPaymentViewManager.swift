import Foundation
import React
import EvervaultPayment
import PassKit

@objc(EvervaultPaymentViewManager)
class EvervaultPaymentViewManager: RCTViewManager {
    
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
    
    @objc func setButtonType(_ view: EvervaultPaymentViewWrapper, buttonType: NSString) {
        view.setButtonType(buttonType)
    }
    
    @objc func setButtonTheme(_ view: EvervaultPaymentViewWrapper, buttonTheme: NSString) {
        view.setButtonTheme(buttonTheme)
    }
    
    @objc func setBorderRadius(_ view: EvervaultPaymentViewWrapper, borderRadius: NSNumber) {
        view.setBorderRadius(borderRadius)
    }
    
    @objc func setAllowedCardNetworks(_ view: EvervaultPaymentViewWrapper, networks: NSArray) {
        view.setAllowedCardNetworks(networks)
    }
} 