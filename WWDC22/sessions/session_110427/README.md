---
session_ids: [110427]
---

# WWDC22 110427 - Xcode 都更新了什么

本文基于 [Session 110427](https://developer.apple.com/videos/play/wwdc2022/110427/) 梳理


> 作者：Chafferer，现就职于米哈游平台组，从事米哈游 iOS SDK 的研发工作
>
> 审核：红纸 🤯

> **注：因为文章撰写时，Xcode 14 还处于 Beta 阶段，后续如有功能上的新增或者改进，我们将会更新本文内容**

相信对于 iOS 开发的同学来说，Xcode 大家肯定都不陌生，我们日常开发中无时无刻不跟 Xcode 打交道。提起 Xcode 往往我们第一反应就是大，是的 Xcode 太大了，动则 10G+，下载安装下可能半天时间就过去了。Xcode 的代码提示也不够智能，看看隔壁家的 Jetbrain 全家桶再看看我们，只能默默叹气：苹果啥时候能跟进下。别急，现在这些痛点在 Xcode 14 中都得到了很好地解决，是的，那些你想要的优化或者功能，它终于来了，下面就让我们看看 Xcode 14 到底有哪些令人振奋的更新：

我将从 Xcode 本身的性能优化提升、开发者效率提升以及其他新增功能这几个角度出发，详细说明 Xcode 14 都更新了什么，首先让我们用一张图总结

![](./images/pic1.png)

## Xcode 优化提升

### 体积优化

相信大家苦于 Xcode 下载安装慢已经很久了，以 Xcode 13 为例，安装包大小 10G+，往往下载安装一下半天时间就过去了，比较影响我们的开发效率。本次 Xcode 更新，安装包减小了大约 30%，因为各个平台 iOS、macOS、watchOS、tvOS 的 Components 并没有安装，第一次打开时需要动态下载安装，默认勾选安装的是 iOS 与 macOS，如果你需要使用到 watchOS，需要自行下载
![](./images/pic2.png)

### 编译速度优化

为了提升编译速度，Xcode 14 对编译流程做了些改动，我们都知道，一般编译是串行的过程，这里以 Swift 应用程序为例，简化的 Swift 应用程序编译流程主要有以下几步：
* 编译 Swift 源码
* 生成 Swift Module
* 编译应用程序资源文件
* 链接完成构建 
![](./images/gif5.gif)

Xcode 14 对编译流程进行了重新编排，通过提前构建 Swift Module 等手段，缩短了整个编译流程的路径，加快了编译的效率
![](./images/gif6.gif)

同时，Xcode 14 还通过增加并行处理的方式，将链接速度提升了 2 倍，整体编译速度提升了 25%
![](./images/pic11.png)
![](./images/pic12.png)

> Tips:
> [更多关于并行构建可以参考 Session 110364 - Demystify parallelization in Xcode builds ](https://developer.apple.com/videos/play/wwdc2022/110364/)
> [更多关于链接优化可以参考 Session 110362 - Link fast: Improve build and launch times](https://developer.apple.com/videos/play/wwdc2022/110362/)

### 测试速度优化

Xcode 14 同样使用并行技术来优化测试速度，Xcode 14 消除了 targets 和测试类之间调度的依赖性，从而进一步提升了测试流程的并行性，因此 Xcode 14 能最高减少 30% 的测试时间
![](./images/pic14.png)

> Tips:
> [更多关于提高测试速度和可靠性可以参考 Session 110361 - Author fast and reliable tests for Xcode Cloud](https://developer.apple.com/videos/play/wwdc2022/110361/)

### 发布 macOS 应用程序更快

Xcode 14 对公证速度做了优化，能提升 4 倍的公证速度，这使得发布 macOS 应用程序在 Xcode 14 中更快
![](./images/pic15.png)

### xib、storyBoard 优化

Xcode 14 针对 Interface Builder App 做了优化，如果你项目中使用到的 xib、storyboard，那么在 Xcode 14 中，打开相关文件速度提升了 50%，在设备栏中切换 iPhone、iPad 速度提升了 30%。Xcode 14 中画布的编辑操作是渐进式的，并且会对我们正在查看的场景进行优先级排序（异步渲染），因此即使在巨大且复杂的 storyBoard 中，你的每一步操作，Xcode 14 可以即时提供反馈
![](./images/pic16.png)

## 开发者效率提升

### SwiftUI 预览

在 Xcode 11 中，苹果引入了 SwiftUI，开发者可以通过拖拽等方式创建页面，预览界面可以实时根据当前的代码做出反馈，当代码发生变更时，预览界面会同步代码变更，所见即所得

此次更新，苹果针对 SwiftUI 这块也做了不少优化和改进，下面就让我们一起看看

* 默认交互式预览：能够迅速响应改变
  ![](./images/gif1.gif)
* 预览界面新增变体按钮（**下面这些预览都无需新增 code**）：
  * 深浅主题预览：可以快速预览界面在 Light 和 Dark mode 下的样子
  ![](./images/pic3.png)
  * 方向预览：可以预览不同方向下界面的样子（对于一些可能涉及到横竖屏切换的应用，该功能会很实用）
  ![](./imagepic4.png)
  * 文字大小预览：可以预览不同的文字大小的展示效果
  ![](./images/pic5.png)

### 高效编码

Xcode 14 的代码提示会更加智能，下面我们用一个 Demo 来演示下：假设我们有个 People 类，People 中有 name、age、height 三个属性

```Swift
class People {
    var name: String
    var age: Int
    var height: Double
}
```

我们现在为这个类添加一个 init 方法，当我们在 Xcode 14 中键入 init 时，Xcode 14 会弹出相关的代码提示，我们敲击回车会发现 Xcode 14 帮我们完成了所有的初始化操作，这将会大大节省我们的时间：
![](./images/gif2.gif)

如果初始化方法中有默认值，假设 `People` 的 init 方法中 `age` 的初始值为 26，这时候 Xcode 14 中的代码提示会通过斜体来告诉我们，`age` 是有默认值的：
![](./images/pic6.png)

敲回车后，我们发现，这时候是不会有 `age` 参数的，`age` 会使用默认值，如果我们需要传入 `age` 参数，可以键入 `age`，这时候代码会让我们传入 `age` 参数，会使用我们传入的 `age` 的值
![](./images/pic7.png)

这个功能很有用，因为在一些场合下，我们只需要聚焦我们想要配置的参数，通过这种代码提示，我们可以轻松办到，比如我想给分割线加上一个最大的宽度，我们只需键入 `framemaxw` Xcode 就能自动生成我们想要的代码，这也能节省我们一定的时间：
![](./images/gif3.gif)

当一个功能比较复杂时，其对应的实现函数会很长，这时候不是很方便阅读代码，Xcode 14 提供了一个新功能，当滚动浏览时，**Xcode 14 会将代码结构的元素固定到编辑器的顶部**：
![](./images/gif4.gif)

有时候我们写的方法会被多方调用，当我们 debug 或者想看看代码的改动影响时，就需要查看方法的被调用情况，现在，Xcode 14 提供了 Caller 查看的便捷入口，我们可以在想要查看的方法上按住 Command -> Callers 就能查看该方法的调用方有哪些，可以定位到每个调用所在代码的具体位置：
![](./images/pic8.png)

此外，Xcode 14 现在提供了一个文件模板，用于为 iOS 应用程序选择触控替代方案：我们可以使用触控替代方法在带有 Apple 芯片的 Mac 上与应用程序交互，比如按住 Option 键可将触控板用作虚拟触摸屏
要启用这项功能，选择 File -> New File -> iOS -> Resource -> Touch Alternatives，这时候会生成 com.apple.uikit.inputalternatives.plist 文件，我们只需要配置该文件即可
![](./images/pic9.png)

针对 Swift，Xcode 14 还提供了其他的一些优化：
* 添加了对 Swift 正则表达式的语法高亮和编辑支持：现在我们可以通过 Editor -> Refactoring -> Convert to Regex Builder 将正则表达式文字转换为与其等效的正则表达式构建器，在正则表达式中移动光标时，会突出显示正则表达式的封闭子结构
  ![](./images/pic10.png)
* 在 Swift 代码中提供了 if case 语句的代码片段补全

### 编译时间可视化

随着项目的不断增大，编译耗时也会以肉眼可见的速度增加，这时候我们往往会进行编译耗时优化，那么该怎么优化，或者说需要针对哪些部分做优化，这就需要了解在整个编译过程中，各个部分的耗时，找到相应的瓶颈进行优化。那么如何统计各部分编译耗时呢，目前，Xcode 在编译的过程中会显示各个任务的耗时，我们可以使用诸如 ` XCLogParser` 之类的工具来系统的进行统计，但是需要我们手动安装工具，流程稍微复杂。现在，Xcode 14 中已经集成了 timeline 功能，通过对编译 timeline 的查看，我们可以很直观的了解到哪些编译任务耗时过长，以便进行点对点进行优化将大大降低我们的优化成本
![](./images/pic13.png)

> Tips:
> [更多关于编译时间可视化可以参考 Session 110364 - Demystify parallelization in Xcode builds ](https://developer.apple.com/videos/play/wwdc2022/110364/)

### 多平台

Xcode 14 专为多平台而生，现在，我们可以使用单一的 target 来定义我们的应用程序以及需要支持的平台，这样我们只需要处理每个平台特殊的配置，不必保持设置和文件间的同步。Xcode 14 中，单一的 SwiftUI 界面，在 iOS、iPadOS、macOS 和 Apple tvOS 上均可使用，这样我们的代码在易于维护的同时也可以达到利用每个平台的独特功能的目的
![](./images/pic17.png)

> Tips:
> [更多关于使用 Xcode 构建多平台 App 参考 Session 110371 - Use Xcode to develop a multiplatform app](https://developer.apple.com/videos/play/wwdc2022/110371/)

### 调试

* 内存调试器增强：在 Xcode 14 之前，Xcode 就提供了内存调试器，通过对内存调试器的使用，我们很容易发现应用程序中的内存泄露。现在 Xcode 14 对此调试器做了增强，可以显示内存图中的所有传入和传出引用，这样我们可以更容易了解到内存泄露的原因。此外，在 Xcode 14 中，你可以获取对象所占内存的总数，这样我们就更容易去发现一些大内存的对象，可以针对此做些优化，避免 OOM 的发生
  ![](./images/gif7.gif)
* 在 Xcode 14 中，LLDB 现在可以显示命令执行的进度，以便发现耗时较长的操作，便于优化
* 在 Xcode 14 中，可以使用 xcrun crashlog 来调用 LLDV 的崩溃日志脚本
* 在 Xcode 14 中，当我们调试应用程序时，线程性能检查器会在问题导航器和源代码编辑器中显示运行时性能问题，我们可以在应用程序运行的过程中选中线程性能检查器来开启此功能
  
### Swift Package

现在可以在 Xcode 14 中使用 Swift Package 命令行插件来对 Xcode 进行扩展，比如使用 Swift lint 或者是 Swift 代码格式化插件，我们可以在项目导航器中直接使用相关插件

我们可以选择命令应用的目标，以及将自定义参数传递给插件。如果命令指示它需要写入包的源文件，Xcode 会请求许可并让您在运行插件之前检查插件的源代码

Xcode 14 现在为 Swift Package 插件提供了 XcodeProjectPlugin API，扩展了 Swift Package Manager 的 PackagePlugin API。使用这个 API，插件可以获得 Xcode 项目结构的简化信息，这让在 Xcode 中运行的插件可以在项目中使用此 API

> Tips: 更多关于 Swift Package 插件参考
> [Session 110359 - Meet Swift Package plugins](https://developer.apple.com/videos/play/wwdc2022/110359/)
> [Session 110401 - Create Swift Package plugins](https://developer.apple.com/videos/play/wwdc2022/110401/)

## 其他新增功能

### 本地化

现在在 Xcode 14 中，可以像本地化应用程序一样本地化 Swift 包资源，你可以设置 Swift 包资源的默认本地化，Xcode 14 为工作区中包含的所有项目和 Swift 包生成单个本地化目录，我们可以使用 xcodebuild -importLocalizations 和 xcodebuild -exportLocalizations 来导出或导入 Swift 包

>Tips: 
> [更多关于本地化参考 Session 110110 - Building global apps: Localization by example](https://developer.apple.com/videos/play/wwdc2022/10110/)

### 设备选择器

为了运行我们的应用程序，我们需要选择一个设备来运行，现在 Xcode 14 针对此做了些优化，当可以使用的设备很多的时候，我们可以通过筛选来过滤我们想要运行的设备，最近选择的设备也会显示在设备选择器的最上方以方便我们选择:
![](./images/gif8.gif)

### Feedback

Xcode 14 在 Organizer（window -> Organizer）中新增了 feedback，以便我们根据反馈改进应用程序，通过 feedback，我们也能了解到我们的应用程序在用户设备上的表现。此外，feedback 也会展示一些其他诸如测试人员和设备等信息，方便我们对反馈的问题进行排查，如果我们需要更多的信息，可以直接点击 email 测试人员按钮，给相关测试人员发送邮件（feedback 主要针对 testFlight 用户）
![](./images/pic18.png)

### Hangs

Xcode 14 提供了应用卡顿的检测机制 hangs，通过 hangs 可以了解 App Store 上应用的卡顿情况。之前我们监控卡顿需要自行写相关代码实现（一般是在子线程监控 RunLoop 的 BeforeSource0 和 AfterWaiting 或者通过 ping 主线程实现，然后抓取堆栈上报）成本都比较高，现在 Xcode 14 集成了卡顿检测功能，我们只需要进入 hangs 列表，查看当前 hangs 比较严重的代码的堆栈，进行相应的优化即可
![](./images/pic19.png)

> Tips: 
> [更多关于 hangs 参考 Session 10082 - Track down hangs with Xcode and on-device detection](https://developer.apple.com/videos/play/wwdc2022/10082/)

### 资源目录

现在在 Xcode 14 中，可以使用一张 1024 * 1024 的图片充当应用程序的图标，Xcode 会自动针对图片应用的目标调整大小：
拖入 1024 * 1024 的图片 & 设置 Single Size
![](./images/gif9.gif)

此外，可以将 Finder 中的图像直接粘贴到资源目录大纲中，双击图像可以打开文件面板并选择替换资源图片

### 文档

Xcode 14 中的 Swift-DocC 现在支持为 Objective-C 和 C API 构建文档

Xcode 14 生成的 Swift-DocC 文档网站包括一个导航侧边栏，以便浏览和过滤文档，生成的 Swift-DocC 文档默认与现有的大多数托管服务兼容，比如 GitHub Pages

## 总结

以上就是本次 Xcode 14 新增的主要功能和优化点，其中诸如代码补全优化等还是比较让人振奋的，相信体积更小，编译速度更快的 Xcode 14 一定能给大家日常的开发工作带来不少效率上的提升
