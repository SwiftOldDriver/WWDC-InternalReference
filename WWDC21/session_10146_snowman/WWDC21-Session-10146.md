What’s new in AVFoundation


> 本篇来源为WWDC2021 中 [What’s new in AVFoundation](https://developer.apple.com/videos/play/wwdc2021/10146/) 

本Session会介绍三个主题：音频元信息，视频元数据合成和字幕创作

# 音频元信息
在这一部分，我们会多花一些时间讨论 AVAsset 检查元数据的新能力，然后再快速介绍另外两个功能：视频合成与元数据和字幕文件创作。


我们先说说<u>AVAsset异步查看元信息</u>，在开始之前，先了解一下 AVAsset 的背景知识：
>AVAsset 是 AVFoundation 的核心模型对象，用于表示存储在用户设备上或远程服务器的媒体文件内容，当然也包括流媒体（例如 HTTP Live Streams ）或其他形式的视听内容

<br/><img src="https://images.xiaozhuanlan.com/photo/2021/006873e54a66272bf1e214468f7acca5.png" width=600 />

当拥有媒体资源时，除了播放之外，经常遇到的场景是检查元数据，比如：
- 它的持续时间是多少？
- 它包含的音频和视频的格式是什么？

这就是所谓的媒体资源检查

每当我们试图获取媒体资源元数据时，都需要牢记一件重要的事情：
**媒体资源检查要按需进行，因为媒体文件会非常大**——*一部长篇电影的大小可能动辄几个GB*

所以一般并不会立刻下载整个文件，而会一直等待到需要时才加载属性值，然后才会下载所需要的信息

其次媒体资源检查是一个<u>异步过程</u>——这非常重要，因为网络 I/O 也有开销；如果媒体资源存储在网络中， AVAsset 将在准备好时通过异步回调告知结果

关于上面，我们有一个用于检查媒体资源属性的新 API，如下：
<br/><img src="https://images.xiaozhuanlan.com/photo/2021/d76ce0f29a542df78936f0db214277a3.png" width=600 />

*需要注意的是这是新的 load 方法，它接受一个属性标识符——在本例中为.duration(持续时间)*

每个属性标识符在编译时都与一个结果类型相关联，它决定了 load 方法的返回类型。

*在上面例子中，持续时间是一个 CMTime，所以返回结果也是此类型*

这里新的知识点是 await 关键字： Swift 中的一项新功能，方便调用方标知道 load 方法是异步的

> 有关 async/await 的详细介绍，可以参考Session 10132: [Meet async/await in Swift](https://developer.apple.com/videos/play/wwdc2021/10132/)

 那如何使用新属性加载方法呢？我们通常将 await 关键字视为将调用函数分为两部分：

- 有一部分操作发生在异步操作开始之前：我们创建一个媒体资源并要它加载其持续时间
  - 此时，会执行相关的 I/O 和解析动作以确定其持续时间，然后我们开始等待结果
- 在我们等待时，调用函数被挂起，即在 await 之后编写的代码不会立即执行

**注意：我们运行的线程并没有被阻塞** ——在我们等待时可以自由地做更多的工作

异步加载完成后，会调度该函数的后半部分：
- 如果加载成功，我们将持续时间存储到本地常量中并将其发送给另一个函数
- 如果操作失败，函数调度恢复时，就会抛出异常

以上是异步加载属性值的基本行为

除此之外，还可以一次加载多个属性的值，只需将多个属性标识符传递给 load 方法即可完成此操作：

比如，我们可以同时加载持续时间和曲目，这不仅方便，而且还可以更高效：
<br/><img src="https://images.xiaozhuanlan.com/photo/2021/76359d4f7b2bbf94059e99caf18c9e72.png" width=600 />

当AVAsset明确了需要的所有属性，它会自动进行批量处理

>加载多个属性值的返回结果是元组，返回值相关类型和属性标识符传入的顺序相同，保障类型安全

*在上面例子中，返回元组的第一个元素是 CMTime，第二个元素是 AVAssetTracks 数组——这同样也是异步操作*


除此之外，还可以随时使用新的 status(of:) 方法检查属性的状态，而无需等待值加载

*我们传入的是用于加载的相同属性标识符，返回的是一个包含四种可能情况的枚举*
<br/><img src="https://images.xiaozhuanlan.com/photo/2021/a91a5c384402fbee11e2e1fbfaaef148.png" width=600 />


- 每个属性在没加载前都是 .notYetLoaded状态——媒体资源检查是按需进行的，因此在实际要求加载属性值之前，AVAsset不会做任何加载动作
- 在加载过程中检查状态，将会获得 .loading状态
- 该属性已加载，将获得 .loaded状态
- 最后，如果发生故障，如网络出现故障，会得到 .failed状态
  - 失败的case中，会关联一个error，用来描述出了什么问题；注意，这将与加载请求失败时的 load 方法抛出的错误相同

以上就是用于加载异步属性并检查其状态的新 API。


*AVAsset 有很多属性，它们的值都可以异步加载，如下*

<br/><img src="https://images.xiaozhuanlan.com/photo/2021/4534b96a08936f813e83313decf5e47f.png" width=600 />



*其中比较特殊的是tracks和metada属性，它们提供了更复杂的对象，可用来访问媒体资源的层次结构*

<br/><img src="https://images.xiaozhuanlan.com/photo/2021/d1716a6b3706304e1c560e4f8a301a32.png" width=600 />


*对于 .tracks 属性，我们会获得一组 AVAssetTrack*

*AVAssetTrack 有自己的属性集合，这些属性值也可以使用相同的加载方法异步加载*

<br/><img src="https://images.xiaozhuanlan.com/photo/2021/5c03a28a938a5faeb43efd1dab7d3f5c.png" width=600 />

*同样， .metadata 属性为您提供了一组 AVMetadataItem，AVMetadataItem 的属性也可以使用 load 方法异步加载*


另外在这些新 API中，还增加了异步方法集合，可以使用它们来获取某些属性值的特定子集：
*例如，可以使用上面的方法来只加载部分曲目（而不是加载所有曲目），或仅加载音轨*

在 AVAsset 和 AVAssetTrack 上都有几个这样的新方法：

<br/><img src="https://images.xiaozhuanlan.com/photo/2021/0d7aae3721b23cf910322782cfef4f51.png" width=600 />

<br/><img src="https://images.xiaozhuanlan.com/photo/2021/ccbb109cbd2f301a387ae6d3b1f5ed2d.png" width=600 />

以上就是本session所有关于异步检查媒体资源的所有新 API

注意：
**这些功能本身都不是新的——只有API 是新的，之前相关类一直有异步加载属性值的能力**

而使用旧的 API，我们就将不得不编写这样的代码：

<br/><img src="https://images.xiaozhuanlan.com/photo/2021/f16a6b861f27aad976a1ab07a46b188a.png" width=600 />


一般需三步：
1. 调用 loadValuesAsynchronously 方法，并提供字符串告诉它要加载的属性
2. 确保每个属性确实成功加载并且没有失败
3. 通过查询相应的同步属性或调用其中一种同步方法来获取加载的值

**这很冗长还容易被误用**

*例如，容易忘记一些基本的检查步骤：*
<br/><img src="https://images.xiaozhuanlan.com/photo/2021/5ca9524990ba9d0315fba8bb52dcdd3a.png" width=600 />

而如果我们在没有完成加载的情况下使用这些同步的属性/方法，就会最终阻塞 I/O！

**如果我们在主线程上执行此操作，这意味着我们的应用程序会被挂起一段时间**

>新 API 除了更易用，会还消除上面这些常见的误用，而iOS也可能在未来版本中逐渐废弃旧的同步 API

为了更方便地迁移到这些新接口，这里有一个简短的迁移指南：
<br/><img src="https://images.xiaozhuanlan.com/photo/2021/084ef84992ab7e6e2fcc365c70998353.png" width=600 />


1. 如果我们的代码符合加载值 -> 检查状态 -> 获取同步属性的三步模式，那就可以简单地调用 load 方法并在异步步骤中完成所有操作
<br/><img src="https://images.xiaozhuanlan.com/photo/2021/c4640d869ae120309e5eebb7d5ff0d8e.png" width=600 />

2. 如果我们还在使用旧的 statusOfValue(forKey:) 方法并通过switch分发不同状态，现在推荐使用新的状态枚举来完成工作
3. 如果我们在代码的一部分中加载属性值，然后在代码的其他部分中获取加载的值，则可以通过以下方法来替代：
  - 再次调用 load 方法——这是最简单和最安全的方法，如果属性已经加载，这不会重复已经完成的工作，而是只返回一个缓存值，但load 方法是异步方法，只能从异步上下文中调用它
  - 如果确实需要用同步方式获取属性的值，我们可以获取属性的状态并确认它已加载，之后同步获取属性的值
    - 执行此操作时必须小心，因为即使在已加载属性之后，也有可能发生阻塞（特别是一个属性的某个字段依赖其他属性的时候）
4. 如果代码没有加载和状态检查步骤，只是依赖属性和方法的当前行为，比如一直阻塞直到结果可用——**我们首先不推荐这样使用，因此也没有为此提供替代的方式**

我们将新的属性加载 API 设计得与获取简单属性一样易用——推荐大家迁移到新 API ！

# 视频元数据合成
<br/><img src="https://images.xiaozhuanlan.com/photo/2021/407665a9fac5b0858978e518ddd72d32.png" width=600 />


简而言之，视频合成就是**一个获取多个视频轨道并将它们合成为单个视频帧流的过程**

> 这次苹果对自定义视频合成器进行了增强，可以通过在合适的位置插入代码而直接合成视频

在今年新增的feature中，app可以在自定义合成器的回调中获得每帧元数据。

*例如，假设我们有一系列 GPS 数据，并且该数据带有时间戳并与视频同步，如果希望使用这些 GPS 数据来影响帧的组合方式，第一步需要先把 GPS 数据写入源电影中的定时元数据轨道。*

可以使用 AVAssetWriter 来做（建议了解 [AVAssetWriterInputMetadataAdaptor](https://developer.apple.com/documentation/avfoundation/avassetwriterinputmetadataadaptor)的工作方式作为参考）

*让我们从一部特别的电影资源开始：假设它有一个音频轨道、两个视频轨道和三个定时元数据轨道。*
<br /><img src="https://images.xiaozhuanlan.com/photo/2021/8b233f5ff876028d620b26d633a760fe.png" width=600>

*假设轨道 4 和轨道 5 包含对这次视频合成有用的元数据，但轨道 6 不相关。*

要先完成两个设置项：
1. 使用新的sourceSampleDataTrackIDs 属性告诉视频合成对象合成相关的轨道ID；
2. 设置AVMutableVideoCompositionInstruction的requiredSourceSampleDataTrackIDs 属性以告诉它与此相关的轨道 ID

**执行这两个设置步骤很重要，否则我们无法在合成回调中获得任何元数据。**

现在让我们看看回调本身，我们可以使用两个新 API 来获取视频合成的元数据：
<br /><img src="https://images.xiaozhuanlan.com/photo/2021/41179caeea4de397e0526b8bb705880e.png" width=600>

- sourceSampleDataTrackIDs 属性，指明该请求需要播放的元数据轨道 ID
- 对于每个轨道 ID，可以使用 sourceTimedMetadata(byTrackID :) 方法来获取该轨道的当前定时元数据组

> AVTimedMetadataGroup 是元数据的高级表示，其值被解析为字符串、日期或其他对象；如果需要使用原始数据，可以使用 sourceSampleBuffer(byTrackID:) 方法来获取 CMSampleBuffer 而不是 AVTimedMetadataGroup。

一旦有了了元数据，下一步就可以使用元数据和视频帧来生产<u>最终视频帧</u>并完成请求。

以上就是将元数据放入自定义视频合成器回调中所需的全部步骤了，希望读者自己也能试一试！

>译者注：上面👆用GPS举例并不偶然，Apple近期正好推出了空间音频，我们尝试想象一下用位置信息应该如何实现：
- 音频文件中除了左/右两声道，还包括声源每一帧的相对位置信息，可以作为一条单独的track
- AirPodsPro有内置陀螺仪，并实时通过蓝牙告知播放应用
- 播放应用通过陀螺仪的输入和声源的相对位置计算出声音应有的变化，最终用音频滤镜技术实现声源的移动感

# 字幕创作

今年 macOS 在 AVFoundation 中增加了对两种文件格式的支持：
1.  iTunes 定时文本（.itt 文件），包含普通字幕
2. Scenarist Closed Captions （.scc 文件），包含隐藏式字幕（Closed Captioning）

>关于隐藏式字幕的更多介绍，可以参考 [你所不知道的 CC：隐藏式字幕](https://sspai.com/post/39683)

本次AVFoundation的增强，既可以从这些类型的文件中提取字幕，也可以预览字幕检查它们在播放期间的展示

关于创作，我们先从 AVCaption 开始——它是代表单个标题的模型对象：
<img src="https://images.xiaozhuanlan.com/photo/2021/827885fb732ccbe5c16425ac6c35c150.png" width=600 />

>它具有诸如文本、位置、样式和其他相关字幕的属性

*我们可以自己创建 AVCaption 并使用 [AVAssetWriterInputCaptionAdaptor](https://developer.apple.com/documentation/avfoundation/avassetwriterinputcaptionadaptor?changes=_8) 将字幕写入这两种文件格式之一*

此外，我们在 AVCaptionConversionValidator 类中有一个新的校验能力，它会帮助我们确保编写的字幕实际上与所选择的文件格式兼容——这为什么这很重要呢？

*比如，.scc 文件，它包含 CEA-608 字幕，对在给定时间内可以拥有多少字幕具有非常具体的限制——细致到对表示单个字符及其样式的数据都有格式规定*

验证器不仅会帮助确保字幕流与输出文件格式兼容，还会给出对字幕的调整建议：比如，调整时间戳来保证兼容性

*上面我们说了创作字幕，下面我们再说说读取字幕*

可以使用新 API  [AVAssetReaderOutputCaptionAdaptor](https://developer.apple.com/documentation/avfoundation/avassetreaderoutputcaptionadaptor?language=o_5)来读取字幕，它允许我们从字幕文件中读出 AVCaption 对象：
<br /><img src="https://images.xiaozhuanlan.com/photo/2021/4328db3224838b48aa3ff885111c4905.png" width=600>

除此之外，还有 [AVCaptionRenderer](https://developer.apple.com/documentation/avfoundation/avcaptionrenderer) 类，它允许我们获取单个字幕或一组字幕并将它们渲染到 CGContext 预览它们在播放期间的外观。

但以上只是新的字幕文件创作 API 的冰山一角，大家可以自己试试看！

>译者注：自己开工程实践才是正道，视频里为了突出新能力，只是介绍了一些大致的用法，实际使用中会有更多收获

# 总结

我们今天的主要内容有：
- 检查 AVAsset 属性的新方法——可以使用新 API通过按需和异步的方式执行，也介绍了从旧 API 迁移的一些建议
- 使用资源中的定时元数据——结合自定义视频合成器的新接口来进行视频合成的能力
- 字幕文件创作的新 API——不但能够读取字幕元数据，也能够生成自定义字幕

The End！
