## WWDC21 10076 - 使用 Object Capture 创建 3D 模型
Apple 自 2017 年推出 ARKit 以来一直在推动增强现实技术在其各个平台上的应用和发展，但 AR 内容的匮乏与高成本一直是制约开发者们投入 AR 的重要因素。在本次 WWDC 上，Apple 将 3D 模型的构建效率提升了到了前所未有的高度，RealityKit 2 框架中的新 Object Capture API 为我们提供了一种非常便捷的方式来为生活中的物体创建 3D 模型，而你需要的仅仅是为目标物拍摄几张照片。此外，配和 AR Quick Look 可以轻松将创建好的模型集成到你的应用之中。

本文会重点介绍如何使用 Object Capture 来创建 3D 模型以及在实践时需要注意的方面，同时包括如何将你模型通过 AR Quick Look 进行呈现。相关 session 包括：
 
> [Session 10076 Create 3D models with Object Capture](https://developer.apple.com/videos/play/wwdc2021/10076/)   
> [Session 10078 AR Quick Look, meet Object Capture](https://developer.apple.com/videos/play/wwdc2021/10078)  

## 概述
过去如果你想要为一个生活中常见的物体创建 3D 模型，你可能需要请专业人员花费数个小时来为其形状和纹理进行建模。而有了 Object Capture ，你可以从为物体拍摄不同角度的照片开始，然后将照片传到一台支持 Object Capture API 的 macOS 电脑上，通过计算机视觉技术 Photogrammetry ，将一组 2D 的照片变成 3D 模型，该模型中包括坐标信息和材质纹理，并且可以直接拖入你的项目或通过 AR Quick Look 预览。

![summary]()

### 拍摄照片
创建模型的第一步是为你的目标物拍摄全角度的照片，拍摄设备可以是 iPhone 、 iPad 、单反相机、微单相机甚至无人机。确保你的照片足以清晰的覆盖到目标物的所有角度。如果你使用 iPhone 或 iPad 进行拍摄， 还可根据立体深度数据对物体的真实尺寸进行校准以及利用重力模型将物体以其真实方位放置。

### Photogrammetry
下一步是将拍摄好的照片传给你的 Mac 电脑，如果你的电脑使用的是 Intel 处理器，那么最低要求是**4 GB 显存的 AMD 显卡 + 16GB 内存**，如果是最新的装有 Apple 处理器的电脑，Photogrammetry 的处理速度将会更快。同时，Apple 还提供了名为**HelloPhotogrammetry**的命令行应用，可以直接在你的照片文件中快捷的创建 3D 模型。

### Model output
接下来就可以在你的 Mac 中导出你的 3D 模型了，Object Capture 提供三种导出格式：USDZ、USDA 和 OBJ 。

> USDZ：即 Universal Scene Description ，是 Apple 与皮克斯共同研发的 USD 格式基础上的 AR 素材存储格式。除 Apple 外，Adobe、Autodesk、Sketchfab、Pixar、PTC、Quixel 也都支持这种格式。  

而在细节方面，Object Capture 支持以下四种 detail level 以适应不同的使用场景，后文会详细介绍 level 之间的区别：
* Reduced
* Medium
* Full
* Raw

如果你导出了 **Reduced** 或 **Medium** 级别的 USDZ 模型，便可以在 iPhone 或 iPad 上使用 AR Quick Look 快捷的将模型进行展示到你的 App 或网页中。

以上便是如何将生活中的物品通过 Object Capture 转换为 3D 模型的大致步骤和要求，下面我们来看看 Object Capture 的工作流及最佳实践。

## Object Capture 的基础工作流
基础工作流主要包括**设置**和**构建**两个部分:

![basic_workflow]()

### 设置
设置阶段是 Object Capture 工作流中的第一步，首先我们需要创建一个 Photogrammetry session ，前提是需要准备好素材图片的文件夹，在官方的 API 文档中提供了一些素材图片可供我们使用，在图片格式方面，支持 HEIC 、JPG 、 PNG 。`PhotogrammetrySession`在 Object Capture API 中的地位非常重要，可以说是我们对其行为进行控制的关键。最简单的初始化方式，是提供一个素材图片的文件路径：
```swift
import RealityKit

let inputFolderUrl = URL(fileURLWithPath: "/tmp/Sneakers/", isDirectory: true)
let session = try! PhotogrammetrySession(input: inputFolderUrl,
                                         configuration: PhotogrammetrySession.Configuration())
```

此外，Object Capture 还提供更“高阶”的初始化方式，即除了图片素材外，你还可以提供比如某些相机中的元数据，如深度缓存、重力信息等，这些元数据在 Photogrammetry 中被称为 **Sample** ，将会影响 Object Capture 的构建算法，具体提供的 Sample 序列如下：

![photogrammetry_sample]()

如果想要传入上述类型的 **Sample** ，可以使用下面这个初始化方式：
```swift
/// Creates a session from a sequence of samples.
init<S>(input: S, configuration: PhotogrammetrySession.Configuration)
```

完成了 Session 的创建，在通过 `process()` 方法让 Photogrammetry 开始构建模型前，我们需要对之后 `PhotogrammetrySession`在构建过程中通过**消息流**发送的各种回调 message 进行监听，包括状态和错误，以及输出最终的结果。在 session 的整个生命周期内**消息流**都会处于活跃状态，下面是一个监听示例：

```swift
async {
    do {
        for try await output in session.outputs {
            switch output {
            case .requestProgress(let request, let fraction):
                print("Request progress: \(fraction)")
            case .requestComplete(let request, let result):
                if case .modelFile(let url) = result {
                  print("Request result output at \(url).")
                }
            case .requestError(let request, let error):
                print("Error: \(request) error=\(error)")
            case .processingComplete:
                print("Completed!")
                handleComplete()
            default:  // Or handle other messages...
                break
            }
        }
    } catch {
       print("Fatal session error! \(error)")
    }
}
```

> 上述示例使用了 Swift 最新的 async/await 特性来创建了一个消息流的分发任务，感兴趣的同学可以关注我们关于这一特性的最新总结：[探索 Swift 结构化并发](https://xiaozhuanlan.com/topic/3625784190)  

示例中的 `output` 是一个 enum ，封装了所有输出消息的类型，并用关联值传递数据。注意在 `.requestComplete(let request, let result)` case 中，如果 `result` 返回 `.modeFile(let url)` ，我们会用返回的地址发起一个输出请求，后面会详细讲解。`. requestProgress(let request, let fraction)` 会不断输出当前的处理进度。此外，因为 `PhotogrammetrySession` 支持并发处理多个请求，在处理上应要加以区分，只有在 `process()`发起的所有请求都处理完成，我们才会收到 `.processingComplete `消息。

准备工作做完后，接下来我们来看看 Object Capture 工作流中的另一部分，构建。

### 构建
这一部分的重点是如何用我们准备好的 `PhotogrammetrySession` 来调用构建方法即 `func process(requests: [PhotogrammetrySession.Request]) throws` 并发起各种请求，不同类型的请求会对应各自的输出结果。

#### 不同类型的请求
**Model File Request**是最常用的请求，提供两种类型并根据你传入的 URL 地址参数来进行区分，如果你直接传入了一个 USDZ 文件拓展名为后缀的路径，那么会直接输出 USDZ model 文件；如果你传入的是一个文件夹路径，则会输出 USDA + OBJ 文件以及素材文件夹。

另一个参数 `PhotogrammetrySession.Request.Detail` ，也就是我们上文提到的细节程度的级别，在这里被封装成一个 enum ，每个级别所包含的复杂度及输出的文件大小均有不同：

|**Detail Level**|**Triangles**|**Estimated File Size**|
|——|——|——|
|.preview|<25k|<5MB|
|.reduced|<50k|<10MB|
|.medium|<100k|<30MB|
|.full|<250k|<100MB|
|.raw|<30M|Varies|

最后**Model File Request**的创建还提供一个可选参数，类型是 `PhotogrammetrySession.Request.Geometry`。用来控制输出模型的尺寸以及缩放、旋转等。

**ModelEntity Request**与**BoundingBox Request**可以输出 `RealityKit` 中的`ModelEntity` 和 `BoundingBox`，提供交互式的预览。**ModelEntity Request**同样需要一个 `detail` 参数来确定输出细节的精细程度，以及一个可选参数 `geometry`。与 **Model File Request** 不同的是，**ModelEntity Request**直接会直接将模型输出到内存中。**BoundingBox Request**则用于为你的目标物提供一个大致的空间大小，后续可以在你的构建中进行调整，后面我们会详细展开。

下面我们来看看代码中如何进行模型的构建。

```swift
try! session.process(requests: [
    .modelFile("/tmp/Outputs/model-reduced.usdz", detail: .reduced),
    .modelFile("/tmp/Outputs/model-medium.usdz", detail: .medium)
])
```

代码中可以看到，我们向 `requests` 数组中传入了两个 **Model File Request** ，这是因为 Object Capture 支持同时处理多个请求。我们分别为两个请求传入了不同的 detail level ，并提供不同的输出文件路径，因此最终我们会得到两个 USDZ model 。你甚至可以同时发起所有 detail level 的请求，因为 Object Capture 在处理过程中会共享不同 level 间的数据，因此处理速度上也会比逐个请求快很多。

当你调用了 `process()` 方法，除非碰到错误（比如找不到你的参数路径，则会立即将错误抛出并终止构建），构建过程会立即开始，之后我们就可以在 `PhotogrammetrySession` 的 output 输出消息流中收到回调消息。

构建的时长会受到图片数量及你选择的 detail level 的影响，当收到构建完成的消息，你就可以在你的 Mac 中预览刚刚生成的 USDZ 模型了，从不同的视角来检查你的构建成果。

以上就是 Object Capture 基础工作流程的介绍，下面我们来更进一步，看看交互式的工作流程是怎样的。

## Object Capture 交互式工作流
这里的“交互”是指在输出你的 3D model 之前，新增了一个 **preview** 的环节，在这个环节你可以通过 GUI App 对你的模型进行预览，并对大小、形状、方向等参数进行调整。因此，交互式工作流相对基础工作流来看，差别就是中间新增的**预览**与**调整**环节：

![interactive_workflow]()

如果你想预览和调整你的模型，同样需要发起一个 **preview request** ，并传入我们之前介绍过的 `PhotogrammetrySession.Request.Geometry` 类型的 `geometry`参数。下面通过一个基于 Object Capture API 开发的 MacOS App 来演示这一工作流程：

![preview_app]()

在左边的操作界面可以看到，点击**Folder**图标选择素材，点击**Output**图标选择输出路径。在左下角使我们前面介绍的 **detail level** 选项，而两个条形按钮分别是**Preview**和**Create Model**。而我们点击 **Preview** 按钮，过一会就会生成预览模型了：

![preview_model]()

可以看到右边已经出现了我们的预览模型，它处在一个 bounding box 中，它是通过我们在 `process()` 方法中传入的 **Bounding Box Request** 生成的，通过上面的锚点，可以对 bounding box 的大小进行调整，只有身处 box 内部的模型会被保留下来。

## 最佳实践
接下来我们来看看 Object Capture 在实践过程中的一些需要注意的部分。

### 目标物的捕捉
首先需要选择合适的目标物，具有以下特性的物体更容易生成优质的模型：
* 足够的纹理细节
* 表面尽量少一些反光的部分
* 弯折的时候要能保持稳定的形状
* 如果表明上有很精细的结构，那么那么你需要使用高分辨率的相机进行拍摄

而在拍摄你的目标物时，为了能生成全方位无死角的高品质立体模型，需要注意以下几点：
* 确保目标物在相机的焦点
* 要从全角度对目标物进行拍摄，包括将其不断翻转以免遗漏某些角度
* 要离目标物足够近
* 确保照片之间的交叠部分能达到 70% 

> 根据不同目标物的特点，构建一个 3D 模型一般需要 20~200 张照片  

### 输出合适的模型
我们之前提过，Object Capture 的输出模型可以选择不同的 detail level ，你需要根据自己的使用场景和对精细程度的要求来进行选择：

![detail_levels]()

**Reduced**和**Medium**经过处理会舍弃一些细节以占用更小的内存，可以用于 Web 浏览器和 App 中，并支持 AR Quick Look ，下一部分我们将展开介绍关于 AR Quick Look 与 Object Capture 的激情碰撞。**Full**和**Raw**更适合用于更高端、可交互的专业级场景，如电脑游戏等，它们拥有丰富的 `geometry` 信息并且支持是否对素材进行处理。如果你想了解更多关于如何在专业级的工作流中使用 Object Capture ，可以关注 Create 3D Workflows with PSD Session 。最后别忘了，如果你想在不同场景下使用你的 3D 模型，可以在 process 时同时发起不同 detail level 的请求。

### Reality Composer
Reality Composer 是 Apple 官方出品的 AR 模型工具，可以在 iPhone 或 iPad 上为你的 3D 模型添加交互动作等等。我们通过 Object Capture 生成的 USDZ 模型可以非常方便的通过 Reality Composer 进行加工，从而得以适用到更多场景之中，实现很多有趣的交互效果。

![reality_composer]()

## Object Capture + AR Quick Look
我们已经了解如何通过 Object Capture 来便捷的生成 3D 模型，如果你想同样便捷将自己的成果展示到  App 或 网页之中，AR Quick Look 绝对是不二之选。AR Quick Look 是 iOS 系统内置的 AR 内容展示工具，同时支持 Safari 、 Message 、 Flie 等系统应用。

### 集成 AR Quick Look
要在 App 中使用 AR Quick Look 其实非常简单，几行代码就可以搞定：

```swift
// File: MyPreviewController.swift
func presentARQuickLook() {
	let previewController = QLPreviewController()
	previewController.dataSource = self
	present(previewController, animated: true)
}

// MARK: QLPreviewControllerDataSource
func previewController(
  _ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
	  let previewItem = ARQuickLookPreviewItem(fileAt: fileURL) // Local file URL

	  return previewItem
}
```

在 Web 中使用 AR Quick Look 也同样非常简单：

![ar_quick_look_web]()

### 最佳实践
下面我们来看看用 AR Quick Look 来展示 Object Capture 生产的 3D 模型这一过程中需要注意的地方。

首先是 detail level ，之前我们已经提到 AR Quick Look 只支持 **Reduced** 和 **Medium** 两个 level 的 USDZ 模型。这两者之间在使用场景上也有区别，**Reduced** 因为细节更少、体积更小而比较适合在网页中通过 AR Quick Look 展示，因为不会占用过多的资源下载时间，同时在展示多个模型时会有更稳定的表现，如果要求不高的话可以作为默认选择。而在 App 中，因为我们可以预先将资源置于本地，从而摆脱下载耗时的限制，同时又要满足更精细的展示需求，这时可以选择 **Medium level** ，不过还是要关注资源的大小。

此外，尽量保证在尽可能多的设备上测试过你的展示效果，关注不同设备上的兼容性和性能等问题。

还有一点非常重要，像我们之前提过的，要保证素材图片的质量，在拍摄高清晰度的照片的同时记得照片之间要保持有 70% 以上的交叠部分。

## 最后
通过对 Object Capture 的了解我们可以看到，过去制约开发者们投入 AR 的门槛被大大降低了，无论是基础应用场景亦或是专业级的应用场景，制作 3D 模型变的前所未有的方便，使用 Reality Composer 更是能支持多个模型同时展示以及添加交互动作，最后结合 AR Quick Look 更是能快速的将你的生成的模型集成到你的应用中。希望未来在线上购物、教育、展览甚至更多的场景上可以看到 AR 的身影，期待开发者们的奇思妙想！Let`s AR!
