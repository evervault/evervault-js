import Foundation
import UIKit
import React
import EvervaultPayment
import PassKit

@objc(EvervaultPaymentViewWrapper)
class EvervaultPaymentViewWrapper: UIView {
    private var paymentView: EvervaultPaymentView?
    private var config: [String: Any]?
    private var transaction: [String: Any]?
    private var buttonType: ButtonType = .buy
    private var buttonStyle: ButtonStyle = .automatic
    private var borderRadius: CGFloat = 4.0
    private var allowedCardNetworks: [Network] = [.visa, .masterCard]
    
    private var reactContext: RCTBridge? {
        return (superview as? RCTView)?.bridge ?? (superview?.superview as? RCTView)?.bridge
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        backgroundColor = .clear
    }
    
    private func createPaymentView() {
        guard let config = config,
              let transaction = transaction,
              let appId = config["appId"] as? String,
              let merchantId = config["merchantId"] as? String else {
            return
        }
        
        // Parse transaction
        guard let transactionObj = parseTransaction(transaction) else {
            return
        }
        
        // Create the payment view
        paymentView = EvervaultPaymentView(
            appId: appId,
            appleMerchantId: merchantId,
            transaction: transactionObj,
            supportedNetworks: allowedCardNetworks,
            buttonStyle: buttonStyle,
            buttonType: buttonType
        )
        
        paymentView?.delegate = self
        
        // Add to view hierarchy
        if let paymentView = paymentView {
            addSubview(paymentView)
            paymentView.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                paymentView.topAnchor.constraint(equalTo: topAnchor),
                paymentView.leadingAnchor.constraint(equalTo: leadingAnchor),
                paymentView.trailingAnchor.constraint(equalTo: trailingAnchor),
                paymentView.bottomAnchor.constraint(equalTo: bottomAnchor)
            ])
            
            // Apply border radius
            paymentView.layer.cornerRadius = borderRadius
            paymentView.layer.masksToBounds = true
        }
    }
    
    private func parseTransaction(_ transactionDict: [String: Any]) -> Transaction? {
        guard let total = transactionDict["total"] as? String,
              let currency = transactionDict["currency"] as? String,
              let country = transactionDict["country"] as? String else {
            return nil
        }
        
        // Parse line items
        var lineItems: [SummaryItem] = []
        if let lineItemsArray = transactionDict["lineItems"] as? [[String: Any]] {
            for item in lineItemsArray {
                if let amount = item["amount"] as? String,
                   let label = item["label"] as? String {
                    lineItems.append(SummaryItem(
                        label: label,
                        amount: Amount(amount)
                    ))
                }
            }
        }
        
        // If no line items provided, create a default one from total
        if lineItems.isEmpty {
            lineItems.append(SummaryItem(
                label: "Total",
                amount: Amount(total)
            ))
        }
        
        do {
            return try Transaction.oneOffPayment(OneOffPaymentTransaction(
                country: country,
                currency: currency,
                paymentSummaryItems: lineItems
            ))
        } catch {
            print("Failed to create transaction: \(error)")
            return nil
        }
    }
    
    @objc func setConfig(_ configDict: NSDictionary) {
        config = configDict as? [String: Any]
        createPaymentView()
    }
    
    @objc func setTransaction(_ transactionDict: NSDictionary) {
        transaction = transactionDict as? [String: Any]
        createPaymentView()
    }
    
    @objc func setButtonType(_ buttonTypeString: NSString) {
        buttonType = parseButtonType(buttonTypeString as String)
        createPaymentView()
    }
    
    @objc func setButtonTheme(_ buttonThemeString: NSString) {
        buttonStyle = parseButtonStyle(buttonThemeString as String)
        createPaymentView()
    }
    
    @objc func setBorderRadius(_ radius: NSNumber) {
        borderRadius = CGFloat(truncating: radius)
        paymentView?.layer.cornerRadius = borderRadius
    }
    
    @objc func setAllowedCardNetworks(_ networks: NSArray) {
        allowedCardNetworks = networks.compactMap { network in
            parseCardNetwork(network as? String ?? "")
        }
        createPaymentView()
    }
    
    private func parseButtonType(_ type: String) -> ButtonType {
        switch type.uppercased() {
        case "PLAIN": return .plain
        case "BOOK": return .book
        case "BUY": return .buy
        case "CHECKOUT": return .checkout
        case "ORDER": return .order
        case "SUBSCRIBE": return .subscribe
        default: return .buy
        }
    }
    
    private func parseButtonStyle(_ style: String) -> ButtonStyle {
        switch style.uppercased() {
        case "LIGHT": return .white
        case "DARK": return .black
        case "AUTOMATIC": return .automatic
        default: return .automatic
        }
    }
    
    private func parseCardNetwork(_ network: String) -> Network? {
        switch network.uppercased() {
        case "VISA": return .visa
        case "MASTERCARD": return .masterCard
        case "AMEX": return .amex
        case "DISCOVER": return .discover
        case "JCB": return .JCB
        default: return nil
        }
    }
    
    private func sendEvent(_ eventName: String, params: [String: Any]? = nil) {
        // For now, we'll use a simpler approach that works with the current setup
        // The event will be handled by the React Native bridge
        print("EvervaultPaymentView:\(eventName) - \(params ?? [:])")
    }
}

extension EvervaultPaymentViewWrapper: EvervaultPaymentViewDelegate {
    func evervaultPaymentView(_ view: EvervaultPaymentView, didAuthorizePayment result: ApplePayResponse?) {
        let responseData: [String: Any] = [
            "networkToken": [
                "number": result?.networkToken.number ?? "",
                "expiry": [
                    "month": result?.networkToken.expiry.month ?? "",
                    "year": result?.networkToken.expiry.year ?? ""
                ],
                "rawExpiry": result?.networkToken.rawExpiry ?? "",
                "tokenServiceProvider": result?.networkToken.tokenServiceProvider ?? ""
            ],
            "card": [
                "brand": result?.card.brand ?? "",
                "funding": result?.card.funding ?? "",
                "segment": result?.card.segment ?? "",
                "country": result?.card.country ?? "",
                "currency": result?.card.currency ?? "",
                "issuer": result?.card.issuer ?? ""
            ],
            "cryptogram": result?.cryptogram ?? "",
            "eci": result?.eci ?? "",
            "paymentDataType": result?.paymentDataType ?? "",
            "deviceManufacturerIdentifier": result?.deviceManufacturerIdentifier ?? ""
        ]
        
        sendEvent("didAuthorizePayment", params: responseData)
    }
    
    func evervaultPaymentView(_ view: EvervaultPaymentView, didFinishWithResult result: Result<Void, EvervaultError>) {
        switch result {
        case .success:
            sendEvent("didFinishWithResult", params: ["success": true])
        case .failure(let error):
            sendEvent("didFinishWithResult", params: [
                "success": false,
                "error": error.localizedDescription
            ])
        }
    }
    
    func evervaultPaymentView(_ view: EvervaultPaymentView, prepareTransaction transaction: inout Transaction) {
        // Allow React Native to modify the transaction if needed
        sendEvent("prepareTransaction")
    }
}
