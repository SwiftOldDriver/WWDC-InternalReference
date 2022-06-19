---
session_ids: [10074]
---

# WWDC22 10074 - AppKit 框架的新特性

> 作者：Ethan Wong，iOS 和 Mac 应用开发者，曾获 WWDC 21 & 22 学生挑战赛奖项。
>
> 审核：

> **注：因为文章撰写时，相关的特性和对应的 API 还处于 Beta 阶段，我们将根据最终的 API 更新一些内容**

AppKit 构建了 macOS 的核心用户体验，是大多数 Mac 应用开发者使用最多的框架之一。AppKit 框架拥有相当长的历史，Apple 对其的演进代表着对 macOS 交互的体验的思考和期望。和 WWDC21 一样，WWDC22 对 AppKit 框架的更新主要集中在对 macOS Big Sur 的新设计语言的扩充和完善以及和平台一致性相关的演进。

本文重点进行介绍 AppKit 在 WWDC22 的新特性和开发者的适配要点。

> 阅读建议
>
> - 如果你是原生 Mac 应用开发者，建议通篇浏览本文；
>
> - 如果你使用 Swift UI 或 Catalyst 技术开发了 Mac 应用，同时希望了解 WWDC22 中相关技术的演进，可以参考下面的 Session：
>
>   - [Session 10075 - Use SwiftUI with AppKit](https://developer.apple.com/videos/play/wwdc2022/10075)
>
>   - [Session 10068 - What's new in UIKit](https://developer.apple.com/videos/play/wwdc2022/10068)
>
> - 本文中讨论的新特性的相关的 Session 会在各个章节中处给出，可以根据需要进行扩展阅读；
>
> - 除了对框架的更新之外，Apple 在 WWDC22 还更新了人机交互指南 (HIG, Human Interface Guidelines)。新的人机交互指南更强调平台间的交互一致性，建议阅读：
>
>   - [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/guidelines/overview/)

## What's New in AppKit for Previous WWDC

待补充

## Stage Manager

Stage Manager 是 macOS Ventura 和 iPadOS 16 的新特性。该特性可以将不活跃的窗口收起到侧边同时将活跃的窗口居中显示，以帮助用户将注意力集中在当前交互中的窗口上。用户可以通过拖动的方式将窗口聚合成组，被聚合成组的窗口可以同时被唤起或被收起。

（图）

当用户开启 Stage Manager 时，打开新的窗口会使当前交互的窗口被收起。Stage Manager 没有引入新的公开 API 接口，开发者可以通过现有的 API 使窗口正确适配 Stage Manager 的行为：

1. 如果窗口是浮动面板（floating panel), 模态窗口（modal window）或 `toolbarStyle` 的值为 `true`，Stage Manager 默认不会收起这样的窗口。

   > - 窗口的浮动特性由 `isFloatingPanel` 属性来控制。浮动面板为 NSPanel 定义了一系列扩展行为，可以查阅文档 [isFloatingPanel](https://developer.apple.com/documentation/appkit/nspanel/1531901-isfloatingpanel)。
   > - 面板 (`NSPanel`) 和窗口（`NSWindow`）的行为区别，可以查看文档 [How Panels Work](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/WinPanel/Concepts/UsingPanels.html#//apple_ref/doc/uid/20000224)。
   > - `NSWindow.toolbarStyle` 在 macOS Big Sur 中被引入，用于适配新的 `NSToolBar` 样式，可参阅 [Session 10104 - Adopt the new look of macOS](https://developer.apple.com/videos/play/wwdc2020/10104)。

   (图)

2. 如果窗口的 `collectionBehavior` 包含了 `.auxiliary`、`.moveToActiveSpace`、`.stationary` 或者 `.transient` 的任何一个，Stage Manager 默认不会收起这样的窗口。
   > `NSWindow.collectionBehavior` 是一个比较复杂的属性，容易让开发者感到困惑。通过该属性可以回顾 macOS 的窗口管理特性的迭代历程:
   >
   > - `collectionBehavior` OS X 10.5 中首次引入，包含 `.canJoinAllSpaces` 和 `.moveToActiveSpace` 两个定义，用于适配多桌面空间（图）
   > - OS X 10.6 为 `collectionBehavior` 添加了 `.managed`、`.transient` 和 `.stationary` 三个定义，用于更好地适配 「Exposé」 特性。同时添加了 `.participatesInCycle` 和 `ignoresCycle` 两个定义，用于适配 「窗口」 菜单中的 「循环显示窗口」 特性。（图）
   > - OS X 10.7 为 `collectionBehavior` 添加了 `.fullScreenPrimary`、`.fullScreenAuxiliary` 和 `.fullScreenNone` 三个定义，用于适配窗口的全屏幕特性。（图）
   > - OS X 10.11 为 `collectionBehavior` 添加了 `fullScreenAllowsTiling` 和 `fullScreenDisallowsTiling` 两个定义，用于适配全屏分屏的特性。（图）

## 偏好设置

### 全新设计的系统设置

macOS 13 对 「系统偏好设置」 进行了全新的设计。
(图)

自定义安装的偏好设置（preference bundles）将保持原有的兼容性，在设置面板的左侧的边栏上显示。

> 作者的电脑升级到 macOS Ventura Beta 1 以后，自定义安装的设置面板都没有显示在侧边栏上，无论安装到 `/Library/PreferencePanes` 还是 `~/Library/PreferencePanes`。

### 文案变更

为了和其他系统对齐，文案「设置」 被重命名为「设置」。

链接到 macOS 13.0 SDK 的应用，在 macOS Ventura 系统上，AppKit 会自动对应用菜单中的「偏好设置」菜单项进行自动转换。开发者需要自行调整应用内其他相关的文案。

> AppKit 的这一实现并不优雅，AppKit 是通过直接比较菜单项标题文案判断是否需要进行转换，菜单标题为「Preferences」、「Preferences…」（U+2026, Horizontal Ellipsis）或是「Preferences...」都会命中这一行为，国际化同理。开发者无法 opt-out 这项行为。同时，这并不是 AppKit 第一次根据应用链接的 SDK 版本使用不同的行为，例如，`NSWindow.toolbarStyle` 属性的默认值仅在应用链接的 SDK 大于或等于 macOS 11.0 时才会生效。

### Swift UI `Form` 的新设计

为了适配新的 macOS 的设置界面风格，Apple 对表单的设计风格进行了优化，系统控件例如弹出式菜单按钮（popup buttons）可以自适应当前段环境，仅当鼠标悬停在其上方时会展示边框。

对于 Swift UI 编写的表单界面，可以使用 `.grouped` 来获得这种样式

```swift
Form {
  TextField("Computer Name", text: $name)
  Toggle("Screen Sharing", isOn: $screenSharing)
  Toggle("File Sharing", isOn: $fileSharing)
  Picker("AirDrop", selection: $airdrop) {
    ForEach(AirDropVisibility.allCases) {
      Text($0.label).tag($0)
    }
  }
}
.formStyle(.grouped)
```

（图）

> `FormStyle` 和 `.formStyle(_:)` 是 Swift UI 在 WWDC22 上的新 API。对于该 API 在其他平台上的效果，可以参考 [Session 10052 - What's new in SwiftUI](https://developer.apple.com/videos/play/wwdc2022/10052)。

使用 `FormStyle.grouped` 样式会将弹出式菜单按钮、文本框渲染成无边框的样式，同时将 `Toggle` 组件渲染成尺寸较小的开关样式。Swift UI 会自动处理这类表单的滚动行为和其内部控件的布局和视觉效果。

> 值得注意的是，通过 Xcode 的 View Debugging 不难发现，新的设置样式是完全使用 Swift UI 绘制的，没有使用任何 AppKit 的原生交互控件。因此使用 AppKit 控件很难还原出完全一致视觉和交互效果。

（图）

Apple 推荐从偏好设置面板开始对 AppKit 应用程序使用 Swift UI 进行重构。
