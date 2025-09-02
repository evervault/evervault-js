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
  private var merchantId: String?
  private var supportedNetworks: [PKPaymentNetwork] = []
  private var buttonType: PKPaymentButtonType = .plain
  private var buttonStyle: PKPaymentButtonStyle = .automatic

  @objc public func setAppId(_ appId: String) {
    self.appId = appId
    setupPaymentView()
  }
  
  @objc public func setMerchantId(_ merchantId: String) {
    self.merchantId = merchantId
    setupPaymentView()
  }
  
  @objc public func setSupportedNetworks(_ inputSupportedNetworks: [String]) {
    var supportedNetworks = [PKPaymentNetwork]()
    for network in inputSupportedNetworks {
      supportedNetworks.append(PKPaymentNetwork(network))
    }
    self.supportedNetworks = supportedNetworks
    setupPaymentView()
  }
  
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

  // private var red: Int = 0
  // private var green: Int = 0
  // private var blue: Int = 0
  
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
          let merchantId = self.merchantId else {
      return
    }

    self.paymentView?.removeFromSuperview()
    self.paymentView?.delegate = nil
    self.paymentView = nil

    guard let transaction = try? OneOffPaymentTransaction(
      country: "US", 
      currency: "USD",
      paymentSummaryItems: [
        SummaryItem(label: "Test", amount: Amount("100")),
      ]
    ) else {
      return
    }

    let paymentView = EvervaultPaymentView(
      appId: appId,
      appleMerchantId: merchantId,
      transaction: Transaction.oneOffPayment(transaction),
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

