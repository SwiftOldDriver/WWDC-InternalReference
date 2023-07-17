---
session_ids: [10165]
---

# WWDC23 10165 - What's new in Xcode 15

本文基于 [Session 10165](https://developer.apple.com/videos/play/wwdc2023/10165/) 梳理

> 作者：Noah，现就职于米哈游，从事游戏 iOS SDK 的研发工作。
>
> 审核：皮拉夫大王，目前就职于抖音基础技术团队，负责 iOS 稳定性相关工作。

> **注：本文使用 Xcode 15.0 beta 2(15A5161b) 版本，由于本文撰写时，Xcode 15 处于 beta 阶段，苹果会不断进行更新，后续如有更多功能上的新增或改进，我们将会更新本文内容。**

- [WWDC23 10165 - What's new in Xcode 15](#wwdc23-10165---whats-new-in-xcode-15)
  - [TL;DR](#tldr)
  - [更智能的 Xcode](#更智能的-xcode)
    - [更智能的代码补全体验](#更智能的代码补全体验)
      - [根据首字母匹配相应的文件名](#根据首字母匹配相应的文件名)
      - [多参函数，列出所有可能的参数排列](#多参函数列出所有可能的参数排列)
      - [智能分析代码上下文，给出合适的代码建议](#智能分析代码上下文给出合适的代码建议)
    - [Assets.xcassets 添加的资源文件，自动生成 symbols 常量](#assetsxcassets-添加的资源文件自动生成-symbols-常量)
  - [更简洁的 Xcode](#更简洁的-xcode)
    - [IDE 安装包拆包下载](#ide-安装包拆包下载)
    - [string catalog](#string-catalog)
    - [Swift DocC](#swift-docc)
    - [Swift Macros](#swift-macros)
    - [OSLog](#oslog)
  - [更高效的 Xcode](#更高效的-xcode)
    - [实时预览优化](#实时预览优化)
      - [基于 `#preview` 宏快速创建预览实例](#基于-preview-宏快速创建预览实例)
      - [AppKit、UIKit 实时预览](#appkituikit-实时预览)
      - [Widget 预览支持](#widget-预览支持)
    - [书签](#书签)
    - [源代码托管优化](#源代码托管优化)
    - [测试优化](#测试优化)
    - [App 发布](#app-发布)
      - [Xcode Cloud App 发布更新](#xcode-cloud-app-发布更新)
      - [框架签名](#框架签名)
      - [Privacy Manifest](#privacy-manifest)
      - [TestFlight 支持仅发布到内部](#testflight-支持仅发布到内部)
  - [其他功能更新（基于 Xcode 15 beta2 release notes）](#其他功能更新基于-xcode-15-beta2-release-notes)
    - [Clang 编译器 \& 链接](#clang-编译器--链接)
    - [Assets Catalogs](#assets-catalogs)
    - [构建系统](#构建系统)
    - [调试](#调试)
    - [文档](#文档)
    - [Instruments](#instruments)
    - [测试](#测试)
    - [其他](#其他)
  - [开发者注意事项](#开发者注意事项)
  - [总结](#总结)
  - [参考链接](#参考链接)

## TL;DR

Xcode 是每一个 iOS 开发者开发过程中必不可少的工具，纵使 Xcode 有些不尽人意的地方，但是我们依旧爱之如初。WWDC 上每一次 Xcode 的更新都牵动着我们的神经，每一次 Xcode 更新也总能给我们带来不少惊喜与期待：Xcode 14 解决了 IDE 下载包体过于庞大的问题，提供了更为智能的代码补全体验，优化了自身的性能，而这些在本次 Xcode 15 的更新中更进一步，下面我们就一起看看 Xcode 15 都有哪些令人振奋的更新与优化吧。

本文主要分为智能、简洁、高效以及开发者注意事项四个模块，由于文章篇幅比较长，读者可以根据本文目录挑选感兴趣的内容进行阅读。

1. 更智能的 Xcode：
   - 更加智能的代码补全体验，iOS 开发者也可以用上更加智能好用的代码补全能力了。
   - 在 Assets.xcassets 中添加资源文件，自动生成 Swift symbols，可在编译期进行检查，更加智能安全。
2. 更简洁的 Xcode：
   - IDE 安装包拆分下载。
   - string catalogs 引入 `.xcstrings` 文件格式，管理本地化字符串更简洁高效。
   - Swift DocC，新的 doc 卡片、支持文档预览。
   - 新增 Swift Macros，默认隐藏宏实现，可展开 debug
   - OSLog，更简洁优雅的 console 输出
3. 更高效的 Xcode：
   - UIKit 实时预览。
   - 书签，支持标记代码，快速定位需要访问的代码。
   - 源代码托管，Xcode 15 内置的 source control 终于达到可用状态。
   - 测试速度更快，测试报告更丰富。
   - App 发布：
     - Xcode Cloud App 发布支持查看 TestFlight 报告
     - XCFramework 签名 & 验签支持
     - Privacy Manifest，支持在 Xcode 中编辑一份隐私清单
     - TestFlight internal only：只对内发布测试
4. 其他功能更新：
   - Quick Action
5. 开发者注意事项：罗列 Xcode 15 更新后开发者需要注意的事项
![summary](./images/summary.png)

## 更智能的 Xcode

### 更智能的代码补全体验

相对于其他 IDE 的代码补全能力，比如隔壁 jetbrains 全家桶，Xcode 的代码补全只能说可用，并不算优秀，苹果的开发工程师可能也知道这一点，在 Xcode 14 和 15 中都对代码补全能力做了优化，使得代码补全更加智能，更智能高效的代码补全能力，能够提升我们的开发效率并且降低在代码编写时的错误。现在 iOS 开发者终于可以不用眼馋隔壁小伙伴啦，在 Xcode 15 中，针对代码补全苹果做了如下的优化和改进：

#### 根据首字母匹配相应的文件名

我们在 demo 中新建一个 `swift` 文件，取名为 `ContentBackgroundView`，新建后的 `swift` 文件是一个空文件，为了实现功能，我们需要
进行一些代码编写，我们键入 `class` 或者 `struct` 后再键入新建文件的首字母 `C`，可以看到 Xcode 能够立即弹出相应的提示：
![code_complete](./images/code_complete_1.png)

#### 多参函数，列出所有可能的参数排列

当我们调用有多个参数的函数时，需要传入哪些参数，如果没有代码补全提示往往是比较困难的，Xcode 15 对此做了优化，当我们调用的函数有多个参数时，会列出所有可能得参数排列选项供我们选择使用，这样使得我们的编码效率更高效。
![code_complete](./images/code_complete_2.png)
上图我们键入 `.fr` Xcode 自动提示我们 `frame` 函数，我们点击键盘右箭头就能展开 `frame` 函数参数的所有可能情况了。

#### 智能分析代码上下文，给出合适的代码建议

在 Xcode 15 中，Xcode 可以自动分析代码上下文，并且给出合适的代码补全建议。比如这里我们有个 Text 组件，我们键入 `.` 后，Xcode 会将 `font` 提示置顶，因为 Xcode 根据代码上下文知道这是一个 `Text` 并且可能没有对 `font` 做处理，很有可能需要处理 `font`，于是将 `font` 提示置顶：
![code_complete](./images/code_complete_3.png)
键入 `font` 后再键入 `.`，此时 Xcode 会将 `fontweight` 以及 `bold` 等置顶，因为很有可能我们下一步就要设置这两个属性：
![code_complete](./images/code_complete_4.png)

### Assets.xcassets 添加的资源文件，自动生成 symbols 常量

Xcode 15 会自动生成 Color 和 Image assets 的 symbols，因此我们可以直接在代码中通过这些 assets 的常量名进行直接引用，不必再以字符串的形式进行引用，这样做的好处如下：

1. 在编译期就能做一些编译检查，比如我们在某次更改中，改了某个 image assets 的名字，这时候如果通过硬编码字符串，在编译期是无法进行检查的，只有在 App 运行后我们才能看到这张图片无法展示（或者进行全局的字符串搜索），编译期检查能够降低一定出现线上问题的概率。
2. 根据 Assets 自动生成的 symbols 可以使用 Xcode 15 强大的代码补全能力，方便我们选择适当的资源文件。
![asset_catalog](./images/asset_catalog_1.gif)
上面的 gif 演示了 Xcode 15 Assert Catalog 的新特性，我们看到在 Assets 中有一张名为 `sun` 的图片，我们把它重命名为 `sunny` 此时，回到代码编辑界面，发现代码报错（找不到名为 `sun` 的图片），我们编辑代码，Xcode 15 弹出代码提示，改为 `sunny` 后，代码不再报错，可以正常预览。
由此可见，自动生成的 Swift symbols 确实能够方便我们尽早发现资源问题，也能方便我们快速编写代码（要是支持预览就更好了）。
3. 我们也可以更方便地做一些资源清理的操作，只需要扫描没有被使用到的  symbols 即可。

> 值得注意的是，目前 Assert catalog 仅仅支持创建 `Assets` 中的图片以及颜色资源的 symbol，即支持的资源文件如下：
> *Image Set：图片*
> *Color Set：颜色*
> *Symbol Image Set：符号图片（svg）*

读到这你是不是也很好奇 Xcode 15 是怎么做到将 Asset Catalog 中的图片和颜色资源转成 symbol 的？Session 中没有具体阐述，我们深入研究下~
既然是编译期做的事情，我们操作编译一下，然后找到编译日志中有关 asset catalogs 的日志，找到相应编译产物的路径：
![asset_catalog](./images/asset_1.png)
可以看到 `Generate asset symbols` 执行完成后生成了两个产物分别是：

- `GeneratedAssetSymbols.h`
- `GeneratedAssetSymbols.swift`

这里我们着重看下生成的 `GeneratedAssetSymbols.swift` 代码（下面所列代码为部分重要代码片段）

```swift
// MARK: - Color Symbols -

@available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *)
extension DeveloperToolsSupport.ColorResource {

    /// The "bgColor" asset catalog color resource.
    static let bg = DeveloperToolsSupport.ColorResource(name: "bgColor", bundle: resourceBundle)

}

// MARK: - Image Symbols -

@available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *)
extension DeveloperToolsSupport.ImageResource {

    /// The "sunny" asset catalog image resource.
    static let sunny = DeveloperToolsSupport.ImageResource(name: "sunny", bundle: resourceBundle)

}
```

可以看到编译后根据项目中 Assets 类型自动生成了两个 `extension` 分别扩展
`DeveloperToolsSupport.ColorResource` 和 `DeveloperToolsSupport.ImageResource`，由于 Color 和 Image 的实现代码几乎一致，下面我们以 Image 举例，看下具体做了什么事情：

```swift
private init?(thinnableName: String, bundle: Bundle) {
#if canImport(AppKit) && os(macOS)
        if bundle.image(forResource: NSImage.Name(thinnableName)) != nil {
            self.init(name: thinnableName, bundle: bundle)
        } else {
            return nil
        }
#elseif canImport(UIKit) && !os(watchOS)
        if UIKit.UIImage(named: thinnableName, in: bundle, compatibleWith: nil) != nil {
            self.init(name: thinnableName, bundle: bundle)
        } else {
            return nil
        }
#else
        return nil
#endif
    }
```

由上述代码可知，调用 `ImageResource` 的初始化方法扩展了一个 `Type Property`：`sunny`。

在 iOS 17 中，苹果给 `Image` 新增了一个初始化方法，支持通过传入 `ImageResource` 参数创建 `Image`。

```swift
@available(iOS 17.0, macOS 14.0, tvOS 17.0, watchOS 10.0, *)
extension Image {

    /// Initialize an `Image` with an image resource.
    public init(_ resource: ImageResource)
}
```

因此可以直接调用 `Image` 新的初始化方法初始化 `Image`：

```swift
Image(.sunny)
```

那如果是 `UIImage`，苹果是怎么处理的呢，我们先来看看如何调用

```swift
UIImage(resource: .sunny)
```

和 `Image` 类似，苹果也给 `UIImage` 新增了一个初始化方法，支持通过传入 `ImageResource` 初始化 `UIImage` 对象（该扩展方法在编译后生成的 `GeneratedAssetSymbols.swift` 文件中）：

```swift
#if canImport(UIKit)
@available(iOS 17.0, tvOS 17.0, *)
@available(watchOS, unavailable)
extension UIKit.UIImage {

    private convenience init?(thinnableResource: DeveloperToolsSupport.ImageResource?) {
#if !os(watchOS)
        if let resource = thinnableResource {
            self.init(resource: resource)
        } else {
            return nil
        }
#else
        return nil
#endif
    }

}
#endif
```

这样，添加到 Assets.xcassets 中的颜色和图片资源文件就成功转成了相应的  `resource`，通过 `extension` 来新增 `UIKit` 和 `SwiftUI` 初始化方法，使得传入 `resource` 进行初始化得以实现，于是我们就能在代码中利用苹果自动生成的 `symbols` 常量做相应的处理了。

注意，如果是 `Color Set`，命名中带有 `Color`，那么在创建 `symbols` 时，`Color` 会被忽略，比如：

```swift
bgColor => bg
background(Color.bg) √
background(Color.bgColor) X
```

## 更简洁的 Xcode

### IDE 安装包拆包下载

去年，Xcode 14 针对安装包庞大下载缓慢的问题做了优化：默认内置安装 iOS 和 macOS 平台的模拟器，诸如 watchOS 和 tvOS 平台的模拟器是可选的安装项，在第一次启动 Xcode 或者以后要用到的时候选择性安装，通过这项举措，Xcode 14 的安装包大小减小了 30%，大大提升了包体下载的速度。Xcode 15 将做出进一步优化：Xcode 本身仅仅内置 Mac 平台的模拟器，iOS 以及其他平台的模拟器也需要进行额外下载才能使用。当我们在 [Apple 开发者官网](https://developer.apple.com/download/all/?q=Xcode) 上下载 Xcode 时，我们可以选择需要下载使用的平台：
![download_xcode](./images/download_xcode.png)
我们可以看到，如果不勾选任何其他的平台，只下载内建平台，只需要下载 3.09G 的包体（Xcode 15 beta2 为例）能够大大提升 IDE 的下载速度。
需要注意的事，当我们下载 IDE 只勾选了默认的平台，没有勾选其他平台，想要创建其他平台的项目时，Xcode 会提示你去下载对应平台的 SDK 否则无法编译或运行：
![need_download_ios](./images/need_download_ios_1.png)
如果我们继续执行 next 创建工程（这里我们创建一个 swiftUI 的工程），我们将会看到如下界面：
![need_download_ios](./images/need_download_ios_2.png)
可以看到 SwiftUI 的预览是不可用的，需要先下载安装（**即使已经连接真机，也是无法 command + R 运行项目的**）。

### string catalog

Xcode 15 引入了一个新的本地化资源的管理方式 `string catalog`，通过 `string catalog` 我们可以更方便的管理本地化资源。
首先假设我们已有的项目中已经有本地化资源，如图所示
![string_catalog](./images/string_catalog_1.png)
在没有 `string catalog` 之前，我们通常需要创建不同语言的目录（或者是不同的 `*.string` 文件），然后进行本地化处理，操作起来还是比较繁琐的。
Xcode 15 为我们提供了便捷的迁移方式，我们只需找到 Xcode 菜单栏的 `Edit -> Convert -> To String Catalogs`，Xcode 便会自动搜索工程内的本地化资源（`.strings`、`.stringsdict`）
![string_catalog](./images/string_catalog_2.png)
并将它们整合到 `Localization` 中，后续我们只需维护该文件即可，我们还能查阅不同语言的翻译进度：
![string_catalog](./images/string_catalog_3.png)
此外，Xcode 15 为我们提供了一个更加简便的方式去维护 `string catalog`，每一次构建，Xcode 都会自动提取代码中所有的字符串，如果新增或者删除某个字符串，Xcode 会自动在本地化目录中标记该字符串的状态，方便我们根据该状态对此维护：
![string_catalog](./images/string_catalog_4.png)

State 有如下四种类型：

- STALE：Not found in code
- NEW：Untranslated
- NEEDS REVIEW：May require change
- ✅：Translated
![string_catalog](./images/string_catalog_5.png)

`STALE` 这个状态比较有意思，表明你在 string catalog 中新增了这个字符串，但是在代码中没有找到，意味着这个字符串很有可能已经被废弃。
`NEEDS REVIEW` 当你改动了某个 string，那么这个 string 的状态就是这个了。
其余的状态就是字面意思理解。

> Tips: 更多关于 string catalogs 参考
> [Session 10155 - Discover String Catalogs](https://developer.apple.com/videos/play/wwdc2023/10155/)

### Swift DocC

Xcode 15 针对文档这块也做了些优化，提供了新的文档卡片样式以及文档的快速预览，助力我们在开发中写出更优质的代码文档。

- 新的文档卡片样式：更加美观、便于阅读
  ![doc](./images/doc_1.png)
- 实时文档预览：
  - 打开方式：Editor -> Assistant -> Documentation Preview
  - 有点类似 MarkDown 的实时预览，编辑 Swift 文档，可以在界面中实时预览文档效果
  ![doc](./images/doc_2.png)
  
> Tips: 更多关于 Swift DocC 参考
> [Session 10244 - Create rich documentation With Swift-DocC](https://developer.apple.com/videos/play/wwdc2023/10244)

### Swift Macros

Swift Macros 允许你将宏生成代码当做其他的代码，能够让 API 表达力更强，并且有助于消除重复的代码。Swift Macros 是 SDK 中 Swift packages 的一部分，目前，苹果已经在 Swift 标准库（@Observable）以及 foundation（#Predicate） 中实现了 Swift Macros，此外，苹果引入了一个新的 Swift data framework（@Model）。
Swift Macros 允许我们创建自定义的宏包（macro package）以便共享，下面我们就来看看怎么自定义宏包，首先我们可以使用快捷组合键 `command` + `shift` + `A` 打开所有的 Xcode 菜单选项检索，然后输入 `new package` 跳转到创建的页面
![macro](./images/macro_1.png)
选择 `Swift Macro`
![macro](./images/macro_2.png)
假设我们已经有了一个实现的 macro package：`EnumHelper`，`CaseDetection` 为其中一个已经实现的宏（宏的魅力在于，其代码和普通的 Swift 代码没有任何的区别）
![macro](./images/macro_3.png)
我们可以这样使用：
![macro](./images/macro_4.png)
可以看到，Xcode 默认会隐藏宏 `CaseDection` 的实现，但是有些时候我们需要对宏进行调试，需要打断点，因此我们需要展开宏，那么如何展开呢？我们还是可以使用 Xcode 15 的新能力：`Quick Action`（组合键：`command` + `shift` + `A`）输入 `Expand Macro` 即可展开 `CaseDection` 宏，以便断点调试：
![macro](./images/macro_5.png)

> Tips: 更多关于 Swift Macros 参考
> [Session 10167 - Expand on Swift macros](https://developer.apple.com/videos/play/wwdc2023/10167)
> [Session 10166 - Write Swift macros](https://developer.apple.com/videos/play/wwdc2023/10166)

### OSLog

今年 Xcode 15 在 Debug 方面的更新主要在 `OSLog`，`OSLog` 是目前苹果力推的日志记录解决方案，`OSLog` 能够统一日志记录，能够很好地捕获运行时的信息，功能十分强大。在 Xcod 15 中，苹果将 `OSLog` 集成至 Xcode，在终端中能够输出结构化的日志信息。下面我们先来看下官方的一个例子：

```Swift
import OSLog

let logger = Logger(subsystem: "BackyardBirdsData", category: "Account")

func login(password: String) -> Error? {
    var error: Error? = nil
    logger.info("Logging in user '\(username)'...")

    // ...

    if let error {
        logger.error("User '\(username)' failed to log in. Error: \(error)")
    } else {
        loggedIn = true
        logger.notice("User '\(username)' logged in successfully.")
    }
    return error
}
```

上述代码向我们简单展示了 `OSLog` 的使用方式，今年的主要变化集中在终端的日志输出上：
![OSLog](./images/oslog_1.png)
我们可以看到，终端日志的输出上会根据日志的严重程度展示成不同的颜色：`info`、`notice`、`error`，同时我们只能看日志粗略的信息（开发者代码中展示的信息），具体的日志信息是隐藏的，但是我们可以选择日志分类以展开日志的具体信息（元信息）：
![OSLog](./images/oslog_2.png)
比如我们勾选 `Type`、`Library`、`Subsystem` 选项，那么属于该三分类的日志将会被展开。
此外，当日志输出很多的时候，找到关键日志的所在有时候会变得很困难。集成了 `OSLog` 的 Xcode 可以让你很方便得找到你所想要的日志，你只需要根据日志的严重程度进行筛选即可：
![OSLog](./images/oslog_3.png)
有了日志，定位日志的代码能更有助于提升我们 Debug 的效率，现在 Xcode 15 支持支持快速定位日志代码，我们只需要选中需要跳转代码的日志，右键选择 `Jump To Source` 即可。
![OSLog](./images/oslog_4.png)

> Tips: 更多关于 OSLog 参考
> [Session 10226 - Debug with structured logging](https://developer.apple.com/videos/play/wwdc2023/10226)

## 更高效的 Xcode

### 实时预览优化

#### 基于 `#preview` 宏快速创建预览实例

写过 `RN` 的同学一定很喜欢 `RN` 代码编辑完后实时预览的能力，相应的苹果也推出了 `SwiftUI`，得以让 iOS 原生开发的同学也能及时预览自己代码的效果。

但是要实时进行预览，我们每次都要创建一个 `PreviewProvider` 预览实例。得益于 `Swift Macro`，现在我们创建一个预览实例会更加容易，我们先来看下如果不用 `Swift Macro` 想要实时预览 `SwiftUI` 需要怎么做：
![preview](./images/preview_1.png)
我们需要创建一个 `PreviewProvider` 实例：

```Swift
struct ContentBackgroundPreview: PreviewProvider {
    static var previews: some View {
        ContentBackgroundView()
    }
}
// Xcode 15 beta 3 支持右键 PreviewProvider 自动更新为 #Preview
```

下面来看下基于 `Swift Macro` 实时预览该怎么处理：
![preview](./images/preview_2.png)
我们可以看到，使用 `#Preview` 宏快速创建了一个预览实例，并且在键入 `#Pre` 的时候会自动弹出代码提示：
![preview](./images/preview_3.png)
如果需要创建多个预览实例，我们只要创建一个带有名字的预览实例：
![preview](./images/preview_4.png)
然后通过切换预览界面的 tab 即可预览不同的实例。

#### AppKit、UIKit 实时预览

但是对于一些 `UIView`、`UIViewController` UIKit 对象，之前是无法实时
预览的：
![preview](./images/preview_5.png)
需要编译运行才能看到代码的改动效果。现在基于 `#Preview` 宏，苹果把实时预览的能力带到了 `UIKit` 和 `AppKit`，只需要用 `#Preview` 进行包裹即可：
![preview](./images/preview_6.png)
这就意味着，针对一些 `UIKit` 写的老项目，我们也能利用 `#Preview` 进行实时预览啦。

#### Widget 预览支持

如果你的 `Widget` 展示的效果会随着时间的变化而变化，那么基于 `#Preview` 的 `Widget` 预览功能将对你的开发很有用，你可以轻松预览不同时间片下 `Widget` 的表现效果：
![preview](./images/preview_7.gif)

> Tips: 更多关于 programmatic UI 预览参考
> [Session 10252 - Build programmatic UI with Xcode Previews](https://developer.apple.com/videos/play/wwdc2023/10252)

### 书签

Xcode 15 新增了一个方便我们快速找到代码的功能，叫做 `bookmark` 支持我们给代码做标记，主要支持如下能力：

- 添加书签
  - 添加书签，很简单，我们只需选中需要添加书签的代码并且右击，打开菜单栏选择创建书签即可，支持为单一代码行创建书签或者给整个文件创建书签。
  ![bookmark](./images/bookmark_1.png)
  - 如果是给代码行创建书签，创建完后会在右边显示一个书签标记，点击书签按钮能够快速为该书签添加描述。
  - 创建完书签后，会在 Xcode 导航栏中显示（右键可编辑）：
    ![bookmark](./images/bookmark_2.png)
- 书签分组，可以给选中的书签创建分组，便于管理，可以设置分组名：
  ![bookmark](./images/bookmark_3.png)
- 给所有的搜索结果创建书签，比如我可以给我们代码中所有的 `TODO:` 创建书签：
  ![bookmark](./images/bookmark_4.gif)
  如果代码中新增了书签标记的内容，我们可以点几刷新按钮，就能更新书签列表了。
- TODO List
  经过上述操作后我们已经有了一个叫做 `TODO:` 的书签组，我们可以把这个书签组当做 TODO List 使用（session 视频中会在书签左边显示一个小圆圈，点击会打勾，我这边实操没有出现，可能是 Xcode 15 beta 版本的一个 bug）
  ![bookmark](./images/bookmark_5.png)

### 源代码托管优化

现在越来越多的 IDE 集成了 `git` 方便我们进行代码托管，Xcode 15 对这部分能力进行了优化，方便我们在 Xcode 中进行预览代码变更等操作，有种把 SourceTree 集成到 Xcode 中的感觉：
![source_control](./images/source_control_1.png)

你可以在 Xcode 15 中进行 `commit`、`push`、`stage` 等操作。工作中已经习惯了 `cmd` 中敲 `git` 命令行了，此处更新我可能会使用下查看改动以及解决冲突的能力。

### 测试优化

- 苹果用 Swift 语言重构了测试面板，因此测试速度提升了 45%。
- 测试报告更丰富
  - 顶部 Insights：展示测试结果，进行测试内容的分析，给出改进建议。
  - Tests：展示测试数据，包括测试耗时、成功|失败的数目，测试用机型，测试失败的原因等信息。
![test](./images/test_1.png)
- 测试过程展示，方便定位问题
  - 点击失败的测试用例，进入详情页。
  - 罗列测试的步骤，点击可以跳转具体代码。
![test](./images/test_2.png)

> Tips: 更多关于测试优化参考
> [Session 10175 - Fix failures faster whith Xcode test reports](https://developer.apple.com/videos/play/wwdc2023/10175)
  
### App 发布

#### Xcode Cloud App 发布更新

由于 Xcode Cloud 对国内的开发者不是很友好，因此这里简要描述下在 App 发布中，Xcode Cloud 的相关更新：

- 引入 TestFlight test 详细信息
- 支持公正 Mac App。

#### 框架签名

现在支持对 XCFramework 进行签名和验签，可以展示框架的来源等信息，可以保障框架的完整性：
![distribution](./images/distribution_1.png)
XCFramework 的签名方式有两种：

- self-signed（重签名）：比较 XCFramework 的哈希值和刚加入工程时的哈希值是否一致。
- 开发者证书签名：苹果会校验开发者证书是否有效。

> Tips: 更多关于框架签名参考
> [Session 10161 - Verify app dependencies with digital signatures](https://developer.apple.com/videos/play/wwdc2023/10061)

#### Privacy Manifest

现在，框架的作者可以给自己的框架添加隐私清单，说明框架会使用到的隐私能力（创建一个 `PrivacyInfo.xcprivacy` 文件），隐私清单会和框架捆绑签名。
![distribution](./images/distribution_2.png)

基于框架内的隐私清单，Xcode 15 在 App 发布的时候会自动生成一份
完整的隐私报告，这份隐私报告可以填写 App 发布时需要再 App Store Connect 中要填写的隐私内容。

> Tips: 更多关于隐私清单参考
> [Session 10060 - Get started with privacy manifest](https://developer.apple.com/videos/play/wwdc2023/10060)

#### TestFlight 支持仅发布到内部

有时候我们只希望将测试包发布给内部员工进行测试，而不需要发布给用户（比如发布的产品在内测阶段），这时候在 Archive 之后选择发布渠道，只需要勾选 `TestFlight internal testing only` 即可。这样我们的 TestFlight 包只会分发给公司内部的成员，避免用户被分发到测试包的风险。
![distribution](./images/distribution_5.png)

> Tips: 更多关于 App 发布参考
> [Session 10224 - Simplify distribution in Xcode and Xcode Cloud](https://developer.apple.com/videos/play/wwdc2023/10224)

## 其他功能更新（基于 Xcode 15 beta2 release notes）

### Clang 编译器 & 链接

- 新增一个 C++ 支持参考页面 <https://developer.apple.com/xcode/cpp/>
- Clang 和构建系统支持一种新的构建模块依赖关系的模式：`explicit modules`，它可以提高构建的性能，提升可靠和正确性。新模式默认不打开，可以通过配置`_EXPERIMENTAL_CLANG_EXPLICIT_MODULES` 编译选项打开。
- 新的链接器，加快静态链接的速度，使用 `Mergeable Libraries` 功能以及所有的 iOS 二进制都由新的链接器进行链接。如果想要使用原来的连接器，可以使用 `-ld64`。

### Assets Catalogs

- Xcode 15 为 Assets Catalogs 下的图片和颜色资源自动生成 `Swift` 和 `Objective-C` 符号。提供一个更安全的方式进行引用，支持编译检查。
- 编译选项设置：
  - 设置 `ASSETCATALOG_COMPILER_GENERATE_SWIFT_ASSET_SYMBOL_EXTENSIONS` 为 `YES` 可以通过 `Image` 或者 `Color` 类访问资源，比如 `Color` `UIColor` `NSColor`。
  - 设置 `ASSETCATALOG_COMPILER_GENERATE_ASSET_SYMBOLS` 为 `YES` 会自动生成符号，设置为 `NO` 不再生成。
  - 设置 `ASSETCATALOG_COMPILER_GENERATE_ASSET_SYMBOL_FRAMEWORKS` 设置需要自动生成符号的框架，比如 `UIKit AppKit` 或者 `UIKit`。
- `Objective-C` 也能自动生成符号，自动生成的符号是字符串常量，可以通过 `GeneratedAssetSymbols.h` 头文件引入。

### 构建系统

- Archive 构建现在支持一组编译优化，能够提高编译性能。
- Xcode 现在可以自动为项目中的动态库和 `framework` 生成 `TBD`（基于文本的动态库），能够加快增量编译的速度。
- 支持编译 `Swift Macro`。

### 调试

- `LLDB` 现在能够省略类型摘要中的默认模板参数，比如：

```shell
(lldb) frame variable
 (std::vector<std::vector<std::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::allocator<std::basic_string<char, std::char_traits<char>, std::allocator<char> > > >, std::allocator<std::vector<std::basic_string<char, std::char_traits<char>, std::allocator<char> >, std::allocator<std::basic_string<char, std::char_traits<char>, std::allocator <char> > > > > >) nested = size=0 {}
```

优化成：

```shell
 (lldb) frame variable
 (std::vector<std::vector<std::string> >) nested = size=0 {}
```

如果想查看默认的参数，可以使用 `--raw-output` 选项。

- `LLDB` 现在支持在表达式求值的过程中引入泛型：
  
```Swift
func use<T>(_ t: T) { 
   print(t) // Break here 
 }
  
 use(5)
 use("Hello!”)
```

### 文档

- Xcode 现在内建一个预览器，可以实时预览编写的 `Swift DocC` 文档。
- 预览器可以支持预览 `Swift` `Objective-C` 头文件以及文档标记。

### Instruments

- Instruments 15 包含一个新的 `RealityKit Trace` 模板，用于在 `VisionOS` 上分析应用程序和游戏。支持 CoreAnimation 数据、3D 渲染数据等统计。
- 支持在 `Allocations` `Leaks` 以及 `VM Tracker` Instruments 中打开 `.memgraph` 文件，支持查看 Instruments 捕获的 `.memgraph` 文件。
- 新的 `dyld` 活动监视器，可以可视化 `dlopen`、`dlclose`、静态初始化等。
- 新增了一个音频系统追踪模板，可视化了应用程序是如何和音频服务交互的，可以让你深入了解音频线程 I/O 周期和其他的一些性能指标。

### 测试

watchOS 上的 UI 测试现在将自动消除未处理的告警。

### 其他

- Quick Action：类似 VS Code `Command Palette`，快捷键为 `command` + `shift` + `A`，键入后，会全局打开一个搜索框，可以搜索 Xcode 所有的菜单操作选项。这是一个很有用的更新，能够提升一定开发效率。

## 开发者注意事项

- 如果没有安装所需平台的 SDK，那么需要在创建项目或者需要使用的时候下载，否则无法编译运行。
- asset catalog 编译自动生成 symbols，新增的扩展都是 `@available(iOS 17.0)` 不向下兼容。
- `#Preview` 从 iOS 17 开始支持，不向下兼容

```Swift
@available(iOS 17.0, macOS 14.0, tvOS 17.0, *)
@freestanding(declaration) public macro Preview(_ name: String? = nil, traits: PreviewTrait<Preview.ViewTraits>..., body: @escaping () -> UIViewController) -> () = #externalMacro(module: "PreviewsMacros", type: "Common")
```

但是在 Xcode 15 beta 3 中，支持通过 `@available(iOS 16.0, macOS 13.0, *)` 标注来支持低于 iOS 17 系统版本的预览。

## 总结

本文主要从智能、简洁、高效、其他功能这四个角度详述了 Xcode 15 的各项改进。Xcode 15 诸如更智能的代码补全、string catalog 等能力能够极大地方便开发者开发，提升我们日常的开发效率，可见苹果开发者确实是从开发人员的角度出发，发掘开发者开发痛点，不断改善开发工具，给我们开发者营造了一个良好的开发环境。用一句话对 Xcode 15 进行总结就是：更智能、更简单、更高效。相信大家通过阅读本文已经对 Xcode 15 有了一个初步的认识，相信体积更小、功能更强、更加简洁的 Xcode 一定能给大家带来更加舒服的开发体验，给我们的开发效率带来大幅提升。

## 参考链接

[Xcode 15 Beta 2 Release Notes](https://developer.apple.com/documentation/Xcode-Release-Notes/xcode-15-release-notes)
[探索 XCode15 新特性 | 京东云技术团队](https://mp.weixin.qq.com/s/clJYjhTsNohzdbqBvQqHsg)
