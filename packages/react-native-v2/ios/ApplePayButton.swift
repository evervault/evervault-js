import Foundation
import UIKit
import React
import EvervaultPayment
import PassKit

@objc public protocol ApplePayButtonDelegate: AnyObject {
  func applePayButton(_ button: ApplePayButton, didAuthorizePayment result: NSString)
  func applePayButton(_ button: ApplePayButton, didError result: NSString)
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
      switch network {
      case "visa":
        supportedNetworks.append(.visa)
      case "masterCard":
        supportedNetworks.append(.masterCard)
      case "amex":
        supportedNetworks.append(.amex)
      case "discover":
        supportedNetworks.append(.discover)
      default:
        continue
      }   
    }
    self.supportedNetworks = supportedNetworks
    setupPaymentView()
  }
  
  private var paymentType: PKPaymentButtonType = .plain
  @objc public func setPaymentType(_ inputPaymentType: String) {
    switch inputPaymentType {
    case "buy":
      self.paymentType = .buy
    case "addMoney":
      self.paymentType = .addMoney
    case "book":
      self.paymentType = .book
    case "checkout":
      self.paymentType = .checkout
    default:
      self.paymentType = .plain
    }
    setupPaymentView()
  }
  
  private var appearance: PKPaymentButtonStyle = .automatic
  @objc public func setAppearance(_ inputAppearance: String) {
    switch inputAppearance {
    case "white":
      self.appearance = .white
    case "whiteOutline":
      self.appearance = .whiteOutline
    case "black":
      self.appearance = .black
    default:
      self.appearance = .automatic
    }
    setupPaymentView()
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
          let transaction = try? Transaction.oneOffPayment(
            .init(
              country: "US",
              currency: "USD",
              paymentSummaryItems: [
                .init(label: "Product", amount: Amount("100.00")),
              ],
              shippingType: .shipping,
              shippingMethods: [],
              requiredShippingContactFields: [],
            )
          ) else {
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
      buttonStyle: appearance,
      buttonType: paymentType,
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
  public func evervaultPaymentView(_ view: EvervaultPaymentView, didAuthorizePayment result: ApplePayResponse?) {
      guard let data = try? JSONEncoder().encode(result),
            let response = NSString(data: data, encoding: NSUTF8StringEncoding) else {
          return
      }
      delegate?.applePayButton(self, didAuthorizePayment: response)
  }

  public func evervaultPaymentView(_ view: EvervaultPaymentView, didFinishWithResult result: Result<Void, EvervaultError>) {
      guard case .failure(let error) = result,
            let data = try? JSONEncoder().encode(error),
            let response = NSString(data: data, encoding: NSUTF8StringEncoding) else {
          return
      }
      delegate?.applePayButton(self, didError: response)
  }
}

extension EvervaultError: @retroactive Encodable {
    enum CodingKeys: String, CodingKey {
        case code
        case detail
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(String(describing: self), forKey: .code)
        try container.encode(localizedDescription, forKey: .detail)
    }
}
