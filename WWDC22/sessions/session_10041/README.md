---
session_ids: [10041]
---

# WWDC22 10041 - Wallet 和 Apple Pay 的新功能

> 作者：**展菲**，目前在某上市企业从事移动端项目研发。[#公众号:Swift 社区](https://mp.weixin.qq.com/mp/homepage?__biz=MzAxNzgzNTgwMw==&hid=1&sn=a7c21e2cd8e35545b737dc6c549fb1d7&scene=18 "公众号:Swift社区") 负责人，《ESP32-C3 物联网工程开发实战》作者。CSDN 博客专家，iOS 领域新星创作者，技术博客总访问量已达数百万。
>
> 审核：//TODO..

[toc]

## 前言

iOS 16 在 Wallet 和 Apple Pay 的更新除了常规的功能更新优化，还增加了**多商户支付**、**自动支付**、**订单跟踪**、**身份验证**等新功能。下面让我们一起来回顾一下。

## 常规更新

### 无接触支付

早在 iOS 15.4 版本中就发布了 Top to Pay，这是一种非常安全、私密和便捷的无接触支付方式。在需要支付的时候只需要在 iPhone 上轻按一下，就能完成支付，无需其他的硬件或者软件进行辅助。

您可以很容易的将这个功能集成到应用程序中，无接触支付包括 Apple Pay 非接触式信用卡和借记卡以及其他形式的数字钱包。

### Mac 同步 Apple Pay 功能

在 macOS 13 中，重新设计了 Apple Pay 的体验。去年在 iOS 系统中新增的支付表统计功能得到了非常好的反响，今年会将该功能同步到 macOS 系统中。这些功能是通过 SwiftUI 实现的，同时今天介绍的所有 Apple Pay 功能在 Mac 也都支持。

![](./images/sheet.png)

### SwiftUI 新增 API

新的 SwiftUI API 可以帮助开发者更加容易的集成 Apple Wallet 或 Apple Pay 按钮。如下图：

![](./images/WalletAndApplePayBtn.png)

#### 添加 Apple Wallet 按钮

新的 API 可以大大的减少需要编写的代码量。下面让我们看看在代码中是如何实现：

```Swift
// Add "Add to Apple Wallet" button
@State var addedToWallet: Bool
    
@ViewBuilder private var airlineButton: some View {
    if let pass = createAirlinePass() {
        AddPassToWalletButton([pass]) { added in
            addedToWallet = added
        }
        .frame(width: 350, height: 50)
        .addPassToWalletButtonStyle(.blackOutline)
    } else {
        // Fallback
    }
}
```

通过上面的示例代码可以看到，首先通过 `createAirlinePass` 创建 pass，并且判断处理如果没有成功加载的情况。如果传输的数据格式错误或者签名失效，会在 Fallback 中进行处理。

如果是成功状态，接下来会调用 `AddPassToWalletButton`，其中的参数是以数组的形式传入，示例中只有一个参数。执行的结果以 `Bool` 的形式返回。项目中可以将这个结果保存下来，用于进一步的操作使用。

另外还可以分别调用 `.frame` 和 `.addPassToWalletButtonStyle` 自定义按钮的大小和样式。示例中是默认尺寸。

#### 添加 Apple Pay 按钮

如何使用 Apple Pay 按钮添加付款，我们通过下面的示例进行分析：

```Swift
// Add "Pay with Apple Pay" button
    
// Creste a payment request
let paymentRequest = PKPaymentRequest()
    
// Create a payment authorization change method
func authorizationChange(phase: PayWithApplePayButtonPaymentAuthorizationPhase) {...}
    
PayWithApplePayButton(
    .plain
    request: paymentRequest,
    onPaymentAuthorizationChange: authorizationChange
) {
    // Fallback
}
.frame(width: 250, height: 50)
.payWithApplePayButtonStyle(.automatic)
```

通过上面的示例代码可以看到，首先使用 `PKPaymentRequest()` 创建一个支付请求，并设置好常用配置。然后创建一个 `authorizationChange` 方法。接下来添加 Apple Pay 按钮。

调用 `PayWithApplePayButton` 传入 `.plain`、`paymentRequest`对象、`authorizationChange`方法。如果当前设备不支持 Apple Pay，可以在 Fallback 中处理。

最后，和添加 Apple Wallet 按钮一样，可以自定义按钮的大小和样式。系统给出了 17 种不同的标签，您可以根据当前的支付环境选择合适的按钮。

![](./images/btnLabels.png)

这些按钮适用于 iOS、iPadOS、macOS 和 watchOS。

## 多商户支付

在 iOS 16 中，系统引入了在同一笔交易中分别向不同的商户发起多个支付请求。这个功能对于线上市场、旅行预订和票务服务等场景非常的有用。

举个例子，如果您计划外出旅行。通过一家旅行社预订了机票 ($150)、酒店 ($300) 和汽车租赁 ($50)，总共需要支付 $500 元。您向旅行社提供了信用卡信息用于支付。通常情况旅行社只是简单的将信用卡信息传递个每家公司，机票、酒店和汽车租赁分别进行各自的收费。这种方式对于您的隐私和安全非常不利。

现在有了新的多商户支付 API，可以为涉及到的每个商户请求支付 token。付款列表中同步显示交易中涉及的各个商户的详细信息。最后可以点击汇总支付按钮统一付款。

![](./images/multiple.png)

### 多商户支付代码解析

下面通过代码来看看是如何实现多商户支付：

```Swift
// Multi-merchant payments

// Create a payment request
let paymentRequest = PKPaymentRequest()

// Set total amount
paymentRequest.paymentSummaryItems = [
    PKPaymentSummaryItem(label: "Total", amount: 500)
]

// Create a multi token context for each additional merchant in the payment
let multiTokenContexts = [
    PKPaymentTokenContext(
        merchantIdentifier: "com.example.air-travel",
        externalIdentifier: "com.example.air-travel",
        merchantName: "Air Travel",
        merchantDomain: "air-travel.example.com",
        amount: 150
    ),
    PKPaymentTokenContext(
        merchantIdentifier: "com.example.hotel",
        externalIdentifier: "com.example.hotel",
        merchantName: "Hotel",
        merchantDomain: "hotel.example.com",
        amount: 300
    ),
    PKPaymentTokenContext(
        merchantIdentifier: "com.example.car-rental",
        externalIdentifier: "com.example.car-rental",
        merchantName: "Car Rental",
        merchantDomain: "car-rental.example.com",
        amount: 50
    )
]
paymentRequest.multiTokenContexts = multiTokenContexts
```

通过上面的示例代码可以看到，首先使用 `PKPaymentRequest()` 创建了一个支付请求，并设置好常用配置。然后通过 `paymentSummaryItems` 添加汇总项目，包括总金额。

接下来，使用新增的 `PKPaymentTokenContext` 类为涉及到的每个商户创建一个支付 token，每个 token 中包含商户的详细信息，以及每个商户所授权的金额。

最后将支付 token 配置到 `paymentRequest` 中的 `multiTokenContexts` 属性上。

> 注意：支付 token 中所有商户的总金额必须小于或者等于支付请求本身的总金额。

如果想使用 Web 实现 Apple Pay 的多商户支付，请查看 [Apple Pay JS API](https://developer.apple.com/documentation/apple_pay_on_the_web/apple_pay_js_api)文档

## 自动支付

下面让我们看一下自动付款方面的改进，在 iOS 16 中，新增了可以让用户直接从 Wallet App 中查看和管理已经绑定的自动付款商家功能。

在这次更新的版本中，系统支持两种类型的自动付款：

1. 定期常用付款 (recurring payments)
2. 自动重新加载付款 (Automatic reload payments)

**定期常用付款**的常用场景例如：订阅、分期付款、定期计费等场景。这个功能是为了更好的满足喜欢稍后支付的用户，这类用户在国外的支付市场占比很大，说明 Apple Pay 在全力的满足各类用户的需求。

**自动重新加载付款**场景例如：商店会员卡余额充值等场景。

在计划内新增的 API 还包含了在用户发出付款请求时，允许请求设置自动付款功能。

### Apple ID 绑定支付

除了上面的更新，还新增了 Apple Pay 商户 tokens 绑定支付，这是一种与用户 Apple ID 绑定的新型支付方式，这种方式可以更加可靠的持续向用户收费。

举个例子，如果您加入一个俱乐部，俱乐部会费是按月收费，使用常规的 Apple Pay 支付是付款 token 与您授权付款的设备相关联。当你更换了一部新的 iPhone，这种设备授权支付的方式就不能继续使用。

如果使用这种新的自动支付功能，支付 token 是与您的 Apple ID 互相绑定，这样就算你的手机更换或者恢复出厂设置，只要 Apple ID 没有发生变化，依旧可以完成自动续费功能。

### 实现定期常用付款

在这次的更新中，第一种定期常用付款方式是定期完成付款。定期付款可以是固定金额也可以是可变金额，按照设定的日期收取。例如每周、每月或者每年。

下面我们通过代码看一下如何在自动付款中实现定期付款：

```Swift
// Recurring payments
    
// Specify the amount and billing periods
let regularBilling = PKRecurringPaymentSummaryItem(label: "Membership", amount: 20)
    
let trialBilling = PKRecurringPaymentSummaryItem(label: "Trial Membership", amount: 10)
    
let trialEndDate = Calendar.current.date(byAdding: .month, value: 1, to: Date.now)
trialBilling.endDate = trialEndDate
regularBilling.startDate = trialEndDate
```

通过上面的示例代码可以看到，首先使用 `PKRecurringPaymentSummaryItem` 类指定定期独款的金额和持续时间。定期付款项目中，通常会有常规计费期和介绍期或者试用期。

可以通过使用 `startDate` 和 `endDate` 属性来完成试用期何时结束以及常规计费何时开始功能。

```Swift
// Create a recurring payment request
let recurringPaymentRequest = PKRecurringPaymentRequest(
    paymentDescription: "Book Club Membership",
    regularBilling: regularBilling,
    managementURL: URL(string: "https://www.example.com/managementURL")
)
recurringPaymentRequest.trialBilling = trialBilling
    
recurringPaymentRequest.billingAgreement = """
50% off for the first month. You will be charged $20 every month after that until you cancel. \ You may cancel at any time to avoid future charges. To cancel, go to your Account and click \ Cancel Membership.
"""
    
recurringPaymentRequest.tokenNotificationURL = URL(string: "https://www.example.com/tokenNotificationURL")!

// Create a payment request
let paymentRequest = PKPaymentRequest()
    
paymentRequest.recurringPaymentRequest = recurringPaymentRequest
let total = PKRecurringPaymentSummaryItem(label: "Book Club", amount: 10)
total.endDate = trialEndDate
    
paymentRequest.paymentSummaryItems = [trialBilling, regularBilling, total]
```

接下来，使用新增的 `PKRecurringPaymentRequest` 类创建一个 `recurringPaymentRequest`。在这个初始化方法中，可以提供付款的描述、定期的计费周期，以及一个 web 网站超链接，用户可以打开超链接更新或者删除重复付款的方式。

![](./images/recurring.png)

还可以选择提供一个试用的计费期，以及计费说明文本，以便向用户解释支付条款。最后可以选择提供 `tokenNotificationURL`， 服务器可以在其中接收关于 Apple Pay 商户支付 token 发生变化的通知。例如，如果用户解除绑定，商户就可以收到通知。

### 实现自动重新加载付款

在这个版本中第二种自动付款的方式是自动重新加载付款，使用这种支付方式，每当余额低于某个阈值金额时，系统就会自动完成固定金额的充值。自动重新加载支付对于商店卡充值或者预付余额这种场景来说，是一个非常实用的功能。

自动重新加载付款的代码实现和定期常用付款区别在于，不需要设置定时，其他功能代码格式都是一样的，只需要对应调用重新加载付款的 API 就可以，代码如下：

```Swift
// Automatic reload payments
    
// Specify the reload amount and threshold
let automaticReloadBilling = PKAutomaticReloadPaymentSummaryItem(
    label: "Coffee Shop Reload",
    amount: 25
)
reloadItem.thresholdAmount = 5
    
// Create an automatic reload payment request
let automaticReloadPaymentRequest = PKAutomaticReloadPaymentRequest(
    paymentDescription: "Coffee Shop",
    regularBilling: regularBilling,
    managementURL: URL(string: "https://www.example.com/managementURL")
)
    
automaticReloadPaymentRequest.billingAgreement = """
Coffee Shop will and $25.00 to your card immediately, and will automatically reload your \ card with $25.00 whenever the balance falls below $5.00. You may cancel at any time to avoid \ future charges. To cancel, go to your Account and click Cancel Reload.
"""
automaticReloadPaymentRequest.tokenNotificationURL = URL(string: "https://www.example.com/tokenNotificationURL")!
    
paymentRequest.automaticReloadPaymentRequest = automaticReloadPaymentRequest
let total = PKAutomaticReloadPaymentSummaryItem(label: "Coffee Shop", amount: 25)
total.thresholdAmount = 5
    
paymentRequest.paymentSummaryItems = [total]
```

![](./images/automatic.png)

> **注意：** 自动支付不支持多商户付款

如果想使用 Web 实现 Apple Pay 的多商户支付，请查看 **Apple Pay JS API** 文档

## 订单跟踪

在 iOS 16 中新增了订单跟踪功能，允许用户跟踪订单，可以在 Wallet App 中查看最近完成的订单和正在进行中的订单。如下图：

![](./images/orders.png)

如果用户在支持 Apple Pay 的购物平台选择商品，最后提交订单选择 Apple Pay 支付订单，Wallet App 就会发送通知提示用户有订单。如果打开通知就可以看到该订单的详细信息，其中包括订单日期、购买商品详情、订单状态、寄送地址等信息。并且订单状态会实时更新并发送通知，同时会显示订单大致送达日期。订单详情如下图：

![](./images/orderDetails.png)

### 订单跟踪代码解析

下面我们看一下代码中如何实现订单跟踪功能：

```Swift
// Returning a payment authorization result
func onAuthorizationChange(phase: PayWithApplePayButtonPaymentAuthorizationPhase) {
    switch phase {
    case .didAuthorize(let payment, let resultHandler):
        server.createOrder(with: payment) { serverResult in
            guard case .success(let orderDetails) = serverResult else {
                /* handle error */
            }
            let result = PKPaymentAuthorizationResult(status: .success, errors: nil)
            result.orderDetails = PKPaymentOrderDetails(
                orderTypeIdentifier: orderDetails.orderTypeIdentifier,
                orderIdentifier: orderDetails.orderIdentifier,
                webServiceURL: orderDetails.webServiceURL,
                authenticationToken: orderDetails.authenticationToken
            )
            resultHandler(result)
        }
    }
}
```

当用户授权付款时，App 会将支付信息发送到服务器，并创建一个订单。查看服务器回调结果是否成功，如果失败在 handle error 中处理。如果服务器返回的结果成功，会同时返回订单的详细信息 `orderDetails`。

然后，创建一个 `PKPaymentOrderDetails` 对象，参数分别为：订单类型 ID `orderTypeIdentifier`、订单 ID `orderIdentifier`、服务器 URL `webServiceURL`、身份验证 token `authenticationToken`，并将这个对象赋值给 result 的 orderDetails 属性。

也可以在 Apple 网站订单详情页面完成付款。与前面一样，从服务器回调的结果中提取订单详情。然后将订单详情对象赋值给 result 的 details 属性。

```
// Completing a payment with order details on the web
paymentRequest.show().then((response) => {
    server.createOrder(response).then((orderDetails) => {
        let details = {};
        if (response.methodName === "https://apple.com/apple-pay") {
            details.data = {
                "orderDetails": {
                    "orderTypeIdentifier": orderDetails.orderTypeIdentifier,
                    "orderIdentifier": orderDetails.orderIdentifier,
                    "webServiceURL": orderDetails.webServiceURL,
                    "authenticationToken": orderDetails.authenticationToken
                }
            }
        }
        response.complete("success", datails)
    })
});
```

## 身份验证

在 iOS 16 中新增了 API，允许 App 从 Wallet 中的获取用户绑定的卡片信息，用于验证用户的年龄或身份。使用这个接口可以帮助用户的反欺诈模型来验证用户的信用度，可以有效降低欺诈率。

如果要使用这个 API，需要登录开发者账号申请并配置 Merchant ID 和 Encryption 证书，这个配置流程和配置 Apple Pay 流程差不多。实现这个功能可以分为 4 步

1. App 调用 PassKit 库中的 API，并指定需要请求的信息
2. 打开用户验证页面，用户选择是否同意这个请求
3. App 会收到加密请求
4. 然后通过这个请求向服务器请求相关信息

身份验证请求和 Apple Pay 一样也设计了对应的按钮，总共有 4 种不同的文本按钮，可以根据使用场景进行选择。如下图：

![](./images/identityBtn.png)

### SwiftUI 代码解析

按钮会根据页面空间自动切换单行或者多行，如上图右边显示的是多行显示。让我们在代码中看看怎么创建这个按钮：

```Swift
// SwiftUI VerifyIdentityWithWalletButton
    
@ViewBuilder var verifyIdentityButton: some View {
    verifyIdentityWithWalletButton(
        .verifyIdentity,
        request: createRequest()
    ) { result in
        // ...
    } fallback: {
        // verify identity another way
    }
}
```

`createRequest` 代码实现如下：

```Swift
// Create a PKIdentityRequest
    
func createRequest() -> PKIdentityRequest {
    let descriptor = PKIdentityDriversLicenseDescriptor()
    descriptor.addElements([.age(atLeast: 18)],
                           intentToStore: .willNotStore)
    descriptor.addElements([.givenName, .familyName, .portrait],
                           intentToStore: .mayStore(days: 30))
    
    let request = PKIdentityRequest()
    request.descriptor = descriptor
    request.merchantIdentifier = // configured in Developer account
    request.nonce = // bound to user session
    return request
}
```

首先创建一个 `PKIdentityDriversLicenseDescriptor`，使用 `addElements` 方法指定想要请求的参数，并且选择是否需要存储这些信息。代码中连续调用了两次，第一次是获取 age 不做存储，第二次获取 `givenName`，`familyName`，`portrait` 这些数据存储 30 天。

然后创建 `PKIdentityRequest`，将需要请求的信息赋值给 `descriptor`。接下来配置 `merchantIdentifier`，这里的内容需要登录开发者账号进行配置。最后需要指定一个 `nonce`，这是一个重要的参数，可以方便重复发起请求，并且可以绑定到特定的方法用于接收 API 的回调。设置了所有属性之后，点按钮会打开用户验证页面。如下图：

![](./images/identity.png)

用户可以选择使用 Face ID 或者 Touch ID 通过这个验证请求，或者关闭页面，停止请求。用户操作完成，代码中会收到回调结果。代码如下：

```Swift
// SwiftUI VerifyIdentityWithWalletButton
    
@ViewBuilder var verifyIdentityButton: some View {
    verifyIdentityWithWalletButton(
        .verifyIdentity,
        request: createRequest()
    ) { result in
        switch result {
        case .success(let document):
            // send document to server for decryption and verification
        case .failure(let error):
            switch error {
            case PKIdentityError.cancelled:
                // handle cancellation
            default:
                // handle other errors
            }
        }
    } fallback: {
        // verify identity another way
    }
}
```

### Swift 代码解析

以上代码是在 SwiftUI 中调用的示例，在 Swift 中调用的示例代码如下：

```Swift
// Swift API
    
let authorizationController = PKIdentityAuthorizationController()
let canRequest = await self.authorizationController.canRequestDocument(descriptor)
if canRequest {
    let button = PKIdentityButton(label: .verifyIdentity, style: .black)
    // ...
} else {
    // verify identity another way
}
    
// ...
    
do {
    let document = try await self.authorizationController.requestDocument(request)
    // send document to server for decryption and verification
} catch {
    // handle errors
}
```

使用 Swift 可以用 `PKIdentityButton` 和 `PKIdentityAuthorizationController` 来实现相同的功能。

## Apple Pay 应用场景

### 交通卡支持的城市和地点

目前 `Apple Pay` 已经从去年 15 个城市增加到 25 个城市，并且陆续支持更多的城市交通卡。下图是今年新增的城市。

![](./images/city.png)

### 适用设备

`Apple Pay` 目前适用的设备如下：

![](./images/device.png)

### 线上支付

目前 `Apple Pay` 在 `App`和网页上作为主流支付之一，下面截图只是展示其中一部分平台：

![](./images/Apps.png)

### 线下支付

在各大商场、超市、餐厅都陆续支持使用 `Apple Pay`，如果发现以下标识，就代表该商家支持 `Apple Pay`：

![](./images/unionPay.png)

下面截图只是展示其中一部分商家：

![](./images/merchants.png)

如果想知道更多有哪些商家、App 和网页支持 Apple Pay，点击[这个链接](https://www.apple.com.cn/apple-pay/where-to-use/ "支持 Apple Pay")查看。

## Wallet 应用场景

Apple Wallet 目前支持登机证、优惠券、活动门票、通用通行证等功能，方便用户使用。同时支持在 iPhone、iPod touch 和 Apple Watch 设备上使用。如下图：

![](./images/Wallet.png)

### 登机证

火车票、航空公司登机牌和其他类型的通行证。这里的通行证需要具有起点和终点的单次通行特性。如下图：

![](./images/Boarding.png)

### 优惠券

优惠券包含：商品优惠券、特别优惠和其他折扣等。页面中包含商品信息、优惠力度、优惠券到期日等信息。如下图：

![](./images/Coupons.png)

### 活动门票

活动门票就是指音乐会、电影、戏剧、体育赛事或者其他活动的通行证等。通常情况，一张通行证对应一个活动，但是也有可能一张通行证对应多个活动，就像一个地区所有景点的季卡或者年卡。如下图：

![](./images/Event.png)

### 存储卡

存储卡包含存储会员卡、折扣卡、积分卡和礼品卡。如果与商店卡相关的账户余额，可以在卡包中查看余额以及更新时间等信息。如下图：

![](./images/StoreCards.png)

### 通用通行证

通用通行证包含任何类型的通行证，例如健身房会员卡、店内取货收据或者物品领取支票等。其中内容包含通信证名字、持有人姓名、持有人 ID 等信息。 如下图：

![](./images/Generic.png)

## 配置支付环境

### 创建一个 App ID

创建一个 `App ID` `"com.fby.applepay"`，并勾选 `Apple Pay` 功能。

![](./images/pay1.png)

### 创建 Merchant ID

首先选择 `Merchant IDs`

![](./images/pay2.png)

然后填写 `ID` 描述和定义的 `ID`

![](./images/pay3.png)

### Merchant ID 配置证书

为 `Merchant ID` 配置证书，并下载证书安装到钥匙串。

![](./images/pay4.png)

选择已经配置好的 `Merchant ID`，点击创建证书按钮

![](./images/pay5.png)

在这里会让你选择是否支持美国以外的地区处理支付，此处根据自身需求选择，对开发者来说，不同的地区需要上传不同的证书签名请求文件。

### 绑定 Merchant ID 到 APP ID

![](./images/pay6.png)

点击 `Configure`，选择需求绑定的 `Merchant ID`

![](./images/pay7.png)

绑定成功之后需要重新更新描述文件

## 在 Xcode 中配置项目

### 开启 Apple Pay 功能

![](./images/pay8.png)

`Bundle ID(APP ID)` 和 `Merchant ID` 需要和在 `Apple` 后台创建并生成的证书和描述文件相同。

## 代码实现

这里只展示关键代码，所有代码请参考[源码](https://github.com/fanbaoying/WWDC-FBYApplePay)

### 判断当前设备是否可以支付

```swift
if !PKPaymentAuthorizationViewController.canMakePayments() {
    let remindLab = UILabel(frame: CGRect(x: 50, y: 230, width: view.frame.width - 100, height: 30))
    remindLab.text = "当前设备不支持支付"
    remindLab.textAlignment = NSTextAlignment.center
    self.view.addSubview(remindLab)
    return
}
```

### 判断并跳转到 Wallet 页面添加银行卡

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

![](./images/pay9.png)

### 直接唤起支付，并配置账单信息

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

![](./images/pay10.png)

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

### 验证用户的支付授权

```swift
// 2 验证用户的支付授权
let avc = PKPaymentAuthorizationViewController(paymentRequest: payRequest)
if avc == nil {
    print("授权控制器创建失败")
}
avc!.delegate = self
self.present(avc!, animated: true, completion: nil)
```

实现 `PKPaymentAuthorizationViewControllerDelegate` 代理，并且实现授权相关代理方法。

### 处理支付凭证

```swift
func paymentAuthorizationViewController(_ controller: PKPaymentAuthorizationViewController, didAuthorizePayment payment: PKPayment, handler completion: @escaping (PKPaymentAuthorizationResult) -> Void) {
    
    print("payment token:\(payment.token)")
    NSLog(@"验证通过后，需要开发者继续完成交易");
    // 需要你连接服务器并上传支付令牌和其他信息，以完成整个支付流程。
    completion(PKPaymentAuthorizationResult.init(status: .success, errors: nil))
}
```

一般在此处，拿到支付信息，发送给服务器处理，处理完毕之后，服务器会返回一个状态，告诉客户端，是否支付成功，然后由客户端进行处理。

### 关闭授权控制器

```swift
func paymentAuthorizationViewControllerDidFinish(_ controller: PKPaymentAuthorizationViewController) {
    print("取消或者交易完成")
    self.dismiss(animated: true, completion: nil)
}
```

### Demo 源码

[文章中涉及到的演示源码](https://github.com/fanbaoying/WWDC-FBYApplePay "文章中涉及到的演示源码")已上传，有需要的小伙伴请自取。

## 总结

相比去年更新 WWDC22 支付模块新增了很多内容，从视频时长就可以看出，今年视频时长是去年的两倍。更新的内容更贴合用户使用场景，同时跟进 API 更新使开发者用更短的时间完成这些功能。
