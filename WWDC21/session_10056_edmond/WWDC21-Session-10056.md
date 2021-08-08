#【WWDC21 10056】让您的 iPad 与 iPhon 应用程序在 M1 的 Mac 上大放异彩

> 作者：土土Edmond木, [CocoaPods 历险记](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MTM1NTc2Ng==&action=getalbum&album_id=1477103239887142918) 作者，CS & 🎿、🏃‍♀️ 爱好者。
> 
> 审核：Parsifal，老司机技术周报负责人，微医集团移动诊疗团队负责人

![wwdc21-10210-00-background](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-banner.png)

> WWDC21 Session 10056 - [Qualities of great iPad and iPhone apps on Macs with M1](https://developer.apple.com/videos/play/wwdc2021/10056)
>
> 主讲人：Nils Beck


## 本文知识目录

![wwdc21-10056-table-content](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-table-content.png)


## 引言

在 2020 年 11 月的发布会上，苹果正式发布了搭载自研 M1 芯片的 Mac 与 `macOS Big Sur`，它们的正式亮相，宣告，苹果正式打通了旗下 iOS、iPadOS  及 macOS 三大独立操作系统之间的壁垒，实现了苹果生态的大一统。

为了帮助开发者们快速过渡到 ARM 平台，苹果推出了 `Universal`、`Rosetta`、虚拟化技术等一整套解决方案，它可以将现有的 Mac 应用高效快捷的移植到 ARM 架构能兼容的系统中。也使得 iPhone 和 iPad 上的各种 App 也能直接在 `macOSBig Sur` 且配置了 M1 芯片 的 Mac上运行。也让 `Mac App Store` 上有了过百万的 iPad 和 iPhone 应用程序，它们在 `macOS Big Sur` 上有着很棒的体验，而在 `macOS Monterey` 中他们的体验将会更进一步。

在本演讲中，我们将讨论 4 个主题：

![wwdc21-10056-00-contents](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-00-contents.png)

- 如何将多个 iOS API 映射到 Mac 的相应功能上；
- 一些通用的最佳实践，将帮助您的应用程序在配备 M1 的 Mac 上大放异彩；
- 在 `macOS Big Sur` 以及 `macOS Monterey` 的软件更新中所做的改进；
- Mac App Store 部署的注意事项。


## API mappings

配备 M1 芯片的 Mac 让现有的 iPad 和 iPhone 应用程序轻松扩展到 Mac。无需变更 iPad 或 iPhone 应用程序，那些已在 `iOS App Store` 提交并获得批准的应用程序，也将通过 `Mac App Store` 向拥有 `Macs with M1` 的任何人提供服务。

为此，我们非常注重兼容性。让系统 API 尽可能自然的映射到 Mac 的等效功能上。**我们的目标是确保在 Mac 上获得流畅的应用体验，而无需您进行任何更改。**

### Compatibility focused

目前，大多数现有应用程序在 Mac with M1 上运行良好！

![wwdc21-10056-3-extesnion-topics](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-3-extesnion-topics.png)

小到 iPhone 的效率工具，大到极致的 iPad 游戏和专业应用程序，以及各种扩展。例如，分享扩展、WidgetKit 小组件、照片编辑扩展、VPN 网络扩展、音频单元等等。可以说您现有的 iPad 或 iPhone 应用程序很可能已经在 Mac 上运行良好，开箱即用。

当然，我们支持所有基本功能，例如文本交互、复制和粘贴、Mac 菜单栏等，但也有很多高级功能，例如后台应用程序刷新、用户通知、相机访问、`Siri Intent` 等。

> Tips：[iPad and iPhone apps on Apple silicon Macs](https://developer.apple.com/videos/play/wwdc2020/10114/) 中讨论了其中许多主题，建议查看该视频以了解更多详细信息。

![wwdc21-10056-3-more](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-3-more.png)

如果您希望您的应用程序利用 Mac 提供的更多功能，请考虑构建 Mac Catalyst 版本的应用程序。

可参阅 [Qualities of a great Mac Catalyst app](https://developer.apple.com/videos/play/wwdc2021/10053/) 和 [What's new in Mac Catalyst](https://developer.apple.com/videos/play/wwdc2021/10052) 以了解更多相关信息。

### Keyboard input

现在，让我们深入了解我刚才提到的一些 API 的更多细节，为您在 Mac 上提供出色的功能。

![wwdc21-10056-4-keyboard](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-4-keyboard.png)

您可以使用 Mac 键盘将文本输入到 `Text fileds` 或者使用 `UIKeyCommand` 定义键盘快捷键。

#### `UIKeyCommand`

早在 `iOS 7` 里，我们就增加了 `UIKeyCommand` 特性来支持快捷方式。不过当外部键盘发送键盘命令时，并没有直观的办法知道他们的存在。不像 `macOS` 用户可以在他们常用的菜单里找到快捷方式。好在 `iOS 9` 上为了使 iPad 更高效的工作，我们增加了**可发现特性**，这是一个叠加层，用于显示一个应用程序内当前可用的键盘命令。这个微小的变化使得键盘命令瞬间变得比以往有用多了，并且也使得 `UIKeyCommand` 成为你的应用程序的一个必要的附加功能。

![wwdc21-10056-4-uikeycommand-discoverability](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-4-uikeycommand-discoverability.png)

> 更多可参阅 NSHipster 的文章 [UIKeyCommand](https://nshipster.cn/uikeycommand/)。



#### `UIPress`

如果您希望编写自定义的按键处理来获取更多的控制，则可以使用 `UIResponder` 上的 `UIPress` API 来实现。毕竟所有 Mac 都有一个物理键盘，每个 `UIPress` 对象背后都对应一次物理按键的输入，或记录了一次手势操作。与之对应的 `UITouch` 则是对屏幕上虚拟键盘或手势操作输入的记录。

因此，对于那些已经花费精力支持物理键盘的  iPad 或 iPhone 的应用程序，在 Mac 上的体验同时得到了极大的改进。

### Menu bar

菜单栏旨在帮助发现应用程序功能和键盘快捷键。

![wwdc21-10056-4-menu-bar](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-4-menu-bar-animation.png)

**菜单栏结构在启动时确定，之后应该或多或少保持不变**。menu items 不会被添加或删除，而是被启用或禁用，具体取决于它们当前是否适用。我们考虑到您应用功能的同时，会自动填充您应用的菜单栏。例如，我们可能会添加菜单项来创建新窗口、处理富文本或更改设备方向。

**使用 keyCommands 的注意事项**

- 通过 `UIResponders.keyCommands` 属性直接附加的快捷方式不会出现在菜单栏中；
- 但无论何时应用，`UIResponders.keyCommands` 都优先于菜单项的快捷键。

#### `UIMenuBuilder`

```swift
@MainActor protocol UIMenuBuilder
```

您可能已经在使用我们在 `iOS 13` 中更新的 `UIMenuBuilder` API。**`UIMenuBuilder` 为您的 `UIKeyCommands` 添加了语义结构。**仅需在 `App Delegate` 或 `ViewController` 中覆盖  `buildMenu(with:)` 方法以修改 builder 对象。覆盖后的菜单结构决定了系统如何展示菜单的内容。

```swift
override func buildMenu(with builder: UIMenuBuilder) {
	if builder.system == .main {
		menuController = MenuController(with: builder)
	}
}
```

要查看如何使用 `UIMenuBuilder` 对象的示例，请参阅 [Adding Menus and Shortcuts to the Menu Bar and User Interface](https://developer.apple.com/documentation/uikit/uicommand/adding_menus_and_shortcuts_to_the_menu_bar_and_user_interface?language=objc)。

前面提到，带有键盘的 iPad 上按住 Command 键时，会展示叠加层用于显示当前应用程序可用的键盘命令。在 Mac 上，传递到构建器的默认结构会有所不同，但您对结构的自定义将反映在主菜单中。`UIKeyCommands` 依赖响应者链来为其操作找到适用的目标，这决定了是否启用菜单项。

![wwdc21-10056-4-menu-bar-tipics](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-4-menu-bar-tipics.png)

有关更多信息，请参阅 "[Take your iPad apps to the next level](https://developer.apple.com/videos/play/wwdc2021/10057/)" 和 "[Focus on iPad keyboard navigation," and "Qualities of a great Mac Catalyst app](https://developer.apple.com/videos/play/wwdc2021/10260/)" 。

### Drag & Drop

对于在 iPad 和 iPhone 上使用拖放的应用程序，使用 `UIDragInteraction` 和 `UIDropInteraction`，这也会自动转移到 Mac。这让人们可以在您的应用程序和其他应用程序之间无缝拖动内容，就像下面的示例中，我将 QR 码从 Qrafter 拖动到我的桌面。

![wwdc21-10056-5-drag-drop-qrcode](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-5-drag-drop-qrcode.png)

### Printing

对于使用 `UIPrintInteractionController` 打印的应用程序，当在您的代码中启动打印时，它会自动桥接到 Mac 打印对话框。当您采用新的 `Info.plist` 键 “`UIApplicationSupports PrintCommand`” 并实现相应的标准打印操作，打印和导出为 PDF 菜单项将自动添加到应用程序的菜单栏中。

![wwdc21-10056-5-printing](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-5-printing.png)

有关此新 API 的更多详细信息，请参阅 [What's new in Mac Catalyst](https://developer.apple.com/videos/play/wwdc2021/10052)。

### Settings bundle

许多应用程序使用 settings bundle，我们将由此自动生成一个 Mac 风格的首选项面板。

![wwdc21-10056-5-settings-bundle](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-5-settings-bundle.png)

在 settings bundle 中放置 `credits file` 也很常见，我们会识别此类情况并将该文本移至 “关于” 窗口中。
但是，如果您想要更多地控制 Mac 上 “关于” 框中显示的内容，您现在还可以选择将 `credits file` 添加到您的 bundle 中。

![wwdc21-10056-5-settings-bundle-credites](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-5-settings-bundle-credites.png)

您可以使用 RTF、RTFD 或 HTML 文件，与 Mac 应用程序执行此操作的方式相同。

### Multi scene support

有许多以 iPad 为中心的 API 可以帮助您的应用程序成为出色的 iPad 应用程序。这些都能在 Mac 上完美呈现。因此，通过制作出色的 iPad 应用程序，您还可以让您的应用程序在配备 M1 的 Mac 上变得更好。

如果您的应用程序根据 `UIApplicationSupportsMultipleScenes` 的 `Info.plist` key 支持多个场景，每个场景将被转换成一个单独的，我们自动添加一个 `menu item` 来创建一个新场景。

![wwdc21-10056-6-multi-scene-01](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-6-multi-scene-01.png)

在 Mac 上，提供了系统级的设置决定了应用程序退出时是否关闭所有窗口，或者是否在下次启动时恢复现有窗口。如果您的应用支持多个场景，我们会尊重此设置，因此如果所有场景都未生效，或者在某些情况下未发生状态恢复，属于预期范围。

![wwdc21-10056-6-multi-scene-02](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-6-multi-scene-02.png)

### MultiTasking support

iPad 多任务支持会自动转换为 macOS 上可调整大小的窗口。如果您的应用程序已经支持 iPad 上的动态布局更改，则可以在 Mac 上实时调整窗口大小。您可以使用 UIWindowScene 上的 `minimumSize` 和 `maximumSize` API 限制允许的场景大小范围。请注意，调整 window 尺寸时，只有 `window scene` 尺寸会发生变化。而 `UIScreen size` 在这种情况下不会改变，仍旧返回的是设备大小。因此，**即使在 iPad 上也不要将 `UIScreen size` 用于布局计算，否则您的 UI 元素最终会出现在错误的位置。**

### Full screen apps

![wwdc21-10056-7-full-screen-apps](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-7-full-screen-apps.png)

如果您的应用程序希望控制设备的整个屏幕，我们将使用固定的场景大小和宽高比。但是 window 内容可以根据需要自动进行缩放。如果您的应用程序支持屏幕转向，则可以使用自动添加的菜单栏或通过拖动窗口边缘来更改窗口方向。

![wwdc21-10056-7-interface-orientations](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-7-interface-orientations.png)

上图中，通过菜单栏项来更改国际象棋应用程序的方向，并且用户界面会适应以最佳利用每个设备方向。



## Best pratices

在将 iPad 或 iPhone 应用程序带到 Mac 时，一些最佳实践和 API map 能够消除大部分兼容问题，但让我们谈谈您应该遵循的一些编码实践，以确保您的应用程序在所有平台上都能正常运行，包括 Mac。

### Write portable code

![wwdc21-10056-8-0-portable-code](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-8-0-portable-code.png) 

1. **使用 Apple 框架时，请务必仅使用官方支持的 API**，因为我们框架中未记录的方法在 Mac 上可能不存在，或者可能随时更改。
2. **避免硬编码文件系统位置的路径**，因为这些路径在 Mac 上可能不同。例如，不要在路径前加上 “`/private`” 或 “`var mobile`" 相反，使用适当的 API 在运行时确定每个路径。
3. **避免对 View 和 Alert 的屏幕定位或此类视图层次结构的确切设置进行假设**，因为这些在 Mac 上可能完全不同。

### Camera properties

注意，Mac 上可用的相机分辨率和方向可能大不相同。例如，如果您的 iPhone 应用程序在拍照时处于纵向，您可能希望生成的相机图片也处于纵向。但是当应用程序在 Mac 上处于纵向时，情况不一定如此。您可能会收到横向图像，因为这是相机的定位方式。

![wwdc21-10056-8-camera-orientaion](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-8-camera-orientaion.png)

我们已经包含了许多启发式方法来提高与许多应用程序的兼容性。例如，**即使您要求提供后置摄像头，我们也会为您提供 Mac 前置摄像头的图片**。当然，如果您使用 `AVCaptureDeviceDiscoverySession` 和相关的 `AVFoundation` API 来收集相机有关的可用信息或真实属性（例如预览尺寸），那就更好了。并且您应该在您的 UI 中致力于处理所有可能的配置。

### Unavailable hardware

某些硬件功能在 Mac 上不可用。您的代码应该能够优雅地处理这种情况，并提供替代方案。

#### ARKit

例如，Mac 不支持 ARKit 增强现实。如果 ARKit 是您的应用程序的核心功能，您可能已将其设为必需的设备功能，因此您的应用程序将不会出现在 `Mac App Store` 中。但是如果 ARKit 是一个可选功能，您应该已经检查了相应 **ARConfiguration** 子类的 `isSupported` 属性。

> 为了在 Mac 和其他地方获得最佳体验，请确保仅在具有此功能的设备上的 UI 中显示增强现实功能。

#### Multi-Touch 或 CoreMotion

如果您的应用依赖于直接 `Multi-Touch` 或 `CoreMotion`，请考虑另外提供更适合 Mac 键盘和触控板的替代品。也就是说，在这种情况下，`Touch Alternatives` 可能会有所帮助。稍后我们将详细讨论这一点。

#### CoreLocation

如果您使用 CoreLocation，即使没有准确的位置数据可用，您的应用程序也应该保持可用。例如，您可以提供手动位置输入作为替代，就像 Lowe's 应用程序在这里所做的那样。

![wwdc21-10056-9-map](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-9-map.png)

## Recent improvements

接下来，让我们回顾一下，自 M1 芯片的 Mac 首次发布以来我们所做的一些改进。

### Better window sizing

在 `macOS Big Sur 11.3`，我们对 iPad 和 iPhone 应用程序窗口在 Mac 上的行为方式进行了一些改进。如果您的应用由于不支持 multitasking 而具有固定的内容大小，但它确实支持大型设备尺寸，那么在启动时，我们现在将选择适合应用启动屏幕的最大支持设备尺寸。就您的应用程序而言，设置尺寸在整个会话中仍然保持不变，但window 可以更好地利用可用空间。还可以优先使用支持的最小设备尺寸。

![wwdc21-10056-10-window-size-preference](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-10-window-size-preference.png)

正如我之前提到的，窗口内容将根据需要放大或缩小。例如：

- 当窗口全屏显示时，内容会自动放大以适应可用空间，同时保持原始场景宽高比。
- 当窗口在启动后移动到较小的屏幕，我们将根据需要自动缩小比例以确保窗口仍然适合。

![wwdc21-10056-11-game-improvements](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-10-window-size.png)

现在还可以使用 window 的缩放功能在两个缩放因子之间切换，一个优先考虑 UI 元素的自然大小，另一个优先考虑像素完美的准确性。

### Virtual game controller

`GameController.framework` 自发布起就支持在我们所有支持游戏的平台上使用游戏控制。从 `macOS Big Sur 11.3`，我们已经可以将 Mac 的键盘和触控板用作虚拟游戏控制器。因此，即使您手边没有实际的控制器，也可以轻松使用键盘访问游戏，映射到控制器按钮的所有功能。在 `macOS Monterey` 中，我们通过添加灵敏度滑块和指针隐藏进一步完善了这一点，如相应首选项面板的这张图片所示。

![wwdc21-10056-11-game-improvements](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-11-game-improvements.png)

有关此框架的更多信息，请查看 "[Advancements in Game Controllers](https://developer.apple.com/videos/play/wwdc2020/10614/)"。

### Better Touch Alternatives

从第一天起，`Touch Alternatives` 就将键盘和触控板映射到为 Mac 上的其他交互方式，例如多点触控、拖动、点击和滑动。并且我们在 MacOS 11.3 做了一些改进。例如，您现在可以虚拟倾斜您的设备。这为许多其他游戏打开了大门。

此外，首选项面板现在包括一个有用的图形表示，说明如何通过键盘和触控板访问五种交互风格中的每一种。

 ![wwdc21-10056-12-touch-alternative](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-12-touch-alternative.png)
我们还让应用程序可以自动选择加入 `Touch Alternatives`。当您选择加入时，首次启动时会显示一个入门对话框，以帮助发现此功能。您需要做的就是添加一个新的 plist 文件 `com.apple.uikit.inputalternatives.plist` 到您的 bundle 中。如下图配置：

![wwdc21-10056-12-touch-alternative-enable](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-12-touch-alternative-enable.png)

当然您可以根据您的应用程序来配置 `requiredOnboarding` 数组。这样，在首次对话框中只会突出显示所需的功能。

图形与首选项面板中的图形类似，但我们仅突出显示您选择的交互样式。

![wwdc21-10056-12-touch-alternative-dialog](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-12-touch-alternative-dialog.png)

在此示例中，仅显示倾斜和多点触控。如果您确定您的应用将从这些触控替代方案中的任何一个中受益，请从一开始就为您的应用启用 `Touch Alternatives` 方案。

最后，我们将演示一款名为 “`Assoluto Racing`” 的 iPad 游戏，它在配备 M1 的 Mac 上未经修改地运行。该应用程序从一开始就自动启用 `Touch Alternatives`，因此在首次启动将向我们展示键盘控件。另外，这个应用程序在 iPad 上使用 CoreMotion，所以我们可以通过倾斜设备来转向。在配备 M1 的 Mac 上启用 `Touch Alternatives` 后，我们可以通过 W、A、S 和 D 键模拟倾斜。

> Tips: 演示效果可以查看演讲视频。



### macOS Monterey improvements

借助 `macOS Monterey`，我们进行了更多改进。

#### Support for Apple Pay

Apple Pay 现在可用于 M1 Mac 上的 iPad 和 iPhone 应用程序，它使用我们为 `macOS Big Sur` 中的 `Mac Catalyst` 应用程序引入的相同增强型跨平台 API。这意味着您现在可以一处实现，就能支持 Apple Pay 在不同平台上接受付款。

只要确保您已经实现了如下代理。

```swift
protocol PKPaymentAuthorizationControllerDelegate
```

![wwdc21-10056-14-motery-authorizet](https://gitee.com/looseyi/blog-image/raw/master/uPic/wwdc21-10056-14-motery-authorizet.png)
 有关更多详细信息，请查看视频 [What's new in Wallet and Apple Pay](https://developer.apple.com/videos/play/wwdc2021/10092/)。

#### Better AVKit

我们还使用 AVKit 制作了更好的全屏视频。

`AVPlayerView` 和 `AVPlayerViewController` 现在可以使用单独的窗口自动全屏拍摄视频。这意味着即使窗口在启动时分辨率和宽高比方面受到其他限制的应用程序也将充分利用 Mac 显示器，视视频内容而定。如果您需要更多地控制全屏体验，我们已经为 `AVPlayerViewDelegate` 和 `AVPlayerViewControllerDelegate` 添加了新的 API。**最重要的是，AVFoundation 支持在配置 M1 的 Mac 上 进行 HDR 播放和流式传输。**而你无需任何针对性的修改就能支持。

最后，在 iPad 和 iPhone 应用程序中的 AVKit 控件，在 Mac 上也保持了同步。并且我们充分利用了支持新手势的 Mac 触控板。有关更多详细信息，可查阅 "[What's new in AVKit](https://developer.apple.com/videos/play/wwdc2021/10290/)"。

#### Shortcuts

如果您的应用程序使用 SiriKit 的 Intens 来提供自定义 SiriKit 快捷方式，那么在配置 M1 的 Mac 并且操作系统为  `macOS Monterey` 的 iPad 和 iPhone 应用程序，现在也能支持这些快捷方式。

有关快捷方式的更多信息，请查看演讲 "[Meet Shortcuts for macOS](https://developer.apple.com/videos/play/wwdc2021/10232/)" and "[Design great actions for Shortcuts, Siri, and Suggestions](https://developer.apple.com/videos/play/wwdc2021/10283/)。


## Mac deployment

有了上述这些工具，在 `Mac App Store` 将会有越来越多应用程序。事实上，大多数应用程序都是自动存在的。正如之前提到的，在大多数情况下，使用 Mac 是有意义的。即使是专为移动设计的蓝牙门锁应用程序，如果您刚好把手机落在家里，但您手上有带 M1 芯片的 Mac，也可能会很有帮助。因此，如果您之前选择退出 `Mac App Store` 是时候重新考虑了。

### Mac deployment

在这种情况下，只需在 `App Store Connect` 中重新选中 “`Make this app available`” 复选框即可使该应用程序在 `Mac App Store` 上可用。无论您之前是否选择退出，您都需要确认您的应用程序在配备 M1 的 Mac 上确实运行良好。一旦您确信用户体验符合您的标准，请在 `App Store Connect` 中的验证兼容性链接。这将删除 `Mac App Store` 中您的应用程序旁边显示的 “`Not verified for macOS`” 文本，并将其替换为 “`Designed for iPad`"。 

应用程序购物者会将此视为您花时间确保他们在 Mac 上使用您的应用程序的良好体验的标志。每个应用程序只需执行一次此操作。

### Custom availability

另外 iPad 和 iPhone 应用程序在 `Mac App Store` 上将更容易被发现。当客户按名称搜索它们时，他们不再需要切换到 iPhone 和 iPad 应用程序选项卡。Apple 会自动选择兼容性所需的推荐最低 macOS 版本。但在某些极少数情况下，您可能希望使用自定义 macOS 可用性来覆盖它。例如，您的视频应用程序可能在 Big Sur 上运行良好，但如果您想确保您可以访问 AVKit 全屏改进，您可能会决定它应该只在 Monterey 及其他地方可用。

在这种情况下，您有两个选择：

1. 不久之后，您将能够在 `App Store Connect` 的定价和可用性页面上选择不同的最低 macOS 版本。这对于商店中已有的应用程序非常有用，因为您无需重新提交新版本。
2. 您可以在信息中指定 `LSMinimumSystemVersion.plist`，并提交此更改作为您下次更新的一部分。

这是正在积极开发的应用程序的推荐方法。注意，这不会替换 `MinimumOSVersion` 键，该键指定 iOS 最低系统版本。但实际上，很少需要这两种选择。

### Local testing

最后，让我们谈谈测试。在 macOS 上进行测试与在 iPad 上进行测试非常相似。您可以使用您已经熟悉的相同工作流程。对于 Xcode 中的本地测试，只需选择 `My Mac (Designed for iPad)` 作为运行目标。调试、单元测试等都可以像在其他设备上一样工作。

对于 Beta 测试，我们为 `macOS Monterey` 中的所有应用程序（包括 iPhone 和 iPad 应用程序）添加了 `TestFlight` 支持，因此您现在可以将您的应用程序分发给使用配备 M1 的 Mac 的 Beta 测试人员。
有关这方面的更多信息，请转到视频 “[Meet TestFlight on Mac](https://developer.apple.com/videos/play/wwdc2021/10170/)"。

最后，欢迎使用 Mac！去验证您的应用程序并选择加入。
请记住，随着您不断改进 iPad 和 iPhone 应用程序，您也在使用改进配置了 M1 的 Mac 上的这些应用程序。

## 总结

本文围绕如何让您的 iPad 和 iPhone 的应用程序在 M1 的 Mac 上有更好的使用体验。对此分了四个章节展开，有系统升级带来的优化，API 映射功能的更佳丰富，同时还提供了大量的最佳实践。通过这些内容和相关视频的了解，相信您的应用程序在使用 M1 的 Mac 上能够大放异彩。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
