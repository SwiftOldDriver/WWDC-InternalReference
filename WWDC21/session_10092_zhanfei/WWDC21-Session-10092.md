---

title: "WWDC21 - 了解并使用 Wallet 和 Apple Pay"
date: 2021-06-20T00:00:00+00:00
draft: false
tags: [iOS', WWDC21', 'Swift']
categories: ['iOS', 'WWDC', 'Swift']
author: "展菲"
---

![](https://images.xiaozhuanlan.com/photo/2021/d6807df7fda476b96a49545f680de2d6.png)

> WWDC21 Session 10092 - [What's new in Wallet and Apple Pay](https://developer.apple.com/videos/play/wwdc2021/10092/ "What's new in Wallet and Apple Pay")

## 目录

	1.回顾 WWDC 2021  
      1.1 Wallet 更新
      1.2 更新 JavaScript Apple Pay 按钮
      1.3 优化支付流程
      1.4 API 更新
      1.5 增加优惠券 codes
	2.应用场景
      2.1 刷公交
          2.1.1 使用教程
          2.1.2 适用城市和地点
          2.1.3 适用设备
      2.2 线上支付
      2.3 线下支付
	3. 支付场景实现
      3.1 配置支付环境
          3.1.1 创建一个 App ID
          3.1.2 创建 Merchant ID
          3.1.3 Merchant ID 配置证书
          3.1.4 绑定 Merchant ID 到 APP ID
      3.2 在 Xcode 中配置项目
          3.2.1 开启 Apple Pay 功能
      3.3 代码实现
          3.3.1 判断当前设备是否可以支付
          3.3.2 判断并跳转到 Wallet 页面添加银行卡
          3.3.3 直接唤起支付，并配置账单信息
          3.3.4 验证用户的支付授权
          3.3.5 处理支付凭证
          3.3.6 关闭授权控制器

## 1. 回顾 WWDC 2021

iOS 15 对 Wallet和 Apple Pay 的更新主要有 5 个模块的更新：

### 1.1 Wallet 更新

在 iOS 15 中对 Wallet 进行了下面的一些更新：

1. 可以在 Wallet 中添加身份证，只需要扫描证件和上传照片即可，证件功能正在逐步应用到生活当中
2. 支持Wallet 中添加门禁卡，对 HomeKit 连接的锁的支持，用户可是使用 Home 钥匙开门
3. 支持多证同时绑定，在 iOS 14 中，如果想添加多张电影票，需要一张一张添加，现在可以同时一直添加到 Wallet
4. 新增自动隐藏过期失效的通行证，使证件更易于管理

### 1.2 更新 JavaScript Apple Pay 按钮

iOS 15 引入一种新的 JavaScript 实现 Apple Pay 按钮，这个新的按钮支持当前所有的按钮类型和样式。可以很容易实现并且支持在网页上自定义样式。

下面是示例核心源码：

```javascript
<script src="https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js"></script>

<style>
  apple-pay-button {
    --apple-pay-button-width: 140px;
    --apple-pay-button-height: 30px;
    --apple-pay-button-border-radius: 5px;
  }
</style>

<apple-pay-button buttonstyle="white" type="buy" locale="en-US"></apple-pay-button>
```

通过上面的源码可以看到，按钮的尺寸和样式可以很方便的进行配置，这些样式都带有“apple-pay”前缀。

### 1.3 优化支付流程

Apple Pay 在 iPhone 和 iPad 上的重大改变。在 iOS 15 上 Apple Pay 是一个全新的体验。重新设计了 Apple Pay 支付表，给用户更清晰更流畅的支付体验。

* 为了提高效率，简化了流程，添加了一个卡片和地址
* 还重新设计了错误处理
* 添加了一个付款摘要视图，用来展示详细信息（付款项目、折扣和小计、应用logo）
* iOS 15 的通知会显示一个大的图标，需要更新 PKPass 图标，最小尺寸为 38pt*38pt

### 1.4 API 更新

添加了对发货日期范围日历和时区支持

**原生源码如下：**

```swift
let price5 = NSDecimalNumber(string: "18.0")
let method = PKShippingMethod(label: "SF快递", amount: price5)
method.detail = "24 小时内送到"
method.identifier = "SF"
let today = Date()
let calendar = Calendar.current

let shippingStart = calendar.date(byAdding: .day, value: 3, to: today)!
let shippingEnd = calendar.date(byAdding: .day, value: 7, to: today)!

let components: Set<Calendar.Component> = [.calendar, .year, .month, .day]
let start = calendar.dateComponents(components, from: shippingStart)
let end = calendar.dateComponents(components, from: shippingEnd)
method.dateComponentsRange = PKDateComponentsRange(start: start, end: end)
```

**JavaScript 源码如下：**

```javascript
let applePayShippingMethod = {
  amount: "0.00",
  dateComponentsRange: {
    startDateComponents: { days: 3},
    endDateComponents: { days: 7}
  },
  detail: "24 小时内送到",
  identifier: "SF",
  label: "SF"
};
```

### 1.5 增加优惠券 codes

在支付的时候，如果需要使用优惠券功能，可以实现 `didChangeCouponCode` 代理方法，源码如下：

```swift
extension ViewController:PKPaymentAuthorizationViewControllerDelegate {
    func paymentAuthorizationViewController(_ controller: PKPaymentAuthorizationViewController, didChangeCouponCode couponCode: String, handler completion: @escaping (PKPaymentRequestCouponCodeUpdate) -> Void) {
        func appleDiscount (items: [PKPaymentSummaryItem]) -> [PKPaymentSummaryItem] {
            let subtotal = items.first!
            let couponDiscountItem = PKPaymentSummaryItem(label: "Coupon code Applied", amount: NSDecimalNumber(string: "-5.00"))
            let updatedTax = PKPaymentSummaryItem(label: "Tax", amount: NSDecimalNumber(string: "1.84"))
            let updatedTotal = PKPaymentSummaryItem(label: "Food Festival", amount: NSDecimalNumber(string: "24.84"))
            let discountedItems = [subtotal, couponDiscountItem, updatedTax, updatedTotal]
            return discountedItems
        }
        if couponCode.isEmpty {
            completion(PKPaymentRequestCouponCodeUpdate(paymentSummaryItems: paymentSummaryItems))
        } else if couponCode.uppercased() == "FESTIVAL" {
            completion(PKPaymentRequestCouponCodeUpdate(paymentSummaryItems: appleDiscount(items: paymentSummaryItems)))
        } else {
            let error = PKPaymentRequest.paymentCouponCodeInvalidError(localizedDescription: "Coupon code is not valid.")
            completion(PKPaymentRequestCouponCodeUpdate(errors: [error], paymentSummaryItems: summaryItems, shippingMethods: []))
        }
    }
}
```

## 2. 应用场景

### 2.1 刷公交

Apple Pay 现已支持更多城市的交通卡，带来新一代的搭乘公交体验。通过 Apple Pay 刷交通卡不但非常方便，而且十分安全。

如果你不慎丢失了 iPhone 或 Apple Watch，可以第一时间用查找 app 将设备设为丢失模式，来锁定交通卡。

#### 2.1.1 使用教程

只要在 iPhone 的钱包 app 里添加好银行卡，就能轻松买卡、充值，简简单单刷起来。以下几条短片将为你演示如何操作

* [如何刷公交](https://www.apple.com.cn/105/media/cn/apple-pay/2018/05b4ab68-ea7a-4ab7-bb78-1499bbfa1a29/transit/apple-pay-transit-tpl-cn-20180326_750x1624h.mp4 "如何刷公交")
* [如何在 iPhone 上买新卡](https://www.apple.com.cn/105/media/cn/apple-pay/2018/05b4ab68-ea7a-4ab7-bb78-1499bbfa1a29/purchase/apple-pay-purchase-tpl-cn-20180326_750x1624h.mp4 "如何在 iPhone 上买新卡")
* [如何在 iPhone 上充值](https://www.apple.com.cn/105/media/cn/apple-pay/2018/05b4ab68-ea7a-4ab7-bb78-1499bbfa1a29/top-up-on-iphone/apple-pay-top-up-on-iphone-tpl-cn-20180326_750x1624h.mp4 "如何在 iPhone 上充值")
* [如何在 Apple Watch 上充值](https://www.apple.com.cn/105/media/cn/apple-pay/2018/05b4ab68-ea7a-4ab7-bb78-1499bbfa1a29/top-up-on-watch/apple-pay-top-up-on-watch-tpl-cn-20180326_750x1624h.mp4 "如何在 Apple Watch 上充值")
* [如何在你的 iPhone 间转移交通卡](https://www.apple.com.cn/105/media/cn/apple-pay/transit/2020/2299515d-ceba-4763-966f-faa42c127dad/films/transfer-card/apple-pay-transfer-card-tpl-cn-2020_750x1624h.mp4 "如何在你的 iPhone 间转移交通卡")

#### 2.1.2 适用城市和地点

目前 Apple Pay 已经支持北上广深等 15 个城市，并且陆续支持更多的城市交通卡。

![](https://images.xiaozhuanlan.com/photo/2021/7e59a7b13b8629777047958a09bf6710.png)

#### 2.1.3 适用设备

目前适用的设备如下：

![](https://images.xiaozhuanlan.com/photo/2021/a9d084a855b4b017565c499f571fb704.png)

### 2.2 线上支付

目前 Apple Pay 在 App 和网页上作为主流支付之一，下面截图只是展示其中一部分平台：

![](https://images.xiaozhuanlan.com/photo/2021/080d00a5d25c3525eba40bae2b969048.png)

### 2.3 线下支付

在各大商场、超市、餐厅也都陆续可以使用 Apple Pay，如果发现以下标识，就代表该商家支持 Apple Pay：

![](https://images.xiaozhuanlan.com/photo/2021/fe416acb009e00e112edfc2fb32385f9.png)

下面截图只是展示其中一部分商家：

![](https://images.xiaozhuanlan.com/photo/2021/e8ef1b65d4170a6db61ed59e43d97077.png)

## 3. 支付场景实现

> Tips：文末有示例代码地址。

### 3.1 配置支付环境

#### 3.1.1 创建一个 App ID

创建一个 App ID "com.fby.applepay"，并勾选 Apple Pay 功能。

![](https://images.xiaozhuanlan.com/photo/2021/c1093b1ee2505ca30e3a3ab30205943d.jpeg)

#### 3.1.2 创建 Merchant ID

首先选择 Merchant IDs

![](https://images.xiaozhuanlan.com/photo/2021/7be2f75b52b040a32e3393ecad315363.jpeg)



然后填写 ID 描述和定义的 ID

![](https://images.xiaozhuanlan.com/photo/2021/ebcbf8afc2c7ede9ca92d3d75fee855c.jpeg)

#### 3.1.3 Merchant ID 配置证书

为 Merchant ID 配置证书, 并下载证书安装到钥匙串。

![](https://images.xiaozhuanlan.com/photo/2021/5183cb448084ffdb2341e3f725080533.jpeg)

选择已经配置好的 Merchant ID，点击创建证书按钮

![](https://images.xiaozhuanlan.com/photo/2021/39feddb2b01bfe67fdb6aee4d7411086.jpeg)

在这里会让你选择是否支持美国以外的地区处理支付，此处根据自身需求选择，对开发者来说，不同的地区需要上传不同的证书签名请求文件。

#### 3.1.4 绑定 Merchant ID 到 APP ID

![](https://images.xiaozhuanlan.com/photo/2021/512abe3da526437d7bd11c14d1804709.jpeg)

点击 Configure，选择需求绑定的 Merchant ID

![](https://images.xiaozhuanlan.com/photo/2021/6696b38ca27944e11438c28d855a8d3a.jpeg)

绑定成功之后需要重新更新描述文件

### 3.2 在 Xcode 中配置项目

#### 3.2.1 开启 Apple Pay 功能

![](https://images.xiaozhuanlan.com/photo/2021/bbd3b2f88d65171393fef2094e8b06ed.jpeg)

Bundle ID(APP ID) 和 Merchant ID 需要和在 Apple 后台创建并生成的证书和描述文件相同。

### 3.3 代码实现

这里只展示关键代码，所有代码请参考[源码](https://github.com/fanbaoying/WWDC-FBYApplePay)

#### 3.3.1 判断当前设备是否可以支付

```swift
if !PKPaymentAuthorizationViewController.canMakePayments() {
    let remindLab = UILabel(frame: CGRect(x: 50, y: 230, width: view.frame.width - 100, height: 30))
    remindLab.text = "当前设备不支持支付"
    remindLab.textAlignment = NSTextAlignment.center
    self.view.addSubview(remindLab)
    return
}
```

#### 3.3.2 判断并跳转到 Wallet 页面添加银行卡

```swift
if !PKPaymentAuthorizationViewController.canMakePayments(usingNetworks: [PKPaymentNetwork.visa, PKPaymentNetwork.chinaUnionPay]) {
    let remindLab = UILabel(frame: CGRect(x: 50, y: 230, width: view.frame.width - 100, height: 30))
    remindLab.text = "跳转到 Wallet 页面添加银行卡"
    remindLab.textAlignment = NSTextAlignment.center
    self.view.addSubview(remindLab)
    
    let whiteOutlineButton = PKPaymentButton(paymentButtonType: .plain, paymentButtonStyle: .whiteOutline)
    whiteOutlineButton.frame = CGRect(x: 50, y: 270, width: view.frame.width - 100, height: 50)
    whiteOutlineButton.addTarget(self, action: #selector(jump), for: .touchUpInside)
    self.view.addSubview(whiteOutlineButton)
}
```

![](https://images.xiaozhuanlan.com/photo/2021/bc974a0ce436c2e29b4815c334544e4f.jpg)

#### 3.3.3 直接唤起支付，并配置账单信息

```swift
remindLab2 = UILabel(frame: CGRect(x: 50, y: 380, width: view.frame.width - 100, height: 30))
remindLab2.text = "点击按钮直接唤起支付购买"
remindLab2.textAlignment = NSTextAlignment.center
self.view.addSubview(remindLab2)

blackButton = PKPaymentButton(paymentButtonType: .buy, paymentButtonStyle: .black)
blackButton.frame = CGRect(x: 50, y: 420, width: view.frame.width - 100, height: 50)
blackButton.addTarget(self, action: #selector(buy), for: .touchUpInside)
self.view.addSubview(blackButton)
```

![](https://images.xiaozhuanlan.com/photo/2021/6a148dda409bf97cc27992e4a9bb4d06.jpg)

点击按钮开始创建支付账单，源码如下：

```swift
// 1. 创建支付请求
let payRequest = PKPaymentRequest()
// 1.1 配置支付请求
// 商家 ID
payRequest.merchantIdentifier = "merchant.fbyapplepay.com"
// 货币代码以及国家代码
payRequest.countryCode = "CN"
payRequest.currencyCode = "CNY"

// 配置支持的支付网络
payRequest.supportedNetworks = [PKPaymentNetwork.visa, PKPaymentNetwork.chinaUnionPay]

// 配置商户的处理方式
payRequest.merchantCapabilities = PKMerchantCapability.capability3DS

// 配置购买的商品列表
let price1 = NSDecimalNumber(string: "10.0")
let item1 = PKPaymentSummaryItem(label: "iPhone 12", amount: price1)

let price2 = NSDecimalNumber(string: "20.0")
let item2 = PKPaymentSummaryItem(label: "iPhone 12 Pro", amount: price2)

let price3 = NSDecimalNumber(string: "30.0")
let item3 = PKPaymentSummaryItem(label: "iPhone 12 Pro Max", amount: price3)
payRequest.paymentSummaryItems = [item1, item2, item3]

// 1.2 配置快递方式
let price5 = NSDecimalNumber(string: "18.0")
let method = PKShippingMethod(label: "SF快递", amount: price5)
method.detail = "24 小时内送到"
method.identifier = "SF"

let price6 = NSDecimalNumber(string: "10.0")
let method1 = PKShippingMethod(label: "YD快递", amount: price6)
method1.detail = "送货上门"
method1.identifier = "YD"

payRequest.shippingMethods = [method, method1]
payRequest.shippingType = PKShippingType.storePickup
```

#### 3.3.4 验证用户的支付授权

```swift
// 2 验证用户的支付授权
let avc = PKPaymentAuthorizationViewController(paymentRequest: payRequest)
if avc == nil {
    print("授权控制器创建失败")
}
avc!.delegate = self
self.present(avc!, animated: true, completion: nil)
```

实现 PKPaymentAuthorizationViewControllerDelegate 代理，并且实现授权相关代理方法。

#### 3.3.5 处理支付凭证

```swift
func paymentAuthorizationViewController(_ controller: PKPaymentAuthorizationViewController, didAuthorizePayment payment: PKPayment, handler completion: @escaping (PKPaymentAuthorizationResult) -> Void) {
    
    print("payment token:\(payment.token)")
    NSLog(@"验证通过后, 需要开发者继续完成交易");
    // 需要你连接服务器并上传支付令牌和其他信息，以完成整个支付流程。
    completion(PKPaymentAuthorizationResult.init(status: .success, errors: nil))
    
}
``` 

一般在此处,拿到支付信息, 发送给服务器处理, 处理完毕之后, 服务器会返回一个状态, 告诉客户端,是否支付成功, 然后由客户端进行处理。

#### 3.3.6 关闭授权控制器

```swift
func paymentAuthorizationViewControllerDidFinish(_ controller: PKPaymentAuthorizationViewController) {
    print("取消或者交易完成")
    self.dismiss(animated: true, completion: nil)
}
```

#### Demo 源码

[文章中涉及到的演示源码](https://github.com/fanbaoying/WWDC-FBYApplePay "文章中涉及到的演示源码")已上传，有需要的小伙伴请自取。

