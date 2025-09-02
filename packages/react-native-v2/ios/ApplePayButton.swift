import Foundation
import UIKit
import React
import EvervaultPayment
import PassKit

@objc public protocol ApplePayButtonDelegate: AnyObject {
  func applePayButton(_ button: ApplePayButton, didAuthorizePayment result: NSDictionary?)
  func applePayButton(_ button: ApplePayButton, didFinishWithSuccess success: Bool, code: NSString?, error: NSString?)
}

@objc public class ApplePayButton: UIView {    
  private var paymentView: EvervaultPaymentView?

  private var appId: String?
  @objc public func setAppId(_ appId: String) {
    self.appId = appId
    setupPaymentView()
  }
  
  private var merchantId: String?
  @objc public func setMerchantId(_ merchantId: String) {
    self.merchantId = merchantId
    setupPaymentView()
  }
  
  private var supportedNetworks: [PKPaymentNetwork] = []
  @objc public func setSupportedNetworks(_ inputSupportedNetworks: [String]) {
    var supportedNetworks = [PKPaymentNetwork]()
    for network in inputSupportedNetworks {
      supportedNetworks.append(PKPaymentNetwork(network))
    }
    self.supportedNetworks = supportedNetworks
    setupPaymentView()
  }
  
  private var buttonType: PKPaymentButtonType = .plain
  @objc public func setButtonType(_ inputButtonType: String) {
    switch inputButtonType {
    case "buy":
      self.buttonType = .buy
    case "addMoney":
      self.buttonType = .addMoney
    case "book":
      self.buttonType = .book
    case "checkout":
      self.buttonType = .checkout
    default:
      self.buttonType = .plain
    }
    setupPaymentView()
  }
  
  private var buttonStyle: PKPaymentButtonStyle = .automatic
  @objc public func setButtonStyle(_ inputButtonStyle: String) {
    switch inputButtonStyle {
    case "white":
      self.buttonStyle = .white
    case "whiteOutline":
      self.buttonStyle = .whiteOutline
    case "black":
      self.buttonStyle = .black
    default:
      self.buttonStyle = .automatic
    }
    setupPaymentView()
  }

  private var transaction: Transaction?
  @objc public func setTransaction(_ inputTransaction: NSDictionary) {
    guard let transaction = try? self.prepareTransaction(inputTransaction) else {
      return
    }
    self.transaction = transaction
    setupPaymentView()
  }

  private func prepareShippingType(_ inputShippingType: String?) -> ShippingType {
    switch inputShippingType {
    case "delivery":
      return .delivery
    case "storePickup":
      return .storePickup
    case "servicePickup":
      return .servicePickup
    default:
      return .shipping
    }
  }

  private func prepareDateComponents(_ inputDateComponents: NSDictionary) throws -> DateComponents {
    let year = inputDateComponents["year"] as! Int
    let month = inputDateComponents["month"] as! Int
    let day = inputDateComponents["day"] as! Int
    return DateComponents(year: year, month: month, day: day)
  }

  private func prepareShippingMethod(_ inputShippingMethod: NSDictionary) throws -> ShippingMethod {
    let label = inputShippingMethod["label"] as! String
    let amount = inputShippingMethod["amount"] as! String
    let shippingMethod = ShippingMethod(label: label, amount: NSDecimalNumber(string: amount))

    if let detail = inputShippingMethod["detail"] as? String {
      shippingMethod.detail = detail
    }
    if let identifier = inputShippingMethod["identifier"] as? String {
      shippingMethod.identifier = identifier
    }
    if let start = inputShippingMethod["start"] as? NSDictionary, let end = inputShippingMethod["end"] as? NSDictionary {
      let start = try self.prepareDateComponents(start)
      let end = try self.prepareDateComponents(end)
      shippingMethod.dateComponentsRange = PKDateComponentsRange(start: start, end: end)
    }

    return shippingMethod
  }

  private func prepareTransaction(_ inputTransaction: NSDictionary) throws -> Transaction {
    let type = inputTransaction["type"] as! String
    let country = inputTransaction["country"] as! String
    let currency = inputTransaction["currency"] as! String
    let paymentSummaryItems = (inputTransaction["paymentSummaryItems"] as! [NSDictionary]).map { (item) -> SummaryItem in
      return SummaryItem(label: item["label"] as! String, amount: Amount(item["amount"] as! String))
    }
    let shippingType = self.prepareShippingType(inputTransaction["shippingType"] as? String)
    let shippingMethods = try (inputTransaction["shippingMethods"] as! [NSDictionary]).map { (method) -> ShippingMethod in
      return try self.prepareShippingMethod(method)
    }
    let requiredShippingContactFields = (inputTransaction["requiredShippingContactFields"] as! [String]).map { (field) -> ContactField in
      return ContactField(rawValue: field)
    }

    switch type {
      default:
        let oneOffTransaction = try! OneOffPaymentTransaction(
          country: country,
          currency: currency,
          paymentSummaryItems: paymentSummaryItems,
          shippingType: shippingType,
          shippingMethods: shippingMethods,
          requiredShippingContactFields: Set(requiredShippingContactFields)
        )
        return Transaction.oneOffPayment(oneOffTransaction)
    }
  }
  
  // Delegate for handling events
  @objc public weak var delegate: ApplePayButtonDelegate?

  //initWithFrame to init view from code
  @objc override init(frame: CGRect) {
    super.init(frame: frame)
    setupView()
  }
  
  //initWithCode to init view from xib or storyboard
  @objc required init?(coder aDecoder: NSCoder) {
    super.init(coder: aDecoder)
    setupView()
  }

  private func setupView() {
    self.backgroundColor = .clear
  }

  private func setupPaymentView() {
    guard let appId = self.appId,
          let merchantId = self.merchantId,
          let transaction = self.transaction else {
      return
    }

    self.paymentView?.removeFromSuperview()
    self.paymentView?.delegate = nil
    self.paymentView = nil

    let paymentView = EvervaultPaymentView(
      appId: appId,
      appleMerchantId: merchantId,
      transaction: transaction,
      supportedNetworks: supportedNetworks,
      buttonStyle: buttonStyle,
      buttonType: buttonType,
    )

    paymentView.delegate = self
    self.addSubview(paymentView)

    paymentView.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      paymentView.topAnchor.constraint(equalTo: self.topAnchor),
      paymentView.leadingAnchor.constraint(equalTo: self.leadingAnchor),
      paymentView.trailingAnchor.constraint(equalTo: self.trailingAnchor),
      paymentView.bottomAnchor.constraint(equalTo: self.bottomAnchor),
    ])
    
    self.paymentView = paymentView
  }
}

extension ApplePayButton: EvervaultPaymentViewDelegate {
  public func evervaultPaymentView(_ view: EvervaultPayment.EvervaultPaymentView, didAuthorizePayment result: EvervaultPayment.ApplePayResponse?) {
    if let response = result.dictionary {
      delegate?.applePayButton(self, didAuthorizePayment: response as NSDictionary)
    }
  }

  public func evervaultPaymentView(_ view: EvervaultPayment.EvervaultPaymentView, didFinishWithResult result: Result<Void, EvervaultPayment.EvervaultError>) {
    switch result {
    case .success:
      delegate?.applePayButton(self, didFinishWithSuccess: true, code: nil, error: nil)
    case .failure(let error):
      print(error)
      delegate?.applePayButton(self, didFinishWithSuccess: false, code: String(describing: error) as NSString?, error: error.localizedDescription as NSString?)
    }
  }
}

