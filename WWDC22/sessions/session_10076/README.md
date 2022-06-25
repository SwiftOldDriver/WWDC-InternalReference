---
session_ids: [10076]
---

# Session 10076 - 将你的 iOS 应用搬到 Mac 上

> 作者：JPlay，iOS 开发者，Base 厦门，曾就职于美图，现就职于稿定科技
> 审核：待审核同学填充
> 引申：本文基于 [WWDC2022 Session 10076](https://developer.apple.com/videos/play/wwdc2022/10076/%20) 梳理。

## iPad 与 Mac 的融合之路

![MAndMacCatalyst](./images/MAndMacCatalyst.png)

*苹果嘴上说不要，身体却很诚实。*

虽然 Tim Cook 和苹果高级副总裁 Craig Federighi 都曾经明确否认 iOS 与 macOS 并不会走向融合，还强调 Mac 设备不可能推出触屏版，但是其实苹果在 2019 年开始，就在推动开发者将 iOS 应用带到 macOS 中。

在 M 系列芯片的支持下，两者已经在硬件上实现了打通：

- 相同的芯片架构，带来了指令集的统一
- 相同的大尺寸屏幕，带来了可展示内容的统一
- iPad 支持鼠标键盘之后，两者甚至可以用一模一样的交互方式

唯一不同的，可能就是一些历史和配件问题：

- UIKit vs AppKit
- 触控 vs 键鼠
- iPad 专属传感器、前后摄像头等配件在 Mac 上的缺失

在这样的大背景下，iPad 与 Mac 的融合已经开启。从苹果逐步减少更新 AppKit，转而推动 Mac Catalyst 的趋势可见一斑。

## 应用展示

Mac Catalyst 发展到今年，落地情况到底如何？我们来看几个苹果推荐的应用。

![Craft](./images/Craft.png)
Craft 是一款功能丰富的文档编辑软件，在 Mac Catalyst 的帮助下，写作体验可以贯穿平台，它获得了 App Store's 2021 年最佳 Mac 应用大奖。

![Darkroom](./images/Darkroom.png)
Darkroom 是一款功能强大的图片编辑软件，有了 Mac Catalyst，iPad 上的能力可以轻松移植到 Mac 上，它获得过苹果设计大奖，并且从 2018 年开始连续获得 App Store 编辑推荐。

![NightSky](./images/NightSky.png)
Night Sky 是一款宇宙探索软件，它惊艳的 3D 效果获得了多次 Webby 奖 和 Lovie 奖。值得一提的是，使用了 Mac Catalyst 之后，它在 Mac 上采用横屏展示，在 iPad 上采用竖屏展示，但是视觉和交互在双端都保持了最佳效果。

![Asphalt](./images/Asphalt9.png)Asphalt 9 - Legends 是唯一一款获得过苹果设计大奖的赛车游戏，它使用 Mac Catalyst 做到了 Mac 和 iPad 双端画面体验完全一致。

## 使用方式

从文字、图片编辑类软件，到 3D 软件，甚至是游戏，都可以通过 Mac Catalyst 把 iPad 应用搬到 Mac 上，接下来我们看看迁移应用的几种方式。
> PS：以下内容全部基于 Xcode 14.0 beta，会和市面上其他基于旧版本 Xcode 的文档略有不同。

### 默认迁移(Designed for iPad)

当你新建一个项目的时候，系统会默认帮你添加 Mac(Designed for iPad)，这可以让你拥有苹果芯片（目前也就是 M 系列芯片）的 Mac，直接把此应用跑起来。

![defaultForIPad](./images/defaultForIPad.png)

如果你希望在此模式下进行一些简单的适配，也是可以的。

比如，在 info.plist 文件中加入以下两个 key：

~~~ XML
<key>UILaunchToFullScreenByDefaultOnMac</key>
<true/>
<key>UISupportsTrueScreenSizeOnMac</key>
<true/>
~~~

`UILaunchToFullScreenByDefaultOnMac` 可以让你的应用在开启时直接进入全屏，这个选项特别适合游戏。
`UISupportsTrueScreenSizeOnMac` 可以让你的应用支持任意屏幕尺寸和分辨率，具体说明可以查看[官方文档](https://developer.apple.com/documentation/bundleresources/information_property_list/uisupportstruescreensizeonmac?changes=late_3__8)。

在交互方面 Touch Alternatives 可以帮助你把 iPad 上的交互简单地映射到 Mac 上

![addTouchAlternatives](./images/addTouchAlternatives.png)

如上图，添加 Touch Alternatives 的 plist 文件后，你就可以配置你想要的交互选项：

~~~ XML
<dict>
    <key>defaultEnablement</key>
    <true/>
    <key>requiredOnboarding</key>
    <array>
        <string>Tilt</string>
        <string>Tap</string>
        <string>Arrow Swipe</string>
        <string>Scroll Drag</string>
        <string>Trackpad Capture</string>
    </array>
</dict>
~~~

在 requiredOnboarding 下的数组中添加的选项将自动映射到 Mac 上的替代交互方案，具体映射规则是：

![touchInfo](./images/touchInfo.png)

设置完毕后，你就可以在 Mac 中使用这些交互了，并且在你打开应用时，还会给你一个友好提示：

![touchNotice](./images/touchNotice.png)

你甚至可以在这个界面上做一些配置。比如，关闭 Touch Alternatives。

值得一提的是，现在 iPad 是直接支持用键鼠操作的，苹果更加建议你在 iPad 上实现对键鼠的支持，这样移植到 Mac 上的体验将是完美的。

### 使用 Mac Catalyst

更进一步的迁移方式是本文的主角： Mac Catalyst

![addMC](./images/addMC.png)

添加完 Mac(Mac Catalyst)，我们就开启了 Mac Catalyst，此时你的应用可以跑在所有 Mac 之上（囊括了带苹果芯片和英特尔芯片的 Mac）。

Mac Catalyst 分为两种适配模式：

![selectIdiom](./images/selectIdiom.png)

"Scaled to Match iPad" 对应的是 iPad idiom，他是系统的默认选项。

iPad idiom 下，需要你做的适配工作是很少的，甚至可以一行代码都不改。
当然，这是有代价的：

1. 视图和文字在 Mac 上会被缩放到 77%，因此导致了[像素不对齐](https://jplay.github.io/2022/05/26/%25E4%25B8%25AD%25E7%259A%2584%25E5%2583%258F%25E7%25B4%25A0%25E5%25AF%25B9%25E9%25BD%2590/)，所以变得模糊。
2. 控件是直接从 iOS 搬到 macOS 上的，某些情况下显得体验不佳。比如，UINavigationbar 在 Mac 上显得格格不入。

![navigationbarFix](./images/navigationbarFix.png)

### Mac idiom

想要进一步提升用户体验，你应该选择 Mac idiom，也就是下图中的 "Optimize for Mac"

![macIdiom](./images/macIdiom.png)

在 asda
