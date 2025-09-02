import Foundation
import UIKit
import React
import EvervaultPayment
import PassKit

@objc public protocol ApplePayButtonDelegate: AnyObject {
    func applePayButton(_ button: ApplePayButton, didChangeRedValue red: Int)
}

@objc public class ApplePayButton: UIView {
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
    
    print("appId: \(appId), merchantId: \(merchantId), supportedNetworks: \(supportedNetworks), buttonType: \(buttonType), buttonStyle: \(buttonStyle)")
  }

  // private func setColor() {
  //   backgroundColor = UIColor(red: CGFloat(red) / 255.0, green: CGFloat(green) / 255.0, blue: CGFloat(blue) / 255.0, alpha: 1.0)
  // }

  // @objc public func setRed(_ red: NSNumber) {
  //   self.red = red.intValue
  //   setColor()
    
  //   // Notify delegate of red change
  //   delegate?.applePayButton(self, didChangeRedValue: red.intValue)
  // }

  // @objc public func setGreen(_ green: NSNumber) {
  //   self.green = green.intValue
  //   setColor()
  // }

  // @objc public func setBlue(_ blue: NSNumber) {
  //   self.blue = blue.intValue
  //   setColor()
  // }
}