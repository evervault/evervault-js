import UIKit

@objc public class ApplePayButton: UIView {

  private var red: Int = 0
  private var green: Int = 0
  private var blue: Int = 0

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
    backgroundColor = UIColor.red
  }

  private func setColor() {
    backgroundColor = UIColor(red: CGFloat(red) / 255.0, green: CGFloat(green) / 255.0, blue: CGFloat(blue) / 255.0, alpha: 1.0)
  }

  @objc public func setRed(_ red: NSNumber) {
    self.red = red.intValue
    setColor()
  }

  @objc public func setGreen(_ green: NSNumber) {
    self.green = green.intValue
    setColor()
  }

  @objc public func setBlue(_ blue: NSNumber) {
    self.blue = blue.intValue
    setColor()
  }
}