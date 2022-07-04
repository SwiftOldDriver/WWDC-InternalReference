---
session_ids: [10026]
---

# Session 10026 - 沟通影像世界的新桥梁——实况文本 API 介绍

本文基于[Session 10026](https://developer.apple.com/videos/play/wwdc2022/10026/)梳理。

> 作者：Eric(马楚鸿)，iOS 开发，坐标厦门，Swift 爱好者，目前在做远程视频会议开发。
>
> 审核：anotheren（刘栋），老司机周报编辑，就职于丁香园 iOS 团队，Swift 老司机。

## 背景介绍

实况文本（**Live Text**）是 **Apple** 为全平台新增的实用功能之一，简单来说，实况文本能够帮助我们把照片、相机界面当中的文字转化为可交互的文本。它不仅是一个系统级的 **OCR** 工具，而是包括一些人类可读的内容均能识别并进一步交互，比如识别照片中钟表上时刻，并提示创建基于该时间日程。在去年，实况文本的场景十分有限，只有输入文本的时候，简单配置下实况文本功能入口提醒，以及实况文本的扫描类型，除此以外没有其他可供交互的 **API**。而在今年的新系统上，官方开放了一系列封装好的实况文本 **API**，让我们可以方便地在应用中集成实况文本功能。集成这个功能后，用户可以对图片里的文本进行操作。例如对文本进行选中和复制，对内容快速查看和翻译，还有提供文本处理的工作流，像是查询内容中对应的地址、拨打文本中的电话号码或者跳转到文本里的 **URL**，等等。

## 序言

在这篇文章中，开始时会对实况文本的 **API** 做一个使用概述。接着会通过一个实例，讲解在静态图片上添加实况文本功能时要怎么使用这些 **API**。之后，会深入介绍一些实况文本 **API** 的相关使用技巧，最后会也对比下，其他系统组件在集成实况文本功能的方式差异，希望能够对你有所帮助。

> 实况文本仅提供 **Swift** 版本 API。

目前常用的场景有两种：

- 静态图片
- 暂停时的视频帧处理

本文主要是介绍静态图片内容相关的场景。 如果你是要分析的是摄像头实时采集画面，比如在画面中搜索像二维码之类的内容，`VisionKit` 也提供了一个内容扫描类，可以帮你处理该场景。

相关的内容，可以在以下链接获取更多信息。

- [WWDC2022-10025：Capture machine-readable codes and text with VisionKit][WWDC2022-10025]
- [WWDC2022 内参：VisionKit 的机器视觉方案，更智能的捕获文本与条码][WWDC-xiaozhuanlan]

在 **iPhone** 上，实况文本需要配备 A12 仿生或更新的芯片，并更新到 **iOS 16**；在 **Mac** 上，并无 Intel/M 系列要求，仅需更新至 macOS 13。

## API 初识

实况文本的 **API** 构成主要有以下几个类：

- `ImageAnalyzer`：图片内容的分析器。
- `ImageAnalysis`：分析图片后得到的分析结果，跨平台复用（平台无关）。
- `ImageAnalysisInteraction`：移动端上 **UI** 相关的结果交互展示载体。
- `ImageAnalysisOverlayView`：**Mac** 端上 **UI** 相关的结果交互展示载体。

![image][live-text-data-flow]

首先我们得有一张图，它是我们处理的主要对象。然后把这张图传给一个 `ImageAnalyzer`。让它帮我们做异步的分析处理。
当 `ImageAnalyzer` 处理好后，结果会封装到一个叫 `ImageAnalysis` 的对象给我们。我们再将这个 `ImageAnalysis` 对象传给 `ImageAnalysisInteraction`（**Mac** 上是 `ImageAnalysisOverlayView`），这样就完成了，是不是很简单？

## 示例导读

接下来我们会通过具体示例来讲解 **API** 的具体使用方法。我们准备了一个简单的图片查看工具。里面是一个内嵌了 `ImageView` 的 `ScrollView`。里面的图片内容是可以缩放跟滑动的，但图片里的内容还无法选中或者响应快捷操作。
![demo-app][demo-app]

接下来那我们就到项目里面给这个应用加实况文本功能。

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

我们需要先给定一个 `UIViewController` 的子类。然后声明一个 `ImageAnalyzer` 和 `ImageAnalysisInteraction` 属性变量。再在重写的 `viewDidLoad` 函数中给 `imageView` 赋上这个 `interaction` 实例。然后再找执行分析处理的合理时机。

> `addInteraction` 是 `UIView` 的 **API**，其参数类型 `ImageAnalysisInteraction` 实现了 `UIInteraction` 协议，而在 macOS 没有相应的设计，`UIInteraction` 协议也不支持 macOS。如果 macOS 上要实现相同的效果，需要使用特定的 `NSView` 子类 `ImageAnalysisOverlayView`，将其添加到需要视图上。所以我们在实际使用时，需要注意区分不同平台进行处理。

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
    // 分析当前图片
    func analyzeCurrentImage() {
        if let image = image {
            Task {
                // 配置 configuration 对象
                let configuration = ImageAnalyzer.Configuration([.text, .machineReadableCode])
                do {
                    // 开始执行分析
                    let analysis = try await imageDataAnalyzer.analyze(image, configuration: configuration)
                    // 检查 `analysis` 是否成功生成，图片是否有被修改
                    if let analysis = analysis, image == self.image {
                        // 分析信息结果接收
                        interaction.analysis = analysis
                        // 设置我们期望的交互方式类型
                        interaction.preferredInteractionTypes = .automatic
                    }
                } catch {
                 // 处理异常
                }
            }
        }
    }
    ···
 }
```

![image-viewer-demo][image-viewer-demo]

简单看下一下我们写的效果。实况文本的按钮出现了。我们也可以选择上面的文本。

如果是在 Mac 平台上，相关 API 会有什么不一样呢?

```
class ViewController: NSViewController, ImageAnalysisOverlayViewDelegate, NSGestureRecognizerDelegate {

    let imageDataAnalyzer = ImageAnalyzer()
    // 交互对象变成 ImageAnalysisOverlayView
    let overlayView = ImageAnalysisOverlayView.init(frame: .zero)
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // 通过 addSubview 为 imageView 添加交互视图
        imageView.addSubview(overlayView)
        self.image = imageView.image
        analyzeCurrentImage()
    }
    
    var image: NSImage? {
        didSet {
            imageView.image = image
            // 清空 overlayView 缓存内容
            overlayView.preferredInteractionTypes = []
            overlayView.analysis = nil
        }
    }
    
    override func viewDidLayout() {
        super.viewDidLayout()
        // 指定 overlayView 的布局样式
        overlayView.frame = self.imageView.bounds
    }
    
    func analyzeCurrentImage() {
        if let image = image {
            Task {
                let configuration = ImageAnalyzer.Configuration([.text, .machineReadableCode])
                do {
                    // 除了分析的图片图像，分析配置 configuration，分析函数还需要设置图片的旋转方向
                    let analysis = try await imageDataAnalyzer.analyze(image, orientation: .up, configuration: configuration)
                    if let analysis = analysis, image == self.image {
                        // overlayView 接收分析信息结果
                        overlayView.analysis = analysis
                        // overlayView 设置交互类型
                        overlayView.preferredInteractionTypes = .automatic
                    }
                } catch {
                    // 处理异常
                }
            }
        }
    }
}
```

我们可以看到除了交互对象变成 `ImageAnalysisOverlayView` 大部分的处理几乎一样。除此明显差异的地方有以下两点：

1. `ImageAnalysisOverlayView` 由于继承的是 `NSView`，添加到视图上的方式是 `addSubview`，当然也就同时需要设置 `ImageAnalysisOverlayView` 的布局样式。
2. macOS 的 `imageDataAnalyzer` 没有直接分析图片的 **API**，分析函数的参数需要有 `image`（图像），`orientention`(图片的旋转方向)，`configuration`（指定分析的内容配置）。旋转方向的参数是为了指定读取图片数据的起始位置和读取方向，以及让系统选定正确的处理程序。

![viewer-demo][viewer-demo]

这些交互控件的位置是自动放置的，并且会自动保持显示在画面边缘的可视区域位置。点击实况文本按钮会同时高亮图片内容中的所有可选择项，并且给其添加下划线。在画面左下角还会出一个快捷方式。点击快捷方式可以拨打内容中的电话号码，还可以长按，会弹出还有更多处理选项。

> 不得不说这样功能真的很酷还很方便。简单几行代码，整个基本主体功能就有了，我们也把一张图片的内容从信息世界带到了现实生活。

现在我们已经看到如何应用实况文本了，接下来会讲一些使用技巧，可能对你在使用它的时候会有所帮助。

## API 中的注意点

### 交互方式枚举

```swift
// 实况文本的几种交互方式枚举
ImageAnalysisInteraction.InteractionTypes 
```

`.automatic`: 大部分情况我们都喜欢用 `.automatic`，它有提供了文本选择功能。但同时它会在实况文本按钮变成可点击的时候，对检测到的内容区域进行高亮。这样会把图片内所有可操作项进行下划线提示，并且可以通过单击对其进行操作。这些跟你在一些内嵌应用中看到的效果是一样的。

> 我们需要给 `interactionTypes` 设置值才能让图片可以交互。它是一个 option set 类型，当你传递的 option set 中包含了 `.automatic`，那 option set 中的其它类型就会被忽略。它的默认值是一个空 option set，代表的意思是不可交互。

![interaction-type-automatic][interaction-type-automatic]

`.textSelection`: 只保留文本选择功能，在选择文本内容时，实况文本按钮就不会高亮了。

![interaction-type-selection][interaction-type-selection]

`.dataDetectors`：只检测文本内容而不需要文本选择。需要注意的是，设置成这个类型后，由于文本选择不可用了，实况文本按钮就会被隐藏。但是检测出来的文本内容会有下划线提示，并且变成可点击状态。

![interaction-type-data-detector][interaction-type-data-detector]

- `preferredInteractionTypes` 设成空值会让所有交互不可用。
- 当设置了 `.textSelection` 或者 `.automatic` 模式的时候，仍可以通过长按激活文本内容检测分析。这是通过 `interaction` 对象的 `allowLongPressForDataDetectorsInTextMode` 属性控制的，默认值是 `true`。需要的话设置成 `false` 就可以关掉这个设置。

> 以上的大部分枚举的含义及用法在 macOS 平台是相同的。除了最后提到的 `allowLongPressForDataDetectorsInTextMode` 属性，macOS 上由于平台交互效果的差异，没有该控制属性。

### 控件样式定制

![bottom-button][bottom-button]

我们接下来再介绍下在底部的这些按钮，看下要如何才能给他们设置成我们，它们主要都属于扩展控件（原文为：`supplementary interface`，指的是实况文本功能响应时的界面交互控件）。

实况文本功能里按钮的位置是系统自动设置好的。通常出现在右下角的位置，而快捷操作按钮则会放在左下的位置。当实况文本按钮变成高亮时，快捷操作按钮就会出现，它表示检测到的文本可以进行快捷操作。这些控件的大小、位置和是否可见都是通过 `interaction` 对象控制。

> 接下来讲的所有 `interaction` 对象属性的含义及用法，或者是其协议方法，在 macOS 平台上，除了对象换成 `ImageAnalysisOverlayView`，其它均都是相同的。

#### 布局样式

我们的应用可能会有不同风格的字体跟不同样式的控件。来看下我们可以怎么自定义控件的样式。

首先讲下 `isSupplementaryInterfaceHidden` 属性。如果只想要应用可以选择文本，而不想显示实况文本按钮，那就可以把 `isSupplementaryInterfaceHidden` 的值设成 `true`，那实况文本按钮跟快捷操作就都不会显示。

![supplementary-element-hidden][supplementary-element-hidden]

我们还可以设置内容的边距。如果我们有需要在控件上叠加其他的交互控件，那可能需要调整控件的边距，让实况文本按钮和快捷操作控件可以适配显示，避免被遮挡到。

```
interaction.supplementaryInterfaceContentInsets = UIEdgeInsets(top: 0, left: 12, bottom: 18, right: 12)
```

![supplementary-element-inset][supplementary-element-inset]

如果我们应用用的是自定义的字体。要想让这些扩展控件也能显示成对应的字体，那就设置 `interaction` 对象的 `supplementaryInterfaceFont`。这会让实况文本按钮和快捷操作控件的样式都产生变化，把它们都设置成自定义的字体和指定图形的文本权重值大小。

```
interaction.supplementaryInterfaceFont = UIFont.init(name: "Copperplate", size: 0)
```

![supplemetary-element-font][supplemetary-element-font]

> 按钮在做自适应大小计算时，实况文本会忽略设置的样式大小值，而是用原生默认字体大小进行计算。

##### 高亮区域匹配

注意下，有当前操作的不是 `UIImageView` 对象，而是其 `image` 属性对象，所以我们会发现高亮的区域跟 `image` 对象不是那么匹配。这是因为 `UIImageView` 的原因，`VisionKit` 是根据它的 `ContentMode` 属性来自动计算 `contentsRect` 大小。生成的交互视图是矩形的样式，而这个区域会比图片中的内容大许多。

![highlight-rect][highlight-rect]

要想解决问题，很简单，实现 `contentsRectForInteraction` 代理方法，在返回单元坐标系下表明大小跟位置的 `CGRect` 对象，表示清楚图片中内容跟上层交互视图边缘的距离。返回的 `CGRect` 对象会修正好边距问题，所以需要基于当前的内容和布局来进行调整。

```
// 该函数的默认返回值是一个单位坐标系下的矩形 { 0, 0, 1, 1 }
func contentsRect(for interaction: ImageAnalysisInteraction) -> CGRect {
    // 单位坐标系下的计算方法是（imageOriginX / imageViewWidth, imageOriginY / imageViewHeight, imageWidth / imageViewWidth, imageHeight / imageViewHeight）
    return CGRectMake(0.2, 0, 0.6, 1)
}
```

![highlight-rect-fix][highlight-rect-fix]

当交互控件的 `bounds` 属性有变化时，`contentsRectForInteraction` 也会随之被调用访问，但是，如果当 `contentsRect` 变化，交互控件的 `bounds` 不会受影响，我们可以主动调用`interaction` 对象的 `setContentsRectNeedsUpdate()` 方法来主动触发更新。

##### 控件层级

使用实况文本的时候，我们可能会遇到另外一个问题，在哪一个层级放这个 `interaction` 才是最恰当的位置呢？理论上，实况文本的 `interactions` 对象是直接放在持有图片内容对象的视图上。前面提到的 `UIImageView` 对象就是其 `interactions` 的持有者，它会处理 `contentsRect` 的计算，虽然不是必须要求的，但最好还是这样设置。接下来的就交给 `VisionKit` 处理。但是，如果 `ImageView` 是内嵌在一个 `ScrollView` 里面，我们可能会尝试把 `interaction` 设给 `ScrollView`，一般不推荐这么做，这会导致我们很难管理里面的视图，因为它的 `contentsRect` 会在交互过程中不断变化。解决方案还是老样子，把 `interaction` 放在持有图片内容的视图上，哪怕它是在一个支持放大的 `ScrollView` 中。

![view-hierachy][view-hierachy]

#### 手势冲突处理

接下来介绍下引入实况文本 **API** 时可能会遇到另外一个问题——手势冲突。实况文本的功能里有十分丰富的手势。有时当我们应用中的视图层级一复杂，我们可能会发现 `interaction` 对象响应了原来的手势和事件；或者反过来，我们的控件响应了 `interaction` 对象的手势和事件。这时候就需要我们来处理这个问题了。解决方案有以下几种：

##### 解决方案一：实现 `Interaction` 的 `interactionShouldBeginAtPointFor` 代理方法

```
func interaction(_ interaction: ImageAnalysisInteraction, shouldBeginAt point: CGPoint, for interactionType: ImageAnalysisInteraction.InteractionTypes) -> Bool {

    return interaction.hasInteractiveItem(at: point) || 
    interaction.hasActiveTextSelection
}
```

实现 `Interaction` 的代理方法`interactionShouldBeginAtPointFor`是一种通用的解决方式。如果返回的是 `false`，该动作事件就不会被响应。在触控的点位置判断是否有 `interaction` 响应的交互项，或者可以选择的文本。在这里检查文本是否可以选择，可以让我们轻触取消在文本上的点击响应。

##### 解决方案二：实现手势 `gestureRecognizerShouldBegin` 代理方法

这是最常用的解决办法，在我们手势对象的代理方法 `gestureRecognizerShouldBegin` 进行处理。这里我们在触摸的位置进行校验，看是否有可交互的文本内容或者可选择的文本，有则给方法返回 `false`。

```
func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {

    let windowPoint = gestureRecognizer.location(in: nil)
    let point = interaction.view.convert(windowPoint, from: nil)

    let cancelForLiveText = interaction.hasInteractiveItem(at: point) ||
    interaction.hasActiveTextSelection

    return !cancelForLiveText
}
```

在这个示例中，我们先是给计算转换坐标函数传 `nil`，来得到触摸点在当前 `window` 中的空间坐标，然后再把这个坐标转换得到其在当前视图的位置。如果我们的视图是在一个可以缩放的 `ScrollView` 中，那这个转换就很有必要了。如果我们发现触摸事件没有响应，用这个技巧试试。

##### 解决方案三：重写 `hitTest:WithEvent` 方法

```
override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let windowPoint = self.convert(point, to: nil)
    let interactionPoint = self.convert(windowPoint, to: interaction.view)

    if let bounds = interaction.view?.bounds, bounds.contains(interactionPoint)
        if interaction.hasInteractiveItem(at: point) || interaction.hasActiveTextSelection {
        return interaction.view
    }

    return super.hitTest(point, with: event)
}
```

直接通过重写 `UIView` 的 `hitTest:WithEvent` 方法。我们再像上一个方案一样做一下相同类型检查就行，不过我们在这里返回的是合适的视图。

#### 性能优化小技巧

虽然苹果的神经网络引擎性能已经十分高效，但本文还是有一些 `ImageAnalyzer` 的相关技巧要给大家分享。

![performance][performance]

1. 理想情况下，我们的应用中应该只有一个 `ImageAnalyzer` 对象。
2. `ImageAnalyzer` 同时支持好几种不同类型的图片（`UIImage`、`CGImage`、`CIImage`、`CVPixelBuffer`）。我们也需要尽量最小化图片在类型转换时带来的性能损耗，在这几种类型中，`CVPixelBuffer` 的图片对象处理起来最为高效，不过它需要在特定的场景才会生成，比如相机获取采集代理中的 `AVCaptureVideoDataOutput`时，或是 `AVAssetReader` 读取媒体资源时，又或者是 `AVPlayer` 播放视频时，这类媒体流相关的场景。
3. 为了把系统资源利用做到最优，我们需要在图片刚好或者提前准备上屏时，开始图片检测处理。
4. 如果我们的应用内容是想时间线一样可以滚动的内容，那就在滚动停止时再来开始图片检测。

目前我们看到的都是图片相关的实况文本 **API**，在系统中还有几个已经支持了的组件。像是 `UITextField`、`UITextView` 可以支持在键盘输入的时候，通过摄像头来采集实况文本到输入栏中。请查看下面这个 session：

- [WWDC2021-10276: Use the camera for keyboard input in your app][use-the-camera-for-keyboard-input-in-your-app]

## 扩展：文本输入时的实况文本功能

当我们的应用中有集成 `UITextField` 和 `UITextView` 这两个文本输入控件时，实况文本输入功能是默认值支持的。我们可以通过双击或者长按文本输入区域唤出它。当我们选择了使用实况文本功能，通过开启相机扫描周边环境的文本后，扫描的文本内容类型是可以配置的。它的配置方式是通过我们给文本输入控件限制内容类型来实现的。目前支持输入的内容如下图：

![text-content-type][text-content-type]

```
phoneTextField.keyboardType = .phonePad
// 由于我们文本检测分析依赖于原本的内容，所以这里自动纠正功能需要关闭
phoneTextField.autocorrectionType = .no

addressTextField.textContentType = .fullStreetAddress
```

## AVKit

`AVKit` 在新系统中也增加了实况文本支持，`AVPlayerView`（macOS） 和 `AVPlayerViewController`（iOS/tvOS）可以通过设置 `allowsVideoFrameAnalysis` 属性，在暂停的视频帧里自动进行实况文本处理，该功能是默认设置为 `true` 的。注意这个功能只能用在合法播放资源上。

```
let frame = playerLayer.currentlyDisplayedPixelBuffer() // AVPlayerLayer 的新 API
```

如果我们要用 `AVPlayerLayer`，一定注意是在当前视频帧中获取到 `currentlyDisplayedPixelBuffer` 后，再进行 `analysis` 和 `interaction` 对象处理。只有这样才能保证检测的帧内容是准确。只有当视频播放速率是 0。这个获取 `currentlyDisplayedPixelBuffer` 的结果才可用。这是一个浅拷贝的内存对象，而且一定不能用来写数据。

> 重要的事情提醒一下，这个功能只能用在非加密的播放资源上。非加密播放资源是指未使用官方 FairPlay 流式处理（FPS）格式加密的 **HTTP Live Streaming** (HLS) 内容。相关信息可以查看以下链接：
 
> [FairPlay Streaming][fps-hls]

## 结语

到这里本文就到尾声了。怎么样？与影像世界沟通的新桥梁都已经搭建出来了，那未来，是否我们也能沟通现实生活与 `realityOS` 中的世界呢？

[live-text-data-flow]: ./images/live-text-flow.png
[demo-app]: ./images/demo-app.png
[image-viewer-demo]: ./images/image-viewer-demo.gif
[viewer-demo]: ./images/viewer-demo.png
[interaction-type-automatic]: ./images/interaction-type-automatic.png
[interaction-type-selection]: ./images/interaction-type-selection.png
[interaction-type-data-detector]: ./images/interaction-type-data-detector.png
[bottom-button]: ./images/bottom-button.png
[supplementary-element-hidden]: ./images/supplementary-element-hidden.png
[supplementary-element-inset]: ./images/supplementary-element-inset.png
[supplemetary-element-font]: ./images/supplemetary-element-font.png
[highlight-rect]: ./images/highlight-rect.png
[highlight-rect-fix]: ./images/highlight-rect-fix.png
[view-hierachy]: ./images/view-hierachy.png
[performance]: ./images/performance.png
[use-the-camera-for-keyboard-input-in-your-app]: https://developer.apple.com/videos/play/wwdc2021/10276/
[quick-look-previews-from-the-ground-up]: https://developer.apple.com/videos/play/wwdc2018/237/
[text-content-type]: ./images/text-content-type.png
[WWDC2022-10025]: https://developer.apple.com/videos/play/wwdc2022/10025/
[WWDC-xiaozhuanlan]: https://xiaozhuanlan.com/topic/8205316479
[fps-hls]: https://developer.apple.com/streaming/fps/