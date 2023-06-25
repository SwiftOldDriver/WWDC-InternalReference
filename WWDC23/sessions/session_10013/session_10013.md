```
session_ids: [10013]
```

# WWDC23 10013 - Meet StoreKit for SwiftUI

> 本文基于 [Session 10013](https://developer.apple.com/videos/play/wwdc2023/10013) 梳理

内购（IAP）的实现一直是一个复杂棘手的问题。不过最新的 StoreKit 为 SwiftUI 提供了一种非常简洁优雅的实现方式，本文将以实战为基础，由浅入深地进行介绍。

如果你对 IAP 感兴趣，在做相关的工作，或者是独立开发者，那么都非常推荐你详细了解本文的内容。

![](images/0.png)

## 1. 背景知识

### 什么是 Merchandising

本视频中提到的 Merchandising 就是商品销售，也就是 In-App Purchases 的统称。



### IAP：In-App Purchases

IAP，即我们通常谈到的内购，由 App 提供一些商品、内容，供用户付费进行购买。

IAP 可付费购买的内容，一共有四种类型：

- Consumable：消耗型项目。购买后一次性使用的，比如游戏中的金币
- Non-consumable：非消耗型项目。购买一次，不会失效的，比如某一款相机软件中的特殊滤镜，购买后可以一直使用；或者游戏中的某一款特殊装扮，某一个特殊关卡等，比如纪念碑谷中部分需要付费解锁的章节
- Auto‑renewable subscriptions：自动续期订阅。付费会员，按月按季度自动订阅的那种，通常搭配首月优惠
- Non-renewing subscriptions：非续期订阅。付费会员，但是不自动续期，比如单月购买，这种一般会比自动续期的贵一点

![](images/1.png)

### StoreKit 配置文件

通常来讲，需要加入 Apple 开发者计划，才能有后台权限，在 App Store Connect 网站配置 IAP 需要的商品信息。然后才能在 App 上获取到商品，模拟整个的付费流程。

而通过使用 StoreKit configuration file 之后，可以在没有加入开发者计划、没有 App Store Connect 后台权限的情况下，模拟所有付费内容的信息下发，以及整个购买的操作。（这个功能能极大地降低门槛，特别是适合第一次尝试实现内购功能的独立开发者）

![](images/2.png)

一份配置好的 StoreKit 配置文件（StoreKit configuration file），如图所示，就能模拟出所有的付费信息：

![](images/3.png)

与此同时，在使用了 StoreKit configuration file 之后，还可以直接在 Xcode 中使用预览功能，这样能最大化利用 SwiftUI 特性。

> 如果想要进一步了解，可以看往期专题：
>
> - [【WWDC22 10039】Xcode StoreKit 测试的新功能](https://xiaozhuanlan.com/topic/5842093617)
>
> - [WWDC20 10659 - 介绍 Xcode 中的 StoreKit 测试](https://xiaozhuanlan.com/topic/1950472863)



## 2. IAP 实现方案的对比

### 旧：复杂的实现方式

App 本身提供一些商品信息（Product Data），然后根据用户的状态（比如是否订阅等），展示对应的用户界面，以及提供购买的通道。就是如图所示的逻辑：

![](images/4.png)

用户界面（Human Interface）这一部分会涉及到大量的代码逻辑，是一项很复杂的工作：

- Layout：需要绘制大量的 UI 样式
- Assets：需要管理大量的资源
- Accessibility：也许需要做 Accessibility 可用性的适配
- Localization：如果上架多个地区，需要做语言适配
- Interactions：需要处理大量交互逻辑

并且，当用户进行购买操作时，需要手动去请求付费相关的 API，根据 API 返回的结果去更新整个用户界面。但凡稍微了解过 IAP，就知道实现起来有多么复杂，也可以想象这里面有多少坑。

![](images/5.png)



### 新：基于 StoreKit+SwiftUI 的提供的三个 Views

![](images/6.png)

> 适配的版本
>
> - iOS 17.0+，iPadOS 17.0+，macOS 14.0+
>
> - Xcode 15.0+

为了解决上述这个麻烦的过程，现在 StoreKit 提供了一系列基于 SwiftUI 的 Views，可以方便快捷的实现上述功能完整的用户界面。这些 View 封装完整，会自动获取并同步 App 在后台的配置，自动展示。当然因为基于 SwiftUI，也能自动适配各个平台。

具体而言是下面三个 View：

- StoreView：用于实现默认商店列表页面
- ProductView：对应单个商品图，用于实现自定义商品列表页
- SubscriptionStoreView：用于实现订阅页面

接下来我们会通过实战演练，来介绍各个功能。



## 3. 实战使用 StoreView

### 展示所有商品

基础的使用非常简单，注意需要 import StoreKit：

1. 通过 @Query 关键字声明 birdFood 数组，获取到所有的商品信息
2. 将所有商品的 id 数据列表传递给 StoreView
3. StoreView 会自动展示所有内容，包括名称、描述、价格等等

> 关于第一步，需要额外说明的是关于 SwiftData 的使用。
>
> 这里需要先声明一个 SwiftData 模型（BirdFood），再搭配 @Query 关键词，即可实现数据源的自动获取及更新。
>
> 如果想要了解相关内容，可以参考 [Xcode - SwiftData](https://developer.apple.com/xcode/swiftdata/)

![](images/7.png)

与此同时，StoreView 不仅是使用起来简单，它同时也会处理更复杂的边界情况，进行更细致的优化，比如：

- 默认支持对数据进行缓存，同时包含相应的缓存失效策略，以及内存警告时的清理策略
- 兼容使用 Screen Time，支持 Screen Time 状态下关于 IAP 购买的限制

> 关于 Screen Time 可能大家用的不多，它除了可以统计屏幕使用时长之外，还可以用于家长监控（Parental Control）。家长通常可以通过 Screen Time 设置 App 的使用时长限制，以及指定某些特殊功能的权限，用于限制儿童在使用 App 时的权限。
>
> 因此，付费页面兼容使用  Screen Time，允许家长对 IAP 购买功能的进行控制就是一件非常有必要的事情了。
>
> 关于 Screen Time 更详细的内容，可以参考：[【WWDC21 10123】初见 Screen Time API](https://xiaozhuanlan.com/topic/6874305291)



### 增加商品 icon 展示

上面 StoreView 没有展示 icon，但它支持传入 icon 展示。通过 [Apple - StoreView](https://developer.apple.com/documentation/storekit/storeview) 文档上的描述，可以看出 StoreView 支持 icon 和 placeholder icon 的设置：

```SwiftUI
struct StoreView<Icon, PlaceholderIcon> where Icon : View, PlaceholderIcon : View
```

只需要传入对应的 View 即可，这里对应的是 BirdFoodProductIcon。

![](images/8.png)



### 自动适配多平台

前文提到自动适配多平台，这里可以用 Apple Watch 看下对应的样式，可以发现效果非常好：

![](images/9.png)



## 4. 实战使用 ProductView

### 自定义商品列表页

这里的使用整体上和 StoreView 非常类似，只不过 StoreView 对应整个商品列表页，而 ProductView 对应单个商品：

1. 筛选出 bestValue 的商品，嵌套进 ScrollView，用于展示在列表最顶部
2. 使用 ProductView，并且传入 icon，使用方式和 StoreView 类似
3. ProductView 会自动展示该商品的详细信息

![](images/10.png)

接下来，再同样使用 ProductView，只不过换一下排列方式，就能快速搭建起整个列表：

![](images/11.png)



### 实现自定义样式

通过 [productViewstyle API](https://developer.apple.com/documentation/storekit/productviewstyle)，即可指定样式。

![](images/12.png)

一共默认有四种标准样式：

- automatic
- compact
- regular
- Large

![](images/13.png)

当然，StoreView 也可以统一指定 style，只不过没有办法像使用 ProductView 时一样按商品分开设置。

![](images/14.png)



## 5. 实战使用 SubscriptionStoreView

### 展示订阅页面

首先我们来回顾一下前文提到的 StoreKit 配置文件，在里面我们配置了一些订阅选项信息。

1. 我们有一个订阅群组，它有一个唯一标识叫 GroupID
2. 这个订阅群组内有三个不同的订阅物品，每个物品包含其唯一标识 ProductID

> 这里再额外补充讲解一下订阅群组、订阅物品之间的关系：一个订阅群组可以包含多个订阅，订阅组之间的订阅互斥；同一订阅群组持续订满一年开发者享受 85% 的分成。
>
> 详细了解可以参考：[Apple - 自动续期订阅](https://developer.apple.com/cn/app-store/subscriptions/)

![](images/15.png)

订阅页面的使用方法和之前一样，也非常简单：

1. 通过环境变量配置 GroupID（这里的 GroupID 在代码中写死，和 StoreKit 中对应的 GroupID 一致，这样才能保证自动获取到对应的信息）
2. 直接使用 SubscriptionStoreView，传入 GroupID
3. 会自动展示配置的订阅信息

> 补充说明，在实际应用中，GroupID 可以通过以下两种方式拿到
>
> - Original StoreKit，iOS 12+：[subscriptionGroupIdentifier](https://developer.apple.com/documentation/storekit/skproduct/2981047-subscriptiongroupidentifier)
> - StoreKit 2，iOS 15+：[subscriptionGroupID](https://developer.apple.com/documentation/storekit/product/subscriptioninfo/3791959-subscriptiongroupid)

![](images/16.png)

同时，SubscriptionStoreView 也会自动根据用户的订阅状态进行 UI 的更新，以及检查用户是否有资格获得推介促销（introductory offer）。

> 关于推介促销优惠 introductory offer，一般表现为免费试用，或者是折扣优惠。比如上图中的 "Try it Free"，首月试用，就是配置了推介促销的结果。
>
> 可以通过 [Apple - 在 App 中实现推介促销优惠](https://developer.apple.com/cn/documentation/storekit/in-app_purchase/subscriptions_and_offers/implementing_introductory_offers_in_your_app/) 详细了解。



### 自定义 header 样式及 header 背景

像给 ProductView 传入 icon 一样，通过尾随闭包将自定义 header 传入 SubscriptionStoreView 即可：

![](images/17.png)

如果使用新的 [containerbackground API](https://developer.apple.com/documentation/swiftui/view/containerbackground(for:alignment:content:))，可以实现更好看的背景效果：

![](images/18.png)



### 自定义整体页面背景

通过设置 backgroundStyle，将默认背景隐藏，统一使用 header 背景，可以增加统一性：

![](images/19.png)



### 设置订阅按钮样式

可以通过 [subscriptionStoreButtonLabel(_:)](https://developer.apple.com/documentation/swiftui/view/subscriptionstorebuttonlabel(_:)/) 配置样式

![](images/20.png)



### 配置订阅选项背景

通过 [subscriptionStorePickerItemBackground(_:)](https://developer.apple.com/documentation/storekit/subscriptionstoreview/4204236-subscriptionstorepickeritembackg) 配置背景：

![](images/21.png)



### 增加兑换码入口

仅用一行代码，即可自动增加兑换码（redeem code）使用入口：

![](images/22.png)



### 自动更新订阅状态

SubscriptionStoreView 是默认支持检测用户订阅状态的，如果订阅用户打开订阅页面，能够通过标记看到目前的订阅方案，当前收费标准，以及订阅按钮会变灰。

![](images/23.png)

这种自适应已经能够降低非常大的工作量了，当然最好的方式还是当用户已经是订阅用户时，就不展示订阅付费页面。



## 6. 实现业务逻辑

### 前置准备

上述的新功能，大大简化了 App 实现 IAP 所需要的工作量。但是有一部分内容刚才没有提到，就是业务逻辑。业务逻辑没有办法避免的，包括：

- 解锁付费内容：我们需要在用户完成付费之后，解锁相关的付费内容。
- 隐藏订阅页：如果用户已经完成过购买，那么就需要关闭订阅页面，并且隐藏各个订阅页面入口

StoreKit 也提供了一些新的 API，方便开发者实现上述功能。不过在此之前，还是需要先完成一些基础的功能，包括：

- 处理付费交易结果
- 通过后台验证交易信息
- 统计已购买的商品数量
- 创建 UI 需要的数据模型

本文所用的案例，业务逻辑的处理部分可以参考 BirdBrain 文件，我在这里简单标注了源码中的两个核心方法，大家可以参考着看，了解 BirdBrain 的大概逻辑：

![](images/24.png)

> 如果想要深入了解这一部分的内容，推荐参考下面两期的内容：
> - [【WWDC21 10114】 初见 StoreKit 2](https://xiaozhuanlan.com/topic/6138790425)
> - What's new in App Store server APIs - WWDC23



### onInAppPurchaseCompletion - 商品购买结果回调

在上述三个 StoreKit Views 中要处理购买结果，是非常简单的事情，通过 onInAppPurchaseCompletion 回调即可在每次内购完成的时候做相应的处理。

![](images/25.png)

要实现上面的效果，我们需要进行下面几个步骤：

1. 在 BirdFoodShop 文件中增加相关逻辑。联系前文，BirdFoodShop 是我们通过 ProductView 实现商品页面展示的地方。
2. 增加 onInAppPurchaseCompletion 回调，当内购操作完成时，会执行 block 中的内容
3. 验证结果成功后，通知 BirdBrain，处理业务逻辑，比如增加已购买商品的数量
4. 完成内购，关闭当前内购页面

![](images/26.png)



### onInAppPurchaseStart - 商品购买开始时刻

onInAppPurchaseStart，会在点击了购买按钮后回调。这可以用于购买时的动画效果，比如点击购买后，就将对应按钮变暗，告知用户当前进度。

![](images/27.png)



### 使用生命周期回调的注意事项

当使用 onInAppPurchaseCompletion、onInAppPurchaseStart 处理商品购买时，有一些需要注意的点：

- 这两个函数仅在作用于 StoreKit Views 时才生效
- 可以同时处理多个 actions，互不影响
- 这些回调，全部是可选使用的。如果不直接通过这几个回调处理，那么内购结果会默认通过 Transaction.updates 方法进行处理。

![](images/28.png)

- 直接把 nil 传入这些回调当中，能阻止其父 Views 处理生命周期回调事件，相当于回到默认状态，由 Transaction.updates 方法进行处理。



### subscriptionStatusTask - 订阅结果回调

一个完整的订阅流程应该如下图所示，在订阅完成后自动隐藏入口：

![](images/29.png)

基于 subscriptionStatusTask 修饰词，可以方便快捷的实现这一逻辑：

1. 在 BackyardGrid 文件中增加逻辑，这里对应上面的左图，包含订阅页面入口
2. 增加 subscriptionStatusTask，监听订阅付费结果
3. 当付费成功后，通过 BirdBrain 更新，获取到用户的当前订阅状态，设置给 passStatus。这样当 passStatus 改变，就可以利用它去更新入口的展示情况

![](images/30.png)



### currentEntitlementTask - 另外两种 IAP 商品的回调

- Non-consumable：非消耗型项目
- Non-renewing subscriptions：非续期订阅

对于这两种类型，也有一个新的 API 用来检查用户的付费状态：currentEntitlementTask。只需要传入对应的 productID，然后当购买状态发生变化时，系统就会自动回调这个 block。

![](images/31.png)

上面两个回调，都会传入一个 state 状态，也就是 entitlement task 的状态，我们可以分别处理不同状态时的 UI 表现。

![](images/32.png)



## 7. 深入探索 UI 样式的优化

### 优化商品 icon 的展示

自定义 placeholder icon 样式：

![](images/33.png)

ProductView **支持**自动展示配置的 promotional icon，仅需在初始化时设置 prefersPromotionalIcon。注意，如果同时设置了展示 promotional icon 和自定义 icon，那么会优先展示 promotional icon，没有的话才展示自定义 icon。

![](images/34.png)

当然，这种 promotional icon 的边框效果，也可以通过自定义 icon 实现，只需要添加一个额外的修饰词：

![](images/35.png)

> 如果想要深入了解 Promotional icon 相关的内容，可以看：
>
> - What's new in StoreKit 2 and StoreKit Testing in Xcode - WWDC23
> - What's new in App Store Connect - WWDC23



### 自定义 Product View 样式

以加载态为例，如果我们想要将默认的加载态（Placeholder 占位），改成小圆圈 loading，应该怎么做呢？

![](images/36.png)

那么我们可以自定义一个 Product View 样式，来解决这个问题：

1. 声明一个自定义样式，遵循 ProductViewStyle
2. 实现 makeBody 方法，其中 configuration 中包含一切需要的信息，包括目前的状态
3. 在 loading 状态下，使用小圆圈 loading 的样式，其他状态下使用 ProductView 默认形式

![](images/37.png)

最后，直接将自定义效果应用于 ProductView 即可：

![](images/38.png)

同样类似的方法，也可以自定义 ProductView 的展示样式，如下图所示。不过需要注意的是，记得使用 configuration.purchase() 方法，来响应用户真正的购买操作：

![](images/39.png)



### 缓存商品数据

StoreKit Views 内部已经实现了关于缓存的逻辑，通过 storeProductsTask 修饰词供开发者直接使用。

任何 View 都可以作为一个载体，根据 Product ID 来缓存对应的商品数据，StoreKit 底层会自动获取、更新、缓存商品数据。

![](images/40.png)

注意，这个修饰词也会返回 state，反应的是当前加载的进度。



### 实现全局 Loading 样式

如果要实现左图到右图的效果，将默认的占位效果改为整体的 loading 效果，应该如何实现呢？

![](images/41.png)

这里就需要将所有独立 ProductView 的状态，统一收集到一起，来控制整体的加载态了。

![](images/42.png)

左图是最开始的情况：

- 每个 ProductView 独立管理他们自己的状态，异步加载
- 每个 ProductView 都会有默认的加载效果，加载完成后展示

右图是期望的情况：

- 所有 ProductView 的状态，都放在上一级中统一管理
- 当所有数据加载完成后，再去一次更新所有的 ProductView 样式

要实现这种改变，正好可以利用刚才提到的缓存方法 storeProductsTask。我们利用回调 block 中的 state 状态参数，我们可以再 loading 状态进行特殊处理，即可达到目的。

![](images/43.png)



### 增加辅助功能按钮

在 StoreKit 中实现辅助功能按钮（auxiliary buttons）非常简单，只需要通过 storeButton 这个修饰词即可：

这里支持的属性如下：

![](images/44.png)

需要额外注意的是，如果使用 signIn 登录功能，需要额外搭配 subscriptionStoreSignInAction：

![](images/45.png)

而针对 policies 按钮，也提供了设置默认颜色的方式：

![](images/46.png)



### 整体调整 SubscriptionStoreView 样式

直接使用 subscriptionStoreControlStyle 即可。一共有三种内置样式，支持不同的平台，以及默认使用的 Automatic 自动选择：

![](images/47.png)



### 订阅按钮样式

通过 subscriptionStoreButtonLabel 来设置各种订阅按钮的展示样式：

![](images/48.png)



### 增加装饰图

![](images/49.png)



### 增加订阅页面背景色

![](images/50.png)

> 想要了解更多 containerBackground 相关的 API，可以参考：
>
> - What's new in SwiftUI - WWDC23
>



### 支持升级订阅

当订阅用户存在升级的选项时，我们可以通过 visibleRelationships 来为已经订阅的用户，展示升级页面。用户可以通过 upgrade 按钮升级为更高等级的订阅用户。

![](images/51.png)

注意，在这种情况下，我们最好也展示当前用户的订阅状态，以及对订阅等级进行详细的描述，进而获得更好的用户体验。



## 8. 总结与评价

✅ 本次针对 IAP 发布的，基于 StoreKit + SwiftUI 的这套解决方案，可以说是非常实用，优势非常明显：

1. 能够方便快速的制作出商品&订阅页面，并且自带的样式也足够好看
2. 默认支持非常多 IAP 相关的底层能力，如商品缓存、兑换码 redeem code、推介促销 introductory offer 等
3. 兼容性强，自动适配多平台、多语言，几乎不需要根据平台写独立的适配代码
4. 审核被拒的概率大大降低。Apple 本身对 IAP 审核是相对严格的，有一系列要求（比如要展示相关政策的入口、提示文案不能太小、首购优惠价格不能展示过大等等），在使用这一套方案的情况下，能最大程度一次性规避问题。

❌ 不过，受制于 SwiftUI 的基础限制，以及模板化方案架构设计，导致目前大公司难以应用此套方案：

1. 基于 SwiftUI，iOS17+ 才能使用，几乎决定了短期内大公司大平台难以采用
2. 模板化方案，虽然官方提供了一些自定义配置的接口，但是整体拓展性还有待验证；如果想要做出别具一格的设计，可能很难直接套用这一套官方模板。



总的来说，对于独立开发者：

1. 如果恰好使用 SwiftUI 开发，那么是非常有必要认真学习本文的，这套方案在不久的将来很可能会成为主流。
2. 本文也介绍了相关的开发流程，以及展示了标准的页面设计；认真阅读，将能够学习到如何正确的实现和设计 IAP 流程。
3. 在文中，Apple 也展示了一个简洁且优雅的付费页面设计方案。独立开发者可以参照现有设计，融合自身业务的设计元素和特点，设计出有特色的付费页面。

