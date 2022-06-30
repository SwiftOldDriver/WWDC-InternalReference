---
session_ids: [110371]
---

# 【WWDC 110371】 多平台开发那些事

> 作者：Sinter，iOS 开发者
>

> 审核：四娘，老司机技术周报成员
>

## 序

产品支持多平台是一个常见的运营思路，一般而言又分为以下两种：

- 支持移动平台：Android iOS
- 支持苹果生态：iOS iPadOS macOS watchOS

为了提高生产力，许多公司/开发会使用跨平台技术进行开发：

- 针对移动平台：有 Flutter 和 React Native 跨平台技术。
- 针对苹果生态：早些年，开发 iOS iPadOS 应用需要 UIKit ，开发 macOS 应用需要 AppKit，需要创建两个项目，二者差异大，维护两端成本高。

而现在，使用 Xcode 14，只需一个项目即可开发多平台应用。

本文将结合 [WWDC 110371 session](https://developer.apple.com/wwdc22/110371) 从以下几个方面谈谈如何开发多平台应用：

- Xcode 14 创建多平台项目
- 创建多平台项目 Xcode 14 比 Xcode 13 好在哪
- 多平台项目配置
- 旧项目支持多平台
- 多平台项目开发
- 多平台项目下的开发问题
- 多平台项目下应用的发布

> 注：文章撰写时 Xcode 14， macOS 13，iOS 16 均属于 beta 版本，和最终正式版可能会存在一些差异。
>

## Xcode 14 创建多平台项目

打开 Xcode 14，使用 CMD+Shift+N 快捷键，快速打开新建窗口，选择 Multiplatform - App，新建名称为 Xcode 14 的项目，点击 "Next" 完成创建。这时候新建的应用即为多平台应用。
> 注：使用 Xcode 14 创建的多平台应用无法使用低版本 Xcode 打开。

![](./images/1.png)

## 创建多平台项目 Xcode 14 比 Xcode 13 好在哪

熟悉 Xcode 13 的同学会发现，在 Xcode 13 就可以创建多平台应用，但是 Xcode 13 创建的多平台项目各个平台并没有很好的融合在一起。存在一些局限性：

使用 Xcode 13 创建一个多平台应用（如下图），首先看到可以发现，iOS 与 macOS 是区分 TARGETS 的，Target 有着不同的项目配置，那么 iOS 与 macOS 的项目配置就无法共享，如果要统一双平台的配置，那么一个 Target 调整，其他的 Target 都需要跟着调整，十分繁琐。

![](./images/3.png)

然后打开上面使用 Xcode 14 创建的应用，打开通用设置页面，会发现 TARGETS 下只有 "Xcode 14" 而不是 "Xcode 14 (iOS)" 和 "Xcode 14 (macOS)"。结合起来的 Target 说明了在 Xcode 14 下，多平台应用默认共享配置，这在 Xcode 13 下是不存在的。而且如果项目差异大，需要不同的设置，也可以通过新建 Target 来完成使得达到与 Xcode 13 一样的效果。

![](./images/2.png)

除此之外，在 Target 的通用设置页面，可以发现顶部多了支持多平台 (Supported Destinations) 的选项，可以添加、删除项目所支持的平台。

## 多平台项目配置

### 增加、删除平台

上文提到在 Supported Destinations 的选项中，可以添加、删除项目所支持的平台。这里选中 Destination 的 "Mac"，再按下下面的 - 按钮，项目便删除了对 Mac 平台的支持。这时候，让我们再添加回来，点击 Destination 下方的 + 按钮。选择 Mac 后，这里会出现 3 个关于 Mac 平台的选项，一时间很多感触的同学可能不知道怎么选择，看到这里的同学可以先思考下，下文给出选择方法。

![](./images/4.png)

这里的三个选项分别是：Mac、Mac Catalyst、Mac (Designed for iPad)

可以根据以下方法选择适合自己项目的：

1. 如果项目使用 SwiftUI，需要使用 SwiftUI 创造 Mac 原生体验，那么选择 Mac，可以使用 AppKit 实现 SwiftUI 无法完成的需求；
2. 如果项目已有 iOS 应用，使用 UIKit/Storyboard/Xib 开发，那么优先选择 Catalyst，可以把 iOS 应用转换为兼容 Mac 的应用；
3. 如果选择 Mac (Designed for iPad) 则可以让 使用苹果芯片的 Mac 运行 iOS 的应用。
4. 不建议全新开发的 Mac 应用使用 Mac Catalyst，原因如下：
    - Mac Catalyst 无法渐进式地在 AppKit 应用中使用。
    - Mac Catalyst 应用中的 SwiftUI 通过 UIKit 实现，性能相比 AppKit 应用的 SwiftUI 实现有一定差距。

> 注：Mac 和 Mac (Designed for iPad) 可以共存，但是发布到 App Store 最终会默认使用 Mac 的版本，而 Mac 与 Mac Catalyst 无法共存。

### 参数配置

看完了增加、删除平台。接下来说说多平台的参数配置与原先的有何不同。细心的小伙伴会发现 Target 的通用配置页面下面的许多配置项右边多了 + 按钮。

![](./images/6.png)

目前多平台配置支持：最小版本号、应用名称、版本号、编译号、应用图标。

点击 + 按钮即可以配置不同平台的不同参数，例如配置应用名称，这里让我们把 Debug 环境下的 iOS 应用名称改成 "iOS"，macOS 应用名称 改成 "macOS"。这么方便的功能，真想立马用到项目中去。

![](./images/7.png)

## 旧项目支持多平台

### 兼容到 Xcode 14

如果你有使用 Xcode 14 以下版本创建的项目，那么使用 Xcode 14 打开即可以看到多平台选项。添加多平台支持方法和新创建的项目一致。

这里让我们使用 Xcode 14 打开 Xcode 13 所创建的项目，选中名为 "Xcode 13 (iOS)" 的 Target，打开通用设置页添加对 Mac 平台的支持。当项目第一次添加 Mac 支持时，Xcode 会提示会更新 Target 内容包含支持 Mac 平台所需到依赖和框架，原支持 iOS 的 capability 也会支持 macOS。
> 注意：添加 Xcode 支持不会对代码进行修改，如果项目中的 API 不支持 Mac ，需要手动进行修改。

![](./images/5.png)

## 多平台项目开发

新建的项目默认使用的框架为 SwiftUI，无法更改，但是在 Mac 平台，SwiftUI 可以与 Appkit 混编，在 iOS 平台，SwiftUI 可 以和 UIKit 混编。这里简单演示下开发过程：
打开刚才创建的 Xcode 14 项目，在 ContentView.swift 文件中输入以下内容

```swift
struct ContentView: View {
    var body: some View {
        VStack {
            Image("lsj")
            Text("老司机周报")
        }
    }
}
```

这时候在 SwiftUI preview 可以看到针对 Mac 的预览

![](./images/16.png)

既然是多平台开发，验证多平台的 UI 必不可少，接下来让我们添加 iPhone 和 iPad 的预览，在刚才的文件中，加入如下代码，就可以同时看到多平台的预览效果

```swift
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
        ContentView().previewDevice("iPhone 12")
        ContentView().previewDevice("iPad Pro (9.7-inch)")
    }
}
```

![](./images/17.png)

![](./images/18.png)

运行一下，一个简单的多平台应用就完成了。

## 多平台项目下的开发问题

多平台有时会造成一些单平台不会遇到问题，例如：使用的库不支持多平台，只支持某一个平台，特别是第三方库，API 只支持某个特定的平台。

### SDK 不支持所有平台

当我们使用的 SDK 不支持所有平台时，部分代码我们需要显式指定代码编译的条件，只有系统或者 SDK 支持的情况下，才编译打包到对应平台的编译产物里，目前 Xcode 提供了两种控制的方式（颗粒度）：

1. 源码级别。在代码里使用 `#if canImport(xxx)` / `#if os(xxx)` 来控制代码的哪一部分需要被编译。
2. 文件级别。在项目里指定文件需要打包到哪些平台的编译产物里。（Xcode 14）

如果使用了某个只支持单平台的框架，那么默认会造成问题，下面以 ARKit 为例，演示下如何解决该类问题。
`import ARKit` 这行代码在编译 Mac 环境下默认是报错的。

使用`#if canImport *** #endif`来自动判断是否可以导入，如果支持目前的平台，则会导入。

![](./images/8.png)

添加宏之后，可以看到`import ARKit`已经不报错了，然而出现了更多的错误。源文件由于失去了 ARKit 的 import，所有使用 ARKit 框架的属性和方法都报错了。

![](./images/9.png)

在 Target - Build Phases - Compile Sources 下取消 "macOS" 选项的选中。操作之后该 swift 源文件便不在 Mac 环境下参与编译了。报错的地方也就解决了。

![](./images/10.png)

### API 不支持所有平台

除了框架之外，众多 API 也是平台特有的。MenuBar 就是其中一个。如果不进行任何处理，那么在 iOS 平台编译便会报错。使用 `#if os(macOS) *** #endif`就可以指定某段代码只在 macOS 平台下执行。

![](./images/13.png)

看到`#if os` ，聪明的同学应该已经想到了，这里的 os 还支持 iOS、iPadOS、watchOS、tvOS，除了 API 外，一些平台的其他差异内容，比如 UI 尺寸，也可以用该宏进行定制。
> 注：使用多平台开发的时候，编译和测试代码应该在多平台进行，避免写了太多的内容后才发现某个平台出现问题，浪费太多精力。

## 多平台项目下应用的发布

终于等到了这一里程碑时刻，应用创建和开发完成，进入发布阶段。发布应用需要选好要发布的平台，如下图 "My Mac"。然后选择 Product - Archive。与单平台不同的时候，这里需要打包完，再次选择平台，然后再进行 Archive。这个操作并不方便。
> 希望后续可以优化成可以选择打包多平台，例如点击 Archive 后有一弹窗，可以让你选择打包的平台，那么对于没有不打算使用自动构建的用户来说就会方便许多

![](./images/14.png)

![](./images/15.png)

如果有开通 Xcode Cloud 的话那么还能创造不同的工作流，自动上传到 App Store Connect，快速发给内部 TestFlight team 测试等等

## 写在结尾

App Store 上经常可以看到一些精美的应用支持 iOS、iPadOS 双平台，然而当你把目光放到 macOS 时，却不见它们身影，许些遗憾。对于很多 iOS 开发者而言 macOS 开发资料少，难度大，于是都放弃了对 macOS 的兼容。希望通过本文，大家能够对多平台应用开发能有一定的了解，并逐步用上这个技术。
