---
session_ids: [10026]
---

# WWDC22 10026 - 如何应用中添加实况文本交互 

## 背景介绍
实况文本（Live Text）是 Apple 为 iOS 15 和 iPadOS 15 新增的实用功能之一，简单来说，实况文本是一个系统级的 OCR 工具，它能够帮助我们把照片、相机界面当中的文字转化为可交互的文本。在 iOS 16 系统中开放了一系列封装好的实况文本 API，让我们可以方便在应用中集成实况文本功能。在集成了这个功能后，用户可以对图片里的文本进行操作。例如对文本进行选中和复制，对内容快速查看和翻译，还提供了文本处理的工作流，例如由内容查询对应地址、拨打文本中的电话号码或者跳转到文本里的 URL。

## 序言
在这篇文章中，开始时会对实况文本的 API 做一个使用概述。接着会通过一个实例，讲解在静态图片上添加实况文本功能时要怎么使用这些 API。之后，会深入介绍一些实况文本 API 的相关使用技巧，最后会对比下其他系统组件在集成实况文本功能的方式差异，希望能够对你有所帮助。

> 目前实况文本 API 只有 Swift 版本。

目前常用的场景有两种：
- 静态图片
- 暂停时的视频帧处理

本文主要是介绍静态图片内容相关的场景。 如果你是要分析的是摄像头实时采集画面，比如在画面中搜索像二维码之类的内容，VisionKit 也提供了一个内容扫描类，可以帮你处理该场景。

 相关的内容，可以在以下 Session 获取更多信息。
 > [wwdc2022-10025: Capture machine-readable codes and text with VisionKit](https://developer.apple.com/videos/play/wwdc2022/10025/)

 Live Text API 从 iOS 16 开始，可以在配有苹果神经网络引擎（Apple Neural Engine）的设备上使用。Mac 上的版本要求是 macOS 13 系统及以后。

## API 初识
实况文本的 API 构成主要有以下几个类：`ImageAnalyzer`、`ImageAnalysis`、`ImageAnalysisInteraction或ImageAnalysisOverlayView`。

![image][live-text-data-flow]

开局你得有一张图。内容全靠编...“码”。然后把这张图传给一个 `ImageAnalyzer`。让它帮我们做异步的分析处理。 
当 `ImageAnalyzer` 处理好后，结果会封装到一个叫 `ImageAnalysis` 的对象给我们。我们再将这个 `ImageAnalysis` 对象传给 `ImageAnalysisInteraction`（Mac 上是 `ImageAnalysisOverlayView`），这样就完成了，是不是很简单？

## 示例导读
接下来我们会通过具体示例来讲解 API 的具体使用方法。我们准备的是一个简单的图片查看工具。里面是一个内嵌了 `ImageView` 的 `ScrollView`。里面的图片内容是可以缩放跟滑动的，但图片里的内容还无法选中或者响应快捷操作。
![demo-app][demo-app]

接下来那我们就到项目里面给这个应用加 Live Text 功能。

```swift
class LiveTextViewController: BaseViewController, ImageAnalysisInteractionDelegate, UIGestureRecognizerDelegate {
    
    let imageDataAnalyzer = ImageAnalyzer()
    let interaction = ImageAnalysisInteraction()

    override func viewDidLoad() {
        super.viewDidLoad()
        imageView.addInteraction(interaction)
    }
 }
```

我们需要先给定一个 `view controller` 子类。然后生命一个 `ImageAnalyzer` 和 `ImageAnalysisInteraction` 属性变量。再在重写的 `viewDidLoad` 函数中给 imageView 赋上这个 `interaction` 实例。然后再找执行分析处理的合理时机。

```swift
class LiveTextViewController: BaseViewController, ImageAnalysisInteractionDelegate, UIGestureRecognizerDelegate {
    ···
    var image: UIImage? {
        didSet {
            imageView.image = image
            interaction.preferredInteractionTypes = []
            interaction.analysis = nil
            analyzeCurrentImage()
        }
    }
    ···
 }
```

当我们新的 `image` 对象设置进来时，我们先重设 `preferredInteractionTypes` 和 `analysis` 两个属性的值。因为它们原本是还在被上一个图片对象持有的。然后就可以开始来分析图片了。

```swift
class LiveTextViewController: BaseViewController, ImageAnalysisInteractionDelegate, UIGestureRecognizerDelegate {
    ···
    func analyzeCurrentImage() {
        if let image = image {
            Task {
                let configuration = ImageAnalyzer.Configuration([.text, .machineReadableCode])
                do {
                    let analysis = try await imageDataAnalyzer.analyze(image, configuration: configuration)
                    interaction.analysis = analysis
                    interaction.preferredInteractionTypes = .automatic
                    interaction.allowLongPressForDataDetectorsInTextMode = false
                } catch {
                	// 处理异常
                }
            }
        }
    }
    ···
 }
```

我们创建了一个分析用的函数，先检查图片是否还存在。如果存在，创建一个 `Task` 任务。然后创建一个 `configuration` 对象，来告诉 `analyzer` 对象它查找的内容类型。在这里，我给 `configuration` 对象配置的是 `text` 和 `machine-readable` 两个参数。生成 `analysis` 结果对象可能会抛异常，所以适当的用 `try catch` 将其包起来。
最后，我们就可以用配置好的 `configuration` 作为参数传 `analyzeImage` 函数，让其开始分析处理。
一旦分析结果对象 `analysis` 生成完毕后，其存在状态就会发生变化，所以这里同时检查 `analysis` 是否成功生成，还有图片是否有被修改。
判断结果都没问题的话，就可以直接把 `analysis` 对象赋给 `interaction` 实例，并且设置下你期望的交互方式类型 `preferredInteractionTypes`。（做一个枚举说明）
这里用的是系统默认的类型 `.automatic`。
可以开始来测试一下我们写的效果。
看啊，实况文本的按钮出现了。我也可以选择上面的文本了。
这些交互元素的位置是自动放置的，并且会自动保持显示在画面边缘的可视区域位置。
点击实况文本按钮会同时高亮图片内容中的所有可选择项，并且给其添加下划线。在画面右下角还会出现一个快捷方式。
点击快捷方式可以拨打内容中的电话号码，还可以长按，会弹出还有更多处理选项。
不得不说这真的很酷。
简单几行代码，我就可以把一张图片的内容从信息世界带到现实生活。
现在这个应用就可以在图片上选择文本、从图片提炼内容做数据处理、扫码、信息查询和翻译文本等等操作。
 凭这几行代码就能有这么丰富功能，可谓厉害啊！
 
******************* 图片加实况文本应用
现在你已经看到如何应用实况文本，我接下来会讲一些使用技巧，可能对你在使用它的时候会有所帮助。
先说下 interaction 的集中枚举类型
大部分情况我们都喜欢用 `.automatic`，它有提供了文本选择功能。但同事它会在实况文本按钮变成可点击的时候，对检测到的内容区域进行高亮。
这样会把图片内所有可操作项进行下划线提示，并且可以通过单击对其进行操作。
这些跟你在一些内嵌的应用中看到的效果一样。
如果你只想要你的应用保留文本选择功能，你就需要把类型设成 `.textSelection`，那你在选择文本内容时，实况文本按钮就不会高亮了。
但是，如果你的应用只想要检测文本内容而不需要文本选择，那就把类型设置成 `.dataDetectors`。
需要注意的是，设置成这个类型后，由于文本选择不可用了，实况文本按钮就会被隐藏。但是检测出来的文本内容会有下划线提示，并且变成可点击状态。
把 preferredInteractionTypes 设成空值会让所有交互不可用。
最后还有提示，用  `.textSelection` 或者 `.automatic` 模式，你会发现仍常可以通过长按激活
 这是通过 interaction 对象的 allowLongPressForDataDetectorsInTextMode 属性控制的，默认值是 true。
 ***************** 唤出 实况文本监测工具的几种方式
需要的话设置成 false 就可以关掉这个设置。
我们再用一点篇幅介绍下在底部的这些按钮，它们主要都属于扩展控件（原文为：`supplementary interface`，指的是实况文本功能响应时的界面交互控件）。
实况文本按钮通常出现在右下角的位置，而快捷操作按钮则会放在左下角。
当实况文本按钮变成高亮时，快捷操作按钮就会出现，它表示检测到的文本可以进行快捷操作。
 这些控件的大小、位置和是否可见都是通过 interaction 对象控制。
******* 使用实况文本时出现的工具按钮
默认的按钮位置看着是系统自动配好的。你的应用可能会有自定义字体跟图形符号的控件。
来看下你可以怎么自定义这里面的样式。
首先讲下 isSupplementaryInterfaceHidden 属性。
如果我想要的应用可以选择问题，但是不想显示实况文本按钮，那就可以把 isSupplementaryInterfaceHidden 的值设成 true，那实况文本按钮跟快捷操作就都不会显示。
我们同时可以设置内容的内边距
如果我们有需要在控件上叠加其他的交互控件，你可能需要调整控件的内边距，让实况文本按钮和快捷操作控件可以适配显示，避免被遮挡到。
如果你的应用用的自定义的字体。你想让这些扩展控件也能显示成对应的字体，那就设置 interaction 对象的 supplementaryInterfaceFont。这会让实况文本按钮和快捷操作控件都设置成自定义的字体和指定图形的文本权重值大小。
注意这时按钮在做自适应大小计算时，实况文本会忽略开发者设置的样式大小。
注意下，如果你当前操作的不是 UIImageview 对象，而是其 image 属性，所以你会发现高亮的区域跟你的 image 对象不是那么匹配。
则是因为 UIImageView 的原因，VisionKit 是根绝它的 ContentMode 属性来自动计算 contentsRect 大小。
生成的交互视图的区域会比图片中内容还要大许多，这是默认生成的矩形样式。
要想解决问题，很简单，实现 contentsRectForInteraction 代理方法，返回单元坐标系下表明大小跟位置的 CGRect 对象，表明图片中内容跟上层交互视图边缘的正确距离关系。（内边距的取值范围）
返回 CGRect 对象会修正好边距问题，但请基于你当前的内容和布局来进行调整调整 CGRect 中的值。
 当你的交互控件的 bounds 属性有变化时，contentsRectForInteraction 也会随之被调用访问，但是，如果你的 contentsRect 变化，交互控件的 bounds 不会受影响，你可以主动调用 interaction 对象的 setContentsRectNeedsUpdate() 方法来主动触发更新。
********** 样式定制逻辑
使用实况文本的时候，你可能会遇到另外一个问题，在哪一个图层放这个 interaction 才是最恰当的位置呢？ 理论上，实况文本的 interactions 对象是直接放在持有图片内容对象的视图上的。
这里的就是前面提到的 UIImageView 对象，它会处理 contentsRect 的计算，虽然不是必须要求的，但最好还是这样设置。
如果你用的是 UIImageView，就把 interaction 设置给 imageView。接下来的就交给 VisionKit 处理。
但是，如果你的 ImageView 是内嵌在一个 ScrollView 里面，你可能会尝试把 interaction 设给 ScrollView，但是一般不推荐这么做，这会让你很难管理里面的视图，因为它的 contentsRect 会在交互过程中不断变化。
解决方案还是老样子，把 interaction 放在持有你图片内容的视图上，哪怕它是在一个支持放大的 ScrollView 中。
接下来，准备介绍下手势相关的技巧。实况文本的功能里有十分丰富的手势。
根据你应用中的视图层级，你可能会发现 interaction 对象响应了原来的手势和事件，或者反过来你的手势响应者变成 interaction 对象。
别慌。
这里告诉你几个技巧，可以帮助你在遇到这些问题的时候进行处理。
一种通用的纠正办法是实现 InteractionType 的代理方法 interactionShouldBeginAtPointFor。
如果你返回的是 false，该动作事件就不会被响应。
另一个办法是，在触控的点位置判断是否有 interaction 响应的交互项，或者有可以选择的文本。
在这里检查文本是否可以选择，让你可以轻触取消在文本上的点击响应。
要是你发现你的 interaction 没有响应手势，可能是你的应用其他的手势处理方法响应了该次交互。
在这种情况下，你可以用常用的解决办法，在你的手势对象的代理方法 `gestureRecognizerShouldBegin` 进行处理
这里我们在触摸的位置进行校验，看是否有可交互的文本内容或者有可选择的文本，有则给方法返回 false。
另一方面。
在这个示例中，我先是给计算转换坐标函数传 nil，来得到触摸点在当前 window 中的空间坐标系，然后再把这个坐标转换到当前交互的视图。
如果你的视图是在一个可以缩放的 ScrollView 中，那这个转换就很有必要了。
如果你发现触摸事件没有响应，用这个技巧试试。
另一个相似的做法是，我发现可以通过重写 `UIView` 的 `hitTest:WithEvent` 方法。
我们再来，像之前一样做一下相同类型检查，在这里返回合适的视图。
总的来说，我们希望你的应用可以尽可能的快速响应用户的交互事件，虽然 Neral（需要做一次简介说明一下这是什么）引擎性能已经十分高效，但本文还是有一些 ImageAnalyzer 的相关技巧，要来给大家分享。
*********手势冲突时的处理
理想情况下，你的应用中应该只有一个 ImageAnalyzer 对象。
而且，我们同时支持好几种不同类型的图片（看下找下支持什么样的图片）。
你也需要尽量最小化图片在类型转换时带来的性能损耗，这里推荐 CVPixelBuffer 的图片对象，这种类型处理起来最为高效。
同时，为了把系统资源利用做到最优，你需要在图片刚好或者提前准备上屏是，开始你的图片检测处理。
如果你的应用内容是想时间线一样可以滚动的内容，那就在滚动停止时再来开始图片检测。
 目前你看到的都是图片相关的实况文本 API，在系统中还有几个已经支持了的组件。
像是 UITextField、UITextView 可以支持在键盘输入的时候，通过摄像头来采集实况文本到输入栏中。
还有 WebKit 和 `快速查看` 也都已经支持 实况文本
 更多信息，请查看这些 sessions：
 （弄一个思维导图）
************** 用法时机及场景
新一年的 iOS 16，我们给 AVKit 加了实况文本支持。
 AVPlayerView 和 ViewController 可以通过设置 allowsVideoFrameAnalysis 属性，在暂停的视频帧里自动进行实况文本处理。
注意这个功能只能用在合法播放资源上。
如果你正在用 AVPlayerLayer，你一定注意是在当前视频帧中获取到 currentlyDisplayedPixelBuffer 后，再进行 analysis 和 interaction 对象处理。
只有这样才能保证检测的帧内容是准确。
只有当视频播放速率是 0。这个获取 currentlyDisplayedPixelBuffer 的结果才可用。这是一个浅拷贝的内存对象，而且一定不能用来写数据。
重要的事情再提醒一下，只能用在合法播放资源上。
我们很期望看到给你的应用带来实况文本功能。
在此代表实况文本团队的每个人，谢谢你们来观看我们的这个课程。
不知道你们如何使用这个功能来处理你应用中的图片呢？
好了，玩得开心！

[live-text-data-flow]: ./images/live-text-flow.png
[demo-app]: ./images/demo-app.png
[poems-app-design]: ./images/poems-app-design.png
[iOS-and-iPadOS-16-Beta-Release-Notes]: https://developer.apple.com/documentation/ios-ipados-release-notes/ios-ipados-16-release-notes
[poems-app-screenshot]: ./images/poems-app-screenshot.png
[poems-source-code]: https://github.com/zddhub/poems
[navigation-stack-diagram]: ./images/navigation-stack-diagram.gif
[two-column-view]: ./images/two-column-view.png
[three-column-view]: ./images/three-column-view.png
[migrating-to-new-navigation-types]: https://developer.apple.com/documentation/swiftui/migrating-to-new-navigation-types
[wwdc-110358]: https://developer.apple.com/videos/play/wwdc2022/110358/
