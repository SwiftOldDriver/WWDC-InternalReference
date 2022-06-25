# WWDC22 - 如何降低网络延迟以打造更具响应性的 App
本文基于 [Session 10078](https://developer.apple.com/videos/play/wwdc2022/10078) 梳理，如需了解更多，可以浏览文末的参考来源。

## 前言
如何打造更具响应性的 App ，对于开发者来说是一个永恒的课题；原因无他，因为对于一个以网络交互为核心的现代应用来说，这是用户体验的核心所在：它意味着更流畅的音视频播放、低延迟的网络会议、快速加载的页面和资源、更少的游戏等待时间等等。2021年，苹果通过 [Session 10239: Reduce network delays for your app](https://developer.apple.com/videos/play/wwdc2021/10239) 给大家分享了许多网络延迟优化相关的理论知识，并提出了 RPM (每分钟往返次数) 的概念和基于此概念的测试工具；而今年，苹果在去年的基础上，又为我们带来了这一篇实战性质颇强的分享，从客户端侧、服务端侧、网络协议侧三个方面入手提供一系列行之有效的建议，帮助开发者们更好的分析和改善应用的网络延迟状况，从而打造更具响应性的 App 。

## 论网络延迟的重要性

### 网络延迟的定义
网络延迟指的是数据包从一个端发送到另一端所需要的时间；它决定了网络侧的内容经过多久可以到达你的设备和应用上。如果网络延迟很大，那么设备上的应用程序都会收到影响，从而导致糟糕的应用体验。

### 降低网络延迟 = 升级带宽？
举例而言，在视频会议的场景下，网络延迟可能会带来卡顿或者画面冻结，从而导致会议完全无法进行。为了解决此类问题，人们通常的做法有联系网络服务商来升级网络带宽、更换更好的网络设备、通过 mesh 组网构建更好的  wifi 网络等(如下图所示)。
![](./images/update_network.png)
这些措施从本质上来说都是升级网络带宽和优化网络质量的手段， 但它们仍无法完全避免问题的发生。有研究表明，通过增加带宽的手段一开始可以改善页面加载的时长，但当带宽超过一定的大小后，就收效甚微；对比来看，降低网络延迟则基本上一直可以减少页面加载时间，两者基本呈现线性关系。

![](./images/load_bandwidth.png)

![](./images/load_latency.png)
那么这究竟是为何？想弄清楚这一点，我们需要知道 App 的数据包是如何在网络上被传送的。当 App 从服务器请求数据时，数据包从网络堆栈中被发送出来；你可能以为它们会被无延迟的从网络上直接发送到服务器，但事实上，网络链路中最慢的一个节点通常积压了大量的数据包等待处理，这个数据包的积压队列往往会很大。

![](./images/packet_travel.png)

这样一来，从你的 App 往外发送的数据包不得不等待该积压队列全部处理完毕才能通过。在这个最慢的节点上的等待增大了 App 到服务器之间的往返时间；带宽的增加并不能够改善这种积压的问题，因此我们可以知道，升级带宽并不一定能改善网络延迟。

### 网络延迟 = RTT 次数 * RTT时间
当应用请求需要经过多次往返才能获得响应的时候，因积压导致的网络延迟问题会被放大。举例来说，一个常见的https请求需要经过4次往返才能获得响应（tcp 1次，tls 2次，http 1次，如下图），而且每次往返都会受到积压队列的影响，这个响应的总时间最终变得非常长。

![](./images/httprtts.png)

因此，我们可以看出，决定网络延迟的两个最重要的因素就是单次往返的耗时和往返的次数；降低它们即可显著的降低应用的延迟，从而提升应用的响应性。
![](./images/rtt.png)

## App侧的优化建议

## 服务端侧的优化建议

## L4S 最佳实践

人脸分析是 Vision 框架中人物分析的基石。Vision 框架目前主要提供了三方面的能力：

- 人脸识别
- 面部特征点识别
- 面部捕捉质量检测

#### 人脸识别


人脸识别相关的能力主要通过 DetectFaceRectanglesRequest 来实现，之前人脸识别支持了眼镜和帽子场景下的识别，最近引入了佩戴口罩场景的支持（至于原因大家都懂，新冠病毒让大家都戴上了口罩，因此这个场景就变成了刚需）。面部识别最主要的任务当然是识别出一个面部包围盒，但除此之外 Vision 还提供了面部姿态度量的检测。这里的度量参考了航空系统中的坐标系，其度量的维度分为三个：

分别是 roll (围绕 z 轴旋转的翻滚角) 、yaw（围绕 y 轴旋转的偏航角）、pitch（围绕 x 轴旋转的俯仰角，也是新加入的度量维度）。
这些度量结果目前可以实时的持续返回，也就是说我们可以动态的监控面部的姿态了。具体来说，它们是在 FaceObservation 的属性中返回，属于 DetectFaceRectanglesRequest 执行的结果。

#### 面部特征点识别


这部分能力是通过 DetectFaceLandmarksRequest 来实现，目前最新的修订版是版本三。这个版本提供了 76 个特征点的识别，包含了主要的面部区域和精确的瞳孔识别。

#### 面部捕捉质量检测

针对含有人脸的图像，Vision 提供了用来评价其中人脸质量的 API ：DetectFaceLandmarksRequest，目前最新的修订版是版本二。这个功能主要是让大家对比同一个人的人脸在不同情况下拍出来的照片质量的好坏，例如上图中左侧的人脸得分明显高于右侧的。这个评价标准综合了表情、光照、遮挡物、模糊度、聚焦程度等，进行一个综合的打分。它可以被用在相册等场景中（为用户自动选出或者推荐高质量的照片）。PS：截图右侧的就是 Vision 框架的大佬毛子哥了，哈哈哈。

### 人体检测


目前人体检测支持两种设置：仅上半身和全身。上面示意图的左侧和右侧分别展示了两种设置下的结果，大家可以根据自己的场景来使用。其中全身设置是新加入的，支持的最新修订版为版本二。为了和老版本兼容，默认情况下的设置是仅上半身。相关能力通过 DetectHumanBodyPoseRequest API 来提供。

### 人体姿势检测


### 手势检测

最新的手势检测 API 支持了对左右手的识别。关于这部分内容，可以参考 Session 10039（笔者对该 Session 也进行了二次创作）。

## 设计开发更具响应性的 App

### 人像分割介绍


下面就是重头戏了，毛子哥大部分时间都在讲解最新引入的人像分割技术。人像分割已经在很多领域（例如在线视频、自动驾驶、实时体育分析等）得到了广泛的应用。什么是人像分割呢？从上面的示意图我们可以很容易的理解到，人像分割就是把人像从场景中分离的技术。苹果设备中的肖像模式就利用到了人像分割的能力。这个特性被设计成和每一帧图像一起工作，也就是说，你既可以用它来进行实时的视频流处理，也适合用来做离线操作。这个特性不仅适用于 iOS，也可以在 macOS、iPadOS 和 tvOS 中使用。值得一提的是，Vision 框架实现的是语义人像分割，它意味着对于图像中的所有人像，只会返回一个单独的遮罩。

### 人像分割技术细节

Vision 中的人像分割能力通过 GeneratePersonSegmentationRequest 来实现。和 Vision 框架中的其他请求类型不同的是，这是一个有状态的请求。这意味着改请求在帧序列中是复用的。这样的设计也让我们在实时场景中可以保证一个相对平滑的体验。

人像分割的工作流如下：

- 创建一个请求；
- 创建请求的处理回调；
- 通过回调来处理请求的响应；
- 检查结果。

示例代码如下：

```swift
// Create request ，创建请求
let request = VNGeneratePersonSegmentationRequest()

// Create request handler，创建回调
let requestHandler = VNImageRequestHandler(url: imageURL, options: options)

// Process request 处理请求
try requestHandler.perform([request])

// Review results 检查结果
let mask = request.results!.first!
let maskBuffer = mask.pixelBuffer
```

请求结果中最重要的就是这个 maskBuffer , 它是从 VNPixelBufferObservation 中的 pixelBuffer 获取而来，它保存了产生的遮罩的信息。


对于请求来说有几个属性需要我们进行设置，主要是以下几个：

- revision 修订版本号，建议显式指定，保证行为的一致性
- qualityLevel 质量级别，分为三级，可以用来在速度和效果之间取得权衡
- outputPixelFormat 输出遮罩的格式，也分为三级，8 bit 整型，16 bit 浮点和 32 bit 浮点型

质量级别设置：

其中 accurate 级别为最高级，适用于静态图片处理场景；balanced 为中等级别，使用于视频处理； fast 适合于实时性要求高的流式处理场景。
下图展示了不同质量级别设置下的性能表现，可以看出差异是非常巨大的。


既然性能差异如此大，结果的视觉效果差异如何呢？请看下图：


可以看到，视觉效果的差异同样很明显，因此我们必须要根据我们的应用场景作出恰当的决策。


输出遮罩格式设置：

最后，我们要如何使用遮罩呢？
给定一个 input image， 一个 mask image, 一个 background image, 三者进行一个混合操作，得到最终的结果。
示例代码如下：

```swift
let input = CIImage?(contentsOf: imageUrl)!
let mask = CIImage(cvPixelBuffer: maskBuffer)
let background = CIImage?(contentsOf: backgroundImageUrl)!

let maskScaleX = input.extent.width / mask.extent.width
let maskScaleY = input.extent.height / mask.extent.height
let maskScaled = mask.transformed(by: __CGAffineTransformMake(
                                  maskScaleX, 0, 0, maskScaleY, 0, 0))

let backgroundScaleX = input.extent.width / background.extent.width
let backgroundScaleY = input.extent.height / background.extent.height
let backgroundScaled = background.transformed(by: __CGAffineTransformMake(
                          backgroundScaleX, 0, 0, backgroundScaleY, 0, 0))

let blendFilter = CIFilter.blendWithRedMask()
blendFilter.inputImage = input
blendFilter.backgroundImage = backgroundScaled
blendFilter.maskImage = maskScaled

let blendedImage = blendFilter.outputImage
```

最终效果演示：

### 多框架中使用人像分割

除了 Vision 框架外，我们还可以在其他多个技术框架中使用人像分割技术。
上图给出了一个对比，我们可以在适合的场景下自由选择使用，这让人像分割的应用对于开发者来说更加友好。这里贴出各个场景下的实例代码。

AVFoundation 中使用人像分割:

```swift
private let photoOutput = AVCapturePhotoOutput()
…
if self.photoOutput.isPortraitEffectsMatteDeliverySupported {
    self.photoOutput.isPortraitEffectsMatteDeliveryEnabled = true
}

open class AVCapturePhoto {
    …
    var portraitEffectsMatte: AVPortraitEffectsMatte? { get } // nil if no people in the scene
    …
}
```
	
ARKit 中使用人像分割：

```swift
if ARWorldTrackingConfiguration.supportsFrameSemantics(.personSegmentationWithDepth) {
    // Proceed with getting Person Segmentation Mask
    …
}

open class ARFrame {
    …
    var segmentationBuffer: CVPixelBuffer? { get }
    …
}
```
	
CoreImage 中使用人像分割：

```swift
let input = CIImage?(contentsOf: imageUrl)!

let segmentationFilter = CIFilter.personSegmentation()
segmentationFilter.inputImage = input

let mask = segmentationFilter.outputImage
```
	
### 人像分割最佳实践

毛子哥还给我们分享了以下的最佳实践:

- 画面中最多不超过四个人；
- 人像高度起码要达到画面高度的一半；
- 距离不要太远；
- 画面中不要出现雕像、人像照片等，避免误判情况产生。


## 总结

这篇分享主要介绍了人像分割以及 Vision 框架在人物分析方面的新能力；其简单易用的 API、多框架支持的设计对开发者非常的友好。如果这篇文章给了你一些启发或是你脑子里有了一些新点子，那么还等什么？跟随毛子哥的脚步，赶紧去动手实践吧！


## 参考
- [Apple - Reduce networking delays for a more responsive app](https://developer.apple.com/videos/play/wwdc2022/10078/)
- [Apple - Reduce network delays for your app](https://developer.apple.com/videos/play/wwdc2021/10239/)


