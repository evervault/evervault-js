import Foundation
import UIKit
import React
import EvervaultPayment
import PassKit

@objc public protocol ApplePayButtonDelegate: AnyObject {
    func applePayButton(_ button: ApplePayButton, didChangeRedValue red: Int)
}

@objc public class ApplePayButton: UIView {
  private var config: [String: Any]?
  @objc public func setConfig(_ config: [String: Any]) {
    self.config = config
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
    guard let config = self.config,
          let appId = config["appId"] as? String,
          let merchantId = config["merchantId"] as? String,
          let supportedNetworks = config["supportedNetworks"] as? [String],
          let buttonType = config["buttonType"] as? String,
          let buttonStyle = config["buttonStyle"] as? String else {
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