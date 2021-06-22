What’s new in AVFoundation


> 本篇来源为WWDC2021 中 [What’s new in AVFoundation](https://developer.apple.com/videos/play/wwdc2021/10146/) 

本Session会介绍三个主题：音频元信息，视频元数据合成和字幕创作

# 音频元信息
在这一部分，我们会多花一些时间讨论 AVAsset 检查元数据的新能力，然后再快速介绍另外两个功能：视频合成与元数据和字幕文件创作。

事不宜迟，让我们进入我们的第一个主题：
**AVAsset 异步查看元信息**

先了解一下 AVAsset 的背景知识：
>AVAsset 是 AVFoundation 的核心模型对象，用于表示存储在用户设备上或远程服务器的媒体文件内容，当然也包括流媒体（例如 HTTP Live Streams ）或其他形式的视听内容

<img src="https://images.xiaozhuanlan.com/photo/2021/006873e54a66272bf1e214468f7acca5.png" width=600>

当我们拥有媒体资源时，除了播放之外，经常遇到的场景是检查它的元数据，比如
- 它的持续时间是多少？
- 它包含的音频和视频的格式是什么？

这就是我们在本Session中要讨论的内容——媒体资源检查

当我们试图获取媒体资源元数据时，都需要牢记一件重要的事情：
**媒体资源检查按需进行，这主要是因为媒体文件会非常大**

*比如：一部长篇电影的大小可能动辄几个GB*

所以我们并不会立刻下载整个文件，而会一直等待——直到需要时才加载属性值，然后才下载所需要的元数据

其次要记住的是媒体资源检查是一个<u>异步过程</u>——这非常重要，因为网络 I/O 也有开销；如果媒体资源存储在网络中， AVAsset 将在准备好时通过异步回调告知结果

关于上面，我们有一个用于检查媒体资源属性的新 API，如下：
![](https://images.xiaozhuanlan.com/photo/2021/d76ce0f29a542df78936f0db214277a3.png)

*需要注意的是这是新的 load 方法，它接受一个属性标识符——在本例中为.duration(持续时间)*

每个属性标识符在编译时都与一个结果类型相关联，它决定了 load 方法的返回类型。

*在上面例子中，持续时间是一个 CMTime，所以返回结果也是此类型*

一个新的知识点是 await 关键字—— Swift 中的一项新功能，方便调用方标知道 load 方法是异步的

> 有关 async/await 的详细介绍，可以参考Session 10132: [Meet async/await in Swift](https://developer.apple.com/videos/play/wwdc2021/10132/)

 为了快速了解如何使用我们的新属性加载方法，我们通常将 await 关键字视为将调用函数分为两部分。


- 有一部分操作发生在异步操作开始之前：我们创建一个媒体资源并要求它加载其持续时间
  - 此时，会执行相关的 I/O 和解析确定其持续时间，然后我们等待其结果。
- 在我们等待时，调用函数被挂起，即在 await 之后编写的代码不会立即执行

**注意：我们运行的线程并没有被阻塞** ——在我们等待时可以自由地做更多的工作

一旦异步持续时间加载完成，会调度运行该函数的后半部分：
- 如果加载成功，我们将持续时间存储到本地常量中并将其发送给另一个函数
- 如果操作失败，一旦调用函数恢复，就会抛出异常

以上是异步加载属性值的基本行为

我们还可以一次加载多个属性的值，只需将多个属性标识符传递给 load 方法即可完成此操作

比如，我们可以同时加载持续时间和曲目，这不仅方便，而且还可以更高效：
![](https://images.xiaozhuanlan.com/photo/2021/76359d4f7b2bbf94059e99caf18c9e72.png)

如果AVAsset明确你需要的所有属性，则它会自动进行批量处理

>加载多个属性值的结果是一个元组，加载的值与用于属性标识符的顺序相同，就像加载单个属性值一样，而且类型安全

*在上面例子中，结果元组的第一个元素是 CMTime，第二个元素是 AVAssetTracks 数组——当然，就像加载单个值一样，这仍然是个异步操作*


除此之外，您还可以随时使用新的 status(of:) 方法检查属性的状态，而无需等待值加载

*我们传入的是用于加载的相同属性标识符，返回的是一个包含四种可能情况的枚举*
![](https://images.xiaozhuanlan.com/photo/2021/a91a5c384402fbee11e2e1fbfaaef148.png)



- 每个属性在没加载前都是 .notYetLoaded状态——记住，媒体资源检查是按需进行的，因此在我们实际要求加载属性值之前，AVAsset不会做任何加载动作。
- 如果我们在加载过程中检查状态，将会获得 .loading状态
- 如果该属性已加载，将获得 .loaded状态
- 最后，如果发生故障——比如网络出现故障，会得到 .failed状态
  - 失败的case中，会关联一个error，用来描述出了什么问题；注意，这将与加载请求失败时的 load 方法抛出的错误相同

以上就是用于加载异步属性并检查其状态的新 API。


*AVAsset 有很多属性，它们的值都可以异步加载，如下*
![](https://images.xiaozhuanlan.com/photo/2021/4534b96a08936f813e83313decf5e47f.png)



*其中大部分都提供了一个独立的值，但是tracks和metada属性提供了更复杂的对象，可以用来访问媒体资源的层次结构*
![](https://images.xiaozhuanlan.com/photo/2021/d1716a6b3706304e1c560e4f8a301a32.png)


*对于 .tracks 属性，我们会获得一组 AVAssetTrack*

*AVAssetTrack 有自己的属性集合，这些属性值也可以使用相同的加载方法异步加载*
![](https://images.xiaozhuanlan.com/photo/2021/5c03a28a938a5faeb43efd1dab7d3f5c.png)


*同样， .metadata 属性为您提供了一组 AVMetadataItem，AVMetadataItem 的属性也可以使用 load 方法异步加载*


另外值得说的是，在这些新 API中，我们增加了异步方法集合，可以使用它们来获取某些属性值的特定子集：
*例如，可以使用前三种方法之一来只加载部分曲目，而不是加载所有曲目，比如仅加载音轨*

在 AVAsset 和 AVAssetTrack 上都有几个这样的新方法：
![](https://images.xiaozhuanlan.com/photo/2021/0d7aae3721b23cf910322782cfef4f51.png)

![](https://images.xiaozhuanlan.com/photo/2021/ccbb109cbd2f301a387ae6d3b1f5ed2d.png)


以上就是本session所有关于异步检查媒体资源的所有新 API

但我们需要注意：
**这些功能实际上都不是新的——API 是新的，但这些类一直能够异步加载它们的属性值**

但使用旧的 API，我们就将不得不编写这样的代码：
![](https://images.xiaozhuanlan.com/photo/2021/f16a6b861f27aad976a1ab07a46b188a.png)


这是一个三步过程：
1. 首先调用 loadValuesAsynchronously 方法，并提供字符串告诉它要加载哪些属性
2. 需要确保每个属性确实成功加载并且没有失败
3. 完成后通过查询相应的同步属性或调用其中一种同步过滤方法来获取加载的值

**这不仅冗长还容易被误用**

*例如，很容易忘记一些基本的加载和状态检查步骤：*
![](https://images.xiaozhuanlan.com/photo/2021/5ca9524990ba9d0315fba8bb52dcdd3a.png)

而这些是同步的属性和方法，如果我们在没有完成加载属性值的情况下调用它们，就会最终阻塞 I/O

**如果我们在主线程上执行此操作，这意味着我们的应用程序会被挂起一段时间**

>新 API 除了更易于使用，它们会还消除这些常见的误用，而我们也计划在未来版本中逐渐弃用旧的同步 API

为了更方便地迁移到这些新接口，我们准备了一个简短的迁移指南
![](https://images.xiaozhuanlan.com/photo/2021/084ef84992ab7e6e2fcc365c70998353.png)

1. 如果我们的代码符合加载值 -> 检查状态 -> 获取同步属性三步，那么可以简单地调用 load 方法并在异步步骤中完成所有操作
![](https://images.xiaozhuanlan.com/photo/2021/c4640d869ae120309e5eebb7d5ff0d8e.png)

2. 如果我们正在使用旧的 statusOfValue(forKey:) 方法并通过switch分发不同状态，现在可以利用新状态枚举来完成工作
3. 如果我们的应用程序在代码的一部分中加载属性的值，然后在代码的不同部分中获取加载的值，我可以通过以下方法来实现新界面：
  - 再次调用 load 方法——这是最简单和最安全的方法，如果属性已经加载，这不会重复已经完成的工作，而是只返回一个缓存值，但load 方法是一种异步方法，所以只能从异步上下文中调用它
  - 如果确实需要从纯同步上下文中获取属性的值，我们可以获取属性的状态并断言它已加载，以便同步获取属性的值
    - 在执行此操作时必须小心，因为即使在已加载属性之后，也有可能发生阻塞
4. 如果代码跳过了加载和状态检查步骤，而只是依赖属性和方法的当前行为，比如一直阻塞直到结果可用——**我们首先不推荐这样使用，也没有为此提供替代的方式**

我们将新的属性加载 API 设计得与获取简单属性一样易用，所以迁移到新 API 会很简单，这就是第一个主题的全部内容了！

# 视频元数据合成

![](https://images.xiaozhuanlan.com/photo/2021/407665a9fac5b0858978e518ddd72d32.png)

这里我们讨论的是视频合成：
**一个获取多个视频轨道并将它们合成为单个视频帧流的过程**

> 特别地，我们对自定义视频合成器进行了增强，可以在其中插入代码而直接进行合成。

在今年新增的feature中，我们可以在自定义合成器的帧合成回调中获得每帧元数据。

*例如，假设您有一系列 GPS 数据，并且该数据带有时间戳并与您的视频同步，如果我们希望使用该 GPS 数据来影响帧的组合方式，那么第一步是将 GPS 数据写入源电影中的定时元数据轨道。*

可以使用 AVAssetWriter 做到这一点——请查看现有类 AVAssetWriterInputMetadataAdaptor

*让我们从具有特定曲目集合的源电影开始：也许它有一个音频轨道、两个视频轨道和三个定时元数据轨道。*
![](https://images.xiaozhuanlan.com/photo/2021/8b233f5ff876028d620b26d633a760fe.png)

*假设轨道 4 和轨道 5 包含对您的视频合成有用的元数据，但轨道 6 不相关。*

要先完成两个设置项：
1. 使用新的sourceSampleDataTrackIDs 属性告诉视频合成对象视频合成相关的轨道ID；
2. 设置AVMutableVideoCompositionInstruction的requiredSourceSampleDataTrackIDs 属性以告诉它与此相关的轨道 ID

**执行这两个设置步骤很重要，否则我们无法在合成回调中获得任何元数据。**

现在让我们转到回调本身，我们可以使用两个新 API 来获取视频合成的元数据：
![](https://images.xiaozhuanlan.com/photo/2021/41179caeea4de397e0526b8bb705880e.png)

- sourceSampleDataTrackIDs 属性，指明该请求需要播放的元数据轨道 ID
- 对于每个轨道 ID，可以使用 sourceTimedMetadata(byTrackID :) 方法来获取该轨道的当前定时元数据组

> AVTimedMetadataGroup 是元数据的高级表示，其值被解析为字符串、日期或其他高级对象；如果需要使用元数据的原始数据，可以使用 sourceSampleBuffer(byTrackID:) 方法来获取 CMSampleBuffer 而不是 AVTimedMetadataGroup。

一旦掌握了元数据，我们就可以使用元数据和源视频帧来生成输出视频帧并完成请求。

以上就是将元数据放入自定义视频合成器回调中所需的全部内容，让我们可以对视频合成做更多有趣的事情！

>译者注：上面👆用GPS举例并不偶然，Apple近期正好推出了空间音频，我们尝试想象一下用位置信息应该如何实现：
- 音频文件中除了左/右两声道，还包括声源每一帧的相对位置信息，可以作为一条单独的track
- AirPodsPro有内置陀螺仪，并实时通过蓝牙告知播放应用
- 播放应用通过陀螺仪的输入和声源的相对位置计算出声音应有的变化，最终用音频滤镜技术实现声源的移动感

# 字幕创作

今年 macOS 的新功能 AVFoundation 增加了对两种文件格式的支持：
1.  iTunes 定时文本（.itt 文件），包含一般字幕。
2. Scenarist Closed Captions （.scc 文件），包含隐藏式字幕。

AVFoundation 增加了对创作这两种文件格式的支持：既可以从这些类型的文件中提取字幕，也可以预览字幕检查它们在播放期间的展示

关于创作，我们先从 AVCaption 开始——它是代表单个标题的模型对象：
![](https://images.xiaozhuanlan.com/photo/2021/827885fb732ccbe5c16425ac6c35c150.png)

它具有诸如文本、位置、样式和单个标题的其他属性之类的属性。

*我们可以自己创建 AVCaption 并使用 AVAssetWriterInputCaptionAdaptor 将它们写入这两种文件格式之一*

此外，我们在 AVCaptionConversionValidator 类中有一个新的校验能力，它可以帮助确保我们编写的字幕实际上与所选择的文件格式兼容

那为什么这很重要呢？

比如，.scc 文件，它包含 CEA-608 字幕，对在给定时间内可以拥有多少字幕具有非常具体的限制——细致到对表示单个字符及其样式的数据都有具体格式规定

因此，验证器不仅会帮助确保字幕流与文件格式兼容，还会建议我们对字幕进行调整：比如，调整时间戳，从而保持兼容。

可以使用新 API  AVAssetReaderOutputCaptionAdaptor来获取字幕，它允许我们从字幕文件中读取 AVCaption 对象：
![](https://images.xiaozhuanlan.com/photo/2021/4328db3224838b48aa3ff885111c4905.png)

最后，还有一个 AVCaptionRenderer 类，它允许我们获取单个字幕或一组字幕并将它们渲染到 CGContext 预览它们在播放期间的外观。

但以上只是新的字幕文件创作 API 的冰山一角，如果你有兴趣试试它们，我们鼓励您与我们联系——无论是通过论坛还是其他任何方式——我们可以帮助回答您的任何问题。

>译者吐槽：自己开工程实践才是正道，苹果论坛的回复你们也懂的

# 总结

我们今天的主要内容有：
- 检查 AVAsset 属性，按需和异步执行的新 API 以及从旧 API 迁移的一些技巧；
- 使用定时元数据来进一步定制自定义视频作品；
- 字幕文件创作的新 API。

The End！

我是Adam Sonnanstine，很高兴你看到了这里！
![](https://images.xiaozhuanlan.com/photo/2021/41f205916006290dd57cc62440f5439c.png)

