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

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }
    
    private func setupView() {
        self.backgroundColor = .clear
    }
    
    private func createPaymentView() {
        guard let config = self.config,
              let transaction = self.transaction,
              let appId = config["appId"] as? String,
              let merchantId = config["merchantId"] as? String,
              let supportedNetworks = config["supportedNetworks"] as? String,
              let buttonType = config["buttonType"] as? String,
              let buttonStyle = config["buttonStyle"] as? String else {
            return
        }

        let buttonType = self.parseButtonType(buttonType)
        let buttonStyle = self.parseButtonStyle(buttonStyle)
        
        // Parse transaction
        guard let transactionObj = self.parseTransaction(transaction) else {
            return
        }

        // Remove the payment view if it exists
        self.paymentView?.removeFromSuperview()
        self.paymentView?.delegate = nil
        self.paymentView = nil

        // Create the payment view
        let paymentView = EvervaultPaymentView(
            appId: appId,
            appleMerchantId: merchantId,
            transaction: transactionObj,
            supportedNetworks: self.parseAllowedCardNetworks(supportedNetworks),
            buttonStyle: buttonStyle,
            buttonType: buttonType
        )
        
        paymentView.delegate = self
        
        // Add to view hierarchy
        self.addSubview(paymentView)
        paymentView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            paymentView.topAnchor.constraint(equalTo: self.topAnchor),
            paymentView.leadingAnchor.constraint(equalTo: self.leadingAnchor),
            paymentView.trailingAnchor.constraint(equalTo: self.trailingAnchor),
            paymentView.bottomAnchor.constraint(equalTo: self.bottomAnchor)
        ])

        self.paymentView = paymentView
    }
    
    private func parseTransaction(_ transactionDict: [String: Any]) -> Transaction? {
        // TODO: Use swift native JSON deserialization on transactionDict
        guard let currency = transactionDict["currency"] as? String,
              let country = transactionDict["country"] as? String else {
            return nil
        }
        
        // Parse line items
        var lineItems: [SummaryItem] = []
        if let lineItemsArray = transactionDict["paymentSummaryItems"] as? [[String: Any]] {
            for item in lineItemsArray {
                // TODO: This is an amount object, not a string.
                if let amount = item["amount"] as? String, let label = item["label"] as? String {
                    lineItems.append(SummaryItem(
                        label: label,
                        amount: Amount(amount)
                    ))
                }
            }
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
    
    @objc
    func setConfig(_ configDict: NSDictionary) {
        self.config = configDict as? [String: Any]
        self.createPaymentView()
    }
    
    @objc
    func setTransaction(_ transactionDict: NSDictionary) {
        self.transaction = transactionDict as? [String: Any]
        self.createPaymentView()
    }
    
    private func parseAllowedCardNetworks(_ networksJson: String) -> [Network] {
//        if let data = networksJson.data(using: String.Encoding.utf8.rawValue),
//           let networks = try? JSONSerialization.jsonObject(with: data, options: []) as? [String] {
//            return allowedCardNetworks = networks.compactMap { network in
//                parseCardNetwork(network)
//            }
//        }
        // Fallback to default networks if JSON parsing fails
        return [.visa, .masterCard]
    }
    
    private func parseButtonType(_ type: String) -> ButtonType {
        switch type.uppercased() {
        case "plain": return .plain
        case "buy": return .buy
        case "in_store": return .inStore
        case "donate": return .donate
        case "checkout": return .checkout
        case "book": return .book
        case "subscribe": return .subscribe
        case "reload": return .reload
        case "add_money": return .addMoney
        case "top_up": return .topUp
        case "order": return .order
        case "rent": return .rent
        case "support": return .support
        case "contribute": return .contribute
        case "tip": return .tip
        case "continue": return .continue
        default: return .buy
        }
    }
    
    private func parseButtonStyle(_ style: String) -> ButtonStyle {
        switch style.uppercased() {
        case "white": return .white
        case "white_outline": return .whiteOutline
        case "black": return .black
        case "automatic": return .automatic
        default: return .automatic
        }
    }
    
    private func parseCardNetwork(_ network: String) -> Network? {
        switch network.uppercased() {
        case "visa": return .visa
        case "mastercard": return .masterCard
        case "amex": return .amex
        case "discover": return .discover
        case "jcb": return .JCB
        default: return nil
        }
    }
}

extension EvervaultPaymentViewWrapper: EvervaultPaymentViewDelegate {
    func evervaultPaymentView(_ view: EvervaultPaymentView, didAuthorizePayment result: ApplePayResponse?) {
        guard let result = result else {
            return
        }

        let responseData: [String: Any] = [
            "networkToken": [
                "number": result.networkToken.number ?? "",
                "expiry": [
                    "month": result.networkToken.expiry.month ?? "",
                    "year": result.networkToken.expiry.year ?? ""
                ],
                "rawExpiry": result.networkToken.rawExpiry ?? "",
                "tokenServiceProvider": result.networkToken.tokenServiceProvider ?? ""
            ],
            "card": [
                "brand": result.card.brand ?? "",
                "funding": result.card.funding ?? "",
                "segment": result.card.segment ?? "",
                "country": result.card.country ?? "",
                "currency": result.card.currency ?? "",
                "issuer": result.card.issuer ?? ""
            ],
            "cryptogram": result.cryptogram ?? "",
            "eci": result.eci ?? "",
            "paymentDataType": result.paymentDataType ?? "",
            "deviceManufacturerIdentifier": result.deviceManufacturerIdentifier ?? ""
        ]

//        self.bridge.sendEvent("didAuthorizePayment", params: responseData)
    }
    
    func evervaultPaymentView(_ view: EvervaultPaymentView, didFinishWithResult result: Result<Void, EvervaultError>) {
//        switch result {
//        case .success:
//            sendEvent("didFinishWithResult", params: ["success": true])
//        case .failure(let error):
//            sendEvent("didFinishWithResult", params: [
//                "success": false,
//                "error": error.localizedDescription
//            ])
//        }
    }
    
    func evervaultPaymentView(_ view: EvervaultPaymentView, prepareTransaction transaction: inout Transaction) {
        // Allow React Native to modify the transaction if needed
//        sendEvent("prepareTransaction")
    }
    
    func evervaultPaymentView(_ view: EvervaultPaymentView, didSelectShippingContact contact: PKContact) async -> PKPaymentRequestShippingContactUpdate? {
        // For now, return nil to use default behavior
        return nil
    }
    
    func evervaultPaymentView(_ view: EvervaultPaymentView, didUpdatePaymentMethod paymentMethod: PKPaymentMethod) async -> PKPaymentRequestPaymentMethodUpdate? {
        // For now, return nil to use default behavior
        return nil
    }
}
