---
session_ids: [10043]
---

# 【WWDC22 10043/10044/110404】App Store Connect 中的新特性及最佳实践

本文基于 session [10043](https://developer.apple.com/videos/play/wwdc2022/10043/) 、[10044](https://developer.apple.com/videos/play/wwdc2022/10044/) 、[110404](https://developer.apple.com/videos/play/wwdc2022/110404/) 整理。

## 前言

本文包含 4 个内容：

* App Store Connect 中的新特性介绍
* 对其中的重要更新功能：增强的 App Store 提交体验、应用基准测试工具、用户订阅状态即时获取，展开最佳实践讨论

## App Store Connect 新特性

本次 App Store Connect 的更新主要有以下几点：

1. App Clips API ：轻应用 API 的补充和完善，[session 10097](https://developer.apple.com/videos/play/wwdc2022/10097/) 中有详细的讲解。
2. 定制优惠代码
3. TestFlight for Mac ：TestFlight 可以在 Mac App Store 进行下载和使用，进一步拓宽了应用内测的渠道。
4. TestFlight 组列
5. TestFlight 组内管理：支持快速创建或者移除一个测试组。
6. 应用内事件
7. 定制化产品页面
8. 对使用了苹果钱包的应用进行转换
9. 产品页面优化
10. Xcode Cloud ：针对组内合作、测试场景都有了比较多的优化，具体可查看 session [110374](https://developer.apple.com/videos/play/wwdc2022/110374/) 、[110375](https://developer.apple.com/videos/play/wwdc2022/110375/) 、[110361](https://developer.apple.com/videos/play/wwdc2022/110361/) 。
11. 增强的 App Store 提交体验，在下文我们将会对该点更新进行详细讲解。
12. App Store Connect API 更新，此次的 API 带来了将近 60% 的更新，涉及到了 IAP 与订阅、客户评论与开发者回应、提交审查、app 未响应诊断等。在下文我们将会对其中涉及到的应用基准测试工具、用户订阅状态即时获取这两个新功能展开最佳实践讨论。

## 应用商店提交增强优化

### 组提交

首先，此次的 App Store Connect 更新推出了组提交的方式，开发者在提审时可以在单次提交内添加多个提交项，例如 app 版本、定制化产品页面、产品页面优化测试、应用内事件等。这样的方式能够提供更多的上下文方便苹果进行审查，并提高提交的一致性和有效性。

![1](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/1.png)

无论你在一个组提交里添加了多少项，苹果都会在会在 24 小时内回复结果，并对里面的每一项给出独立结果，标注接受 or 拒绝。如下图所示。

![2](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/2.png)

由于只有组提交里所有的项目都被接受后，组提交才能成功通过，因此当你的组提交内有部分项目被拒绝时，你就可以有两种操作了：

一是修改那些被拒绝了的项目内容，然后重新提交，当它们被接受后，组提交就可以通过并发布到 App Store 上了。

![3](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/3.png)![4](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/4.png)

二是直接删掉这些被拒绝的项目，那就相当于这个组提交内的所有项目都被接受，就可以通过了。不过当然，这些删掉的项目还是要重新构建一组新的提交，这样才能保证所有的内容都被批准并发布。

![5](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/5.png)![6](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/6.png)

通常来说，组提交里一般需要包含一个 app 版本，代表该次提审所对应的版本。不过，如果在进行组提交之前已经有一个被批准的 app 版本了，那么这个提交里就可以省略掉这个项目，可以直接提交这个版本对应的一些定制化产品页面、产品页面优化测试、应用内事件，而苹果就会根据这个版本来进行审核。每个平台只能有一个在审的提交。

![7](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/7.png)

### App Store Connect 中的 App Review 提交页面

在更新后的 App Store Connect 程序里，在对应的 App Review 界面可以进行审查的提交，并且还可以看到审查的进度，并在页面里便捷地编辑组提交里的项目、查看被拒绝的原因、回复 App Review 。不过，目前只支持在 iPadOS 和 iOS 平台上使用这些功能。

 <center>
    <img style="border-radius: 0.3125em;
    box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
    src="https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/8.png" width = "70%" alt=""/>
    <br>
    <div style="color:orange; 
    display: inline-block;
    color: #999;
    padding: 2px;">
      审查提交页面
  	</div>
</center>

 <center>
    <img style="border-radius: 0.3125em;
    box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
    src="https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/9.png" width = "20%" alt=""/>
    <img style="border-radius: 0.3125em;
    box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
    src="https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/10.png" width = "20%" alt=""/>
    <img style="border-radius: 0.3125em;
    box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
    src="https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/11.png" width = "20%" alt=""/>
    <br>
    <div style="color:orange; 
    display: inline-block;
    color: #999;
    padding: 2px;">
      提交详情页面及回复页面
  	</div>
</center>

## App Store Connect API 更新

接下来就是重磅的 App Store Connect API 更新啦，在本文我们将会对应用基准测试工具、用户订阅状态即时获取这两个重要更新进行讲解，并展开最佳实践讨论。

### 应用基准测试工具

本次更新 App Store Connect 将会新增一个名为 App Benchmarking 的新功能，在该页面内可以非常直观地看到你所开发的应用在同类别的应用中对应指标的排名，例如转化率、留存率、付费用户平均收益等。界面会画出对应 25%、50%、75% 的百分位线，帮助开发者判断应用对应指标的优劣。开发者也可以根据这些数据针对性地提升应用对应的功能，更有方向性地进行优化。

![13](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/13.png)

目前苹果提供的可比指标有以下几种：

1. 应用获取场景：转化率

2. 应用使用场景：次日留存率、7 日留存率、28 日留存率、崩溃率

3. 应用盈利场景：付费用户平均收益

![14](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/14.png)

苹果一向非常看重隐私，因此这次的应用基准数据也采取了一定的保密措施，在保护应用程序隐私的同时创造出这样的相关对比组和基准信息。首先，对比组的构建基于两个规则：1. 应用类别，如旅行、图片视频、动作游戏等，相同的应用类别才会进行比较；2. 盈利方式，如免费、免费增值、付费、订阅等，由于不同盈利方式的应用的质量和预期效果会有区别，因此盈利方式也被纳入了构建对比组的考虑中。其次，在隐私方面，苹果采用了一种叫做差异隐私的技术来进行信息的聚合，在每个对比组里会添加少量的噪音，并保证组内的应用程序个数足够多，在这样的操作下，数据集内的噪音就能掩盖对比组的确切组成，因此开发者就不能知道一个特定的应用到底在不在当前的对比组中，同时也不会破坏组内数据的相关性，提供对比信息。

![15](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/15.png)

那么，对于开发者来说，我们看到了这些指标后，可以对应去做出什么样提升呢？苹果也给出了他的建议：

* 针对应用获取场景，我们可以通过定制化产品页面和产品页面优化这两个工具来针对不同的用户群体展示不同的界面，或者是使用不同的 icon 、图片、布局方式来进行测试，挑选出用户更喜欢的界面，以此来提高你所开发应用程序的下载转化率。

* 针对应用使用场景，苹果提供了一系列的应用内事件和 App Clips 轻应用功能，帮助我们展示应用丰富的功能场景，并通过 App Clips 轻应用快速完成微任务，提高程序的便捷性，吸引用户从而提高留存率。

* 针对应用盈利场景，则可以使用不同的定价策略，让用户根据自己的喜好和付费金额定制自己的体验，以及使用个性化的 IAP 促进方案来提高应用的平均收益，我们下文就会使用此次 App Store Connect API 更新的用户订阅状态即时获取功能来展开 IAP 促进方案的最佳实践。

![16](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/16.png)

### App Store Connect API - 用户订阅状态即时获取

此次 App Store Connect API 新增了用户订阅状态和购买历史的获取 API ，无论是 StoreKit 2 和之前版本的 StoreKit 都可以实现这个功能，这无疑提供了我们一个利器来判断用户当前所处的购买状态，以此针对性地展示个性化页面，为用户提供最新的产品。不进如此，我们还可以提供适当的优惠策略吸引老用户来恢复购买，因此来实现 IAP 促进方案。

#### 核心状态定义

首先，苹果定义了以下核心产品状态：non-consumables 非消耗品，non-renewing subscriptions 非更新订阅，auto-renewable subscriptions 自动更新订阅，其中非更新订阅和自动更新订阅可归为订阅一类。

对应的，用户也有以下几种核心状态：in-depth new customers 全新用户，purchased and active subscriber 已购或已订阅用户，inactive purchase or inactive subscriber 购买或订阅已过期的用户。全新用户状态标识该 Apple ID 的用户从来没有发生过应用内购买交易，因此对这类用户，我们可以提供默认的促销页面，提供多套 IAP 方案供用户选择。而对于处于已购或已订阅用户状态的用户来说，他们当前是有商品交易正在生效的，因此我们需要在页面内提供对应的服务信息，保证他们的权益。购买或订阅已过期的用户状态则代表该用户在之前有进行过应用内购买，但由于产品或服务过期或被撤销而不再享有该产品或服务的用户。针对这类用户，我们可以考虑提供恢复订阅优惠，让这部分用户重新活跃起来。

![17](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/17.png)

#### API 讲解

我们如何在 app 启动时获取到用户的订阅状态，以此来展示对应的个性化界面呢？这里主要有三个步骤：开启 App Store 交易监听，确定客户的产品状态，检查是否有正在生效的自动更新订阅。通过这三个步骤所获得的数据我们就可以判定用户所处的状态及他购买的产品信息，以此来决定 app 启动后展示给用户的界面是怎么样的。

##### StoreKit 2

在 StoreKit 2 中，开启 App Store 交易监听的 API 如下：

```swift
// StoreKit 2
for await result in Transaction.updates {
    do {
        // check if the transaction is verified
        let transaction = try checkVerified(result)
        await self.updateCustomerProductStatus()
        await transaction.finish()
    } catch {
        // error handle
    }
}
```

接下来，确定客户的产品状态则要用到 currentEntitlements 来主动请求客户的活跃交易，并通过 transaction.productType 来判断产品的状态，以此做不同的页面设计：

```swift
// StoreKit 2
for await result in Transaction.currentEntitlements {
    do {
        // check if the transaction is verified
        let transaction = try checkVerified(result)
        switch transaction.productType {
        case .nonConsumable:
            // nonConsumable state handle
        case .nonRenewable:
            // nonRenewable state handle
        case .autoRenewable
            // autoRenewable state handle
        default:
            break
        }
    } catch {
        // error handle
    }
}
```

最后，针对自动更新订阅，我们还需要获取一下他们的状态，检查自动更新订阅是否过期、被撤销或者处于扣费失败的重试周期。

```swift
// StoreKit 2
subscriptionGroupStatus = try? await subscriptions.first?.subsciption?.status.first?.state
if (subscriptionGroupStatus == .expired) {
    // expired state handle
} else if (subscriptionGroupStatus == .revoked) {
    // revoked state handle
} else if (subscriptionGroupStatus == .inBillingRetryPeriod) {
    // inBillingRetryPeriod state handle
}
```

##### StoreKit 1

StoreKit 想要实现上面这些功能，首先需要使用 appStoreReceiptURL 来检索 app receipt ：

```swift
// StoreKit 2
subscriptionGroupStatus = try? await subscriptions.first?.subsciption?.status.first?.state
if (subscriptionGroupStatus == .expired) {
    // expired state handle
} else if (subscriptionGroupStatus == .revoked) {
    // revoked state handle
} else if (subscriptionGroupStatus == .inBillingRetryPeriod) {
    // inBillingRetryPeriod state handle
}
```

然后发送到 App Store Server 的 verifyReceipt 节点来进行验证：

![18](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/18.PNG)

最后，就可以收到对应的 receipt JSON，里面就包含了交易信息列表，以此就可以进行产品状态的判断了。StoreKit 的 Entitlement Engine 同样支持 new customer product 状态以及 non-consumables 和 non-renewing subscriptions product types 。具体可以点击 WWDC20 的 [Architecting for subsciptions](https://developer.apple.com/videos/play/wwdc2020/10671/) 这篇 session 来详细看看。

### 最佳实践讨论

接下来我们用一个例子来展开用户订阅状态即时获取的最佳实践讨论。首先开启 App Store 交易监听时，我们需要进行交易的验证，确认交易的有效性：

![19](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/19.png)

接下来，我们通过轮询 currentEntitlements 来获得客户的活跃交易，并通过 transaction.productType 来判断产品的状态，把他们加到对应显示的组别中。其中别忘了需要获取一下自动更新订阅的状态，检查是否过期、被撤销或者处于扣费失败的重试周期：

![20](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/20.png)

![21](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/21.png)

![22](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/22.png)

最后，根据用户所处的购买状态，就可以进行个性化应用程序界面的设计了：

* 若前面所说的所有三种应用内购买产品类型都没有查到活跃交易，那么客户就可以被归为我们前面提到的全新用户，此时用户打开应用，就会看到默认的欢迎页，此界面上有个按钮，点击可跳转到“商店”页面进行购买。

![23](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/23.png)

<center>
    <img style="border-radius: 0.3125em;
    box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
    src="https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/24.png" width = "30%" alt=""/>
    <img style="border-radius: 0.3125em;
    box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
    src="https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/25.png" width = "30%" alt=""/>
    <br>
    <div style="color:orange; 
    display: inline-block;
    color: #999;
    padding: 2px;">
      全新用户打开 app 后的欢迎页 以及 点击跳转商店后展示的购买页面
  	</div>
</center>

若检测到当前用户已有购买订单，那么用户打开应用后就能看到他们购买产品的信息，并用一个绿色的已勾选复选框来表明应用程序已确认这些购买成功，并已启用了它们。

![26](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/26.png)

![27](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/27.png)

![28](https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/28.png)

<center>
    <img style="border-radius: 0.3125em;
    box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
    src="https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/29.png" width = "30%" alt=""/>
    <img style="border-radius: 0.3125em;
    box-shadow: 0 2px 4px 0 rgba(34,36,38,.12),0 2px 10px 0 rgba(34,36,38,.08);" 
    src="https://cdn.jsdelivr.net/gh/chenjiamin1130/md_imgs/img/30.png" width = "30%" alt=""/>
    <br>
    <div style="color:orange; 
    display: inline-block;
    color: #999;
    padding: 2px;">
      已购买用户打开 app 后的欢迎页 以及 点击跳转商店后展示的购买页面
  	</div>
</center>

最后，对于已购买但当前订单已失效的用户，我们可以在启动页展示恢复购买的按钮，并展示对应的促销优惠信息，吸引用户进行点击购买。

通过这个例子，我们了解到了如何使用 StoreKit 2 和 StoreKit 来获取用户订阅状态，在用户点击打开 app 前就主动检查购买情况，并根据结果个性化展示页面，以此来实现 IAP 促进方案。

测试时，可以使用沙盒、TestFlight、Xcode StoreKit Testing 来测试应用是否符合预期。

## 总结

本次 App Store Connect 的更新真的很多，本文只是取了其中的几个重点更新：增强的 App Store 提交体验、应用基准测试工具、用户订阅状态即时获取来进行了讲解，其他内容可以查阅前面提到的一些 session 去进一步深挖。总体来说，应用基准测试工具、用户订阅状态即时获取这两个功能都能较大地帮助开发者对自己 app 的表现进行分析和有方向性地提高，促进 app 的收益，希望对你们有帮助！
