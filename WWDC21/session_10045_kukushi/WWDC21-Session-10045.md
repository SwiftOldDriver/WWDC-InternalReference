# WWDC21 10045 - 用 ShazamKit 创建自定义音频体验

> 本文基于 [Session 10044 - Explore ShazamKit](https://developer.apple.com/videos/play/wwdc2021/10044) 和 [WWDC 10045 Create custom audio experiences with ShazamKit](https://developer.apple.com/videos/play/wwdc2021/10045/) 整合编写而成。

## ShazamKit 是什么？

2008 年，音乐识别应用 Shazam 作为首批 App 亮相 App Store，凭借其出色的识别能力，上线便大获成功。在六年后发布的 iOS 8 中，Shazam 与 Apple 达成合作，为 Siri 提供了听歌识曲的能力。转眼到 2018 年，Apple 斥资 4 亿美元将 Shazam 收入麾下。而在 WWDC2021 上，苹果推出了 [ShazamKit](https://developer.apple.com/documentation/shazamkit)，将音频识别能力带给 App 开发者。

Shazam 的核心技术是音频识别，即便是在有噪音的环境中，也能及时准确地匹配出对应的音频。Shazam 的音频识别是通过捕获音频的独特声学特征，并在**音频目录（Audio Catalog）**中搜索匹配的内容实现的。这个音频目录可以是 Shazam 自带的目录，或是由开发者创建的自定义目录。

与 SoundAnalysis 不同的是，Shazam 并不是一个能够检测并识别出不同类别声音的音频分类器。事实上，Shazam 不能识别出音频中像是笑声和掌声的特定声音。如果你想继续了解音频分类，欢迎查看 [Discover built-in sound classification in SoundAnalysis](https://developer.apple.com/videos/play/wwdc2021/10036/) Session。

ShazamKit 的功能可以分为三个部分：

- Shazam 目录识别：识别歌曲并添加到 App 中，这个过程依赖网络。
- 自定义目录识别：对任意音频进行匹配，识别完全在设备本地进行。
- 库管理：对识别后的歌曲进行管理

让我们先来看看 Shazam 是从音频中识别出歌曲。

## Shazam 目录识别原理

你是否好奇过，用 Shazam 按下识别按钮的究竟发生了什么？

![](https://cdn.nlark.com/yuque/0/2021/png/21898725/1624288663244-541f7fe1-1e37-4195-81fc-44cee15bb6c0.png)

在触发识别后，ShazamKit 向 Shazam 的服务器发送了表示这段音频的数据，服务器用这份数据在 Shazam 目录中找到了一个匹配，并将歌曲信息返回给 ShazamKit。值得说明的是，ShazamKit 是基于原始音频数据创建了一份有损代表数据，这份数据被称之为**签名（Signature）**。这带来了两个好处。首先，签名比原始的音频至少要小一个数量级，大大减少了网络上要传输的数据量。其次，签名是不可逆的，原始的音频无法从签名中重构出来。

![Reference Catalog](https://cdn.nlark.com/yuque/0/2021/png/21898725/1624288640112-c6132deb-1497-442c-ae6e-9d3cd82cae33.png)

目录是由签名组成的集合。如果只有签名的话并没有什么用，因此签名通常还包含了对应内容的元数据，元数据让签名可以引用回原始的音频内容，包含了这些信息的签名被称之为引用签名（Reference Signature），因为这些元数据引用回了原始的音频。

苹果托管与维护的 Shazam 目录包含了世界上大部分歌曲的引用签名。这个目录会定期使用最新的歌曲进行更新。目录中的每个签名都是由一首歌曲的完整音频生成，并且包含了一个歌曲完整元信息的引用。

![Query Signature](https://cdn.nlark.com/yuque/0/2021/png/21898725/1624288699643-11d62d74-1c3a-4338-b793-d98b2a583782.png)

在搜索目录时，我们要用到查询签名（Query Signature），它代表了一小部分想要查询的音频。在上图中，查询签名在被代表了整首歌曲的引用签名做对比，并且找到了一个匹配。Shazam 目录中的每首歌曲都会通过这个过程识别都候选歌曲。

ShazamKit 很好的将这个复杂的过程封装在了 `Session` 中。`Session` 接收音频或签名作为输入，通过代理来回调结果。在与 Shazam 目录匹配之前，我们需要在开发者中心中为 App Identifier 启用 ShazamKit 服务。如果只是匹配自定义目录的话，这一步是不需要的。

接下来让我们来看看用代码是如何实现匹配：

```language-swift
// 用 SHSession 匹配签名

let session = SHSession()
session.delegate = self

let signatureGenerator = SHSignatureGenerator()
try signatureGenerator.append(buffer, at: nil)

// 将音频转换成 Signature
let signature = signatureGenerator.signature()

// 如果是流式的音频，如来自麦克风的音频，建议使用 `matchStreamingBuffer(_:at:)` 匹配
// 对于现成的完整音频，直接使用 `match(_:)` 进行匹配
session.match(signature)
```

在 Shazam 目录得到了匹配结果后，我们可以从媒体项目（Media Item）中取得歌曲的信息。歌曲的信息包括如歌名和艺人名，以及其他属性，如专辑封面。

```language-swift
// 通过 Session 代理回调得到匹配结果
extension SongResultViewController: SHSessionDelegate {
    public func session(_ session: SHSession, didFind match: SHMatch) {
        // 匹配结果可能有多个，这里我们选用第一个
        guard let matchedMediaItem = match.mediaItems.first else {
            return
        }
        
        DispatchQueue.main.async {
            self.songView.titleLabel.text = matchedMediaItem.title
            self.songView.artistLabel.text = matchedMediaItem.artist
        }
       
    }
}
```

至此，我们得到了 Shazam 目录识别的完整流程：

![Shazam Catalog Recognization](https://cdn.nlark.com/yuque/0/2021/png/21898725/1624283648987-d67eeeba-4498-495d-af5a-469c8a619ffb.png)



除了常见的歌曲信息外，`mediaItem` 中还包含了 `appleMusicURL` ，可以直接链接到 Apple Music。需要注意的是，如果要在 App 中显示 Apple Music 图标，需要按照 [Apple Music Identity Guidelines](https://www.apple.com/itunes/marketing-on-music/identity-guidelines.html#listen-on-apple-music-badge) 中的规定使用图标。

## 库管理

用户在成功识别歌曲后可能希望将歌曲添加到 Shazam 库中。如果安装了 Shazam，可以在 Shazam 中访问 Shazam 库。在 iOS 15，长按控制中心里的 Shazam 图标也可以查看 Shazam 库。Shazam 库支持多设备同步。

通过 `SHMediaLibrary` 可以管理内容也简单　：

```language-swift
// 将匹配的歌曲添加到用户的库中
guard let matchedMediaItem = match.mediaItems.first else {
    return
}

// SHMediaLibrary.default 是用户默认的 Shazam 库
SHMediaLibrary.default.add([matchedMediaItem]) { error in
    if error != nil {
        // handle the error
    }
        
}
```

用户默认的 Shazam 库是端到端加密存储的，并且只在开启了双因素认证的设备上可以访问。只有 Shazam 目录中的歌曲才能添加到这个库中。将内容添加到 Shazam 库中并不需要特别的权限，但苹果强烈建议你在不要在客户不知情的情况下存储内容。mark: 所有保存在库中的歌曲都将归属于添加它们的应用程序。

 `MediaItem` 上还暴露了许多其他属性，比如 `matchOffset`，它显示了在歌曲中进行匹配的位置。此外，新版本 MusicKit 框架提供了描述歌曲以及关系的对象。关于更多细节，你可以查看 [Meet MusicKit for Swift](https://developer.apple.com/videos/play/wwdc2021/10294/)。

在继续探索 ShazamKit 之前，我们先总结下 Shazam 目录识别的最佳实践：

1. 对流式音频进行匹配时，建议使用 `matchStreamingBuffer`。
2. 在使用麦克风的场景中，一旦得到匹配完成，就应该停止录音。这样可以减少资源使用且用户也不会因为太长的麦克风使用感到困惑。
3. 写入用户的 Shazam 库之前，强烈建议先告知用户会发生什么并提供选择加入的选项。

## 自定义目录识别

Shazam 目录识别极大简化了音乐识别的流程，ShazamKit 的能力并不局限于此。自定义目录识别则可以为我们的应用程序创建独特的音频体验。

本文的剩余部分将会一步步实现一个基于定义目录识别的教学 App，展示如何使用麦克风录制音频时进行匹配、如何用自定义音频建立音频目录、如何让 App 与音频进行同步，强烈建议下载[例子工程](https://developer.apple.com/documentation/shazamkit/building_a_custom_catalog_and_matching_audio)跟着文章一起实现。

近两年，线上学习越来越流行，我们需要想办法让小朋友更好的投入到学习中。如果我们能在播放一段视频的同时，用一个配套的 App，在正确的时间显示对应的问题，那应该会很酷！接下来，我们将用[例子工程](https://developer.apple.com/documentation/shazamkit/building_a_custom_catalog_and_matching_audio)展示如何构建出一个协同 App，在播放一段教育视频的同时，利用自定义目录识别进行同步并作出反应。

### 创建自定义目录

自定义目录包含了开发者从任意音频创建的签名。这些签名也可以附带元数据信息。使用 ` SHSignatureGenerator` 可以往目录中添加签名：

```language-swift
let signatureGenerator = SHSignatureGenerator()
 
// 添加 Audio Buffer 到签名中
audioEngine.inputNode.installTap(onBus: 0, bufferSize: 1024, format: audioFormat) { buffer, audioTime in
     do {
         try signatureGenerator.append(buffer, at: audioTime)
     } catch {
         // 处理错误
     }
 }
 
let signature = signatureGenerator.signature()
try customCatalog.addReferenceSignature(signature, representing: [mediaItem])
```

上面的代码中，我们通过 `AVAudioEngine` 的输入节点 `inputNode` 通过安装一个 Tap 捕获 `audioBuffer` 和对应的时间戳。`audioFormat` 需要是 `PCM` 格式并且是被支持的采样率。接着我们生成了签名，并添加到了自定义目录中。

除了上面的方式外，也可以通过 `shazamsignature` 文件添加签名。`shazamsignature` 文件是一个不透明的文件，可以跨设备共享。

打开例子工程中 `Part 1 - Matching Audio` 中的 `Question.swift`：

```language-swift
// Question.swift

struct Question: Comparable, Equatable {
    let title: String                       // 1
    let offset: TimeInterval                // 2
    let equation: Equation?                 // 3
    let answerRange: ClosedRange<Int>       // 4
    let requiresAnswer: Bool                // 4
  
    // ...
}
```

`Question` 代表了 App 中的一类自定义内容：

1. `title` 描述中视频中的一小节。

2. `offset` 则表示了这一小节出现的时间偏移点。

   > 举个 🌰️，假设在  45 秒时，老师开始谈论一个数学方程式，那我们就可以这小节作为 `title` 和 45 秒作为 `offset` 创建一个问题。

3. `Equation` 代表了视频中出现的数学方程式。我们会用多个等式构建出一个完整的等式。例如，我们可以不同的偏移量显示一个方程的左边和右边。

 4. `answerRange` 和 `requireAnswer` 用于显示交互界面，方面孩子们练习回答问题。

在 `FoodMatchQuestions.swift` 里可以看到已经定义好的问题：

```language-swift
extension Question {
    
    static let allQuestions = [
        Question(title: "Question 1", offset: 14),
        Question(title: "Question 1 (#1)", offset: 21, equation: Equation(lhs: .red(1))),
        Question(title: "Question 1 (#2)", offset: 25, equation: Equation(lhs: .red(1), rhs: .green(3))),
        Question(title: "Answer 1",
                       offset: 31,
                       equation: Equation(lhs: .red(1), rhs: .green(3), operation: .addition),
                       answerRange: 1...5,
                       requiresAnswer: true),
      // ...
}
```

在上面的代码中：第一个问题在 14 秒开始。在 21 秒时会出现一个红苹果在左侧，在 25 秒时会出现三个绿苹果在右侧。最后，在 31 秒的位置，学生们将要计算出这个等式。

接下来，我们要构建出对应的自定义目录。在 `CatalogProvider.swift` 中:

```language-swift
// CatalogProvider.swift

struct CatalogProvider {
    static func catalog() throws -> SHCustomCatalog? {
        guard let signaturePath = Bundle.main.url(forResource: "FoodMath", withExtension: "shazamsignature") else {
            return nil
        }
        
	      // 1
        let signatureData = try Data(contentsOf: signaturePath)
        let signature = try SHSignature(dataRepresentation: signatureData)
      	
        // 2      
      	let mediaItem = SHMediaItem(properties: [.title: "Learn with Neil", .subtitle: "Count on Me", .episode: 3, .teacher: "Neil Foley"])                               
        
	      //   3
        let customCatalog = SHCustomCatalog() 
        try customCatalog.addReferenceSignature(signature, representing: [mediaItem])
        
        return customCatalog
    }
}

// FoodMathMediaItemProperties.swift

extension SHMediaItemProperty {
	 static let teacher = SHMediaItemProperty("teacher")
 	 static let episode = SHMediaItemProperty("episode")
}
```

1. 加载了预先准备的 `shazamsignature` 文件。

2. 使用一个 `MediaItem` 作为这个签名的元数据信息，`MediaItem` 中的属性描述了这个视频。除了 `title` 和 `subtitle` 这两个预置的 Key 外，我们还需要两个自定的 Key： `episode` 和 `teacher` 。
	
	> 这两个 Key 定义在 `FoodMathMediaItemProperties.swift` 中。
	
3. 创建了一个自定义目录并将引用签名添加到目录中。

自定义目录准备好之后，就到了非常激动人心的匹配环节，我们会使用麦克风实时录制音频并进行匹配。 为了实时获取到麦克风中的音频，需要用到 `AVAudioEngine`。在 Xcode 中添加好麦克风相关的权限配置后，可以开始编写实际的录制代码了。

打开 `Matcher.swift`：

```language-swift
// Matcher.swift

class Matcher: NSObject, ObservableObject, SHSessionDelegate {
    @Published var result = MatchResult(mediaItem: nil, question: nil)
    
    private var session: SHSession?
    private let audioEngine = AVAudioEngine()
    
    func match(catalog: SHCustomCatalog) throws {
        
        session = SHSession(catalog: catalog)
        session?.delegate = self
        
        let audioFormat = AVAudioFormat(standardFormatWithSampleRate: audioEngine.inputNode.outputFormat(forBus: 0).sampleRate,
                                        channels: 1)
	      // 1
        audioEngine.inputNode.installTap(onBus: 0, bufferSize: 2048, format: audioFormat) { [weak session] buffer, audioTime in
            session?.matchStreamingBuffer(buffer, at: audioTime)       
        }
        
        try AVAudioSession.sharedInstance().setCategory(.record)
        AVAudioSession.sharedInstance().requestRecordPermission { [weak self] success in
            guard success, let self = self else { return }
            try? self.audioEngine.start()
        }
    }
    
    func session(_ session: SHSession, didFind match: SHMatch) {
        DispatchQueue.main.async {
          	// 2
            self.result = MatchResult(mediaItem: match.mediaItems.first, question: nil)
        }
    }
}
```

实时录制识别的代码和**自定义目录识别**中的非常相似。

1. Apple 建议在 `matchStreamingBuffer` 中提供 `audioTime`， 这样 `Session` 可以校验并确保音频是连续的。
2. 匹配到的 `mediaItem` 包含了我们在上面自定义的信息，如 `episoide` 和 `teacher`。 `MatchResult` 是我们自定义的 Model，包含了 Question。这里我们暂时将 `question` 设置为了 `nil`。

写到这里，Episode 3  的识别部分已经完成！在 iPad 上编译运行示例工程，并在任意设备上开始播放 [Learn with Neil LQ](https://developer.apple.com/sample-code/audio/shazamkit-mov.zip)，播放几秒后，**Count on Me** 立马就在屏幕上跳出，识别成功，Amzaing！

### 让 App 与视频内容同步

接下来，利用 `Question` 对象 ，我们可以找出在特定位置的音频中应该显示哪些内容。`mediaItem` 的 `predictedCurrentMatchOffset` 代表了引导签名在音频中的位置，我们可以用它来算出现在音频的位置，并找出合适的 `Question`。

打开例子工程中的 `Part 2 - Content Synchronization` 目录，找到 `Matcher.swift`

```language-swift
// Matcher.swift

// 1
func session(_ session: SHSession, didFind match: SHMatch) {
     DispatchQueue.main.async {
       	 // 2
         let newQuestion = Question.allQuestions.last { question in
             (match.mediaItems.first?.predictedCurrentMatchOffset ?? 0) > question.offset
         }
         
         if let currentQuestion = self.result.question, currentQuestion == newQuestion {
             return
         }
         
         self.result = MatchResult(mediaItem: match.mediaItems.first, question: newQuestion)
     }
 }
```

1. `session(_ session: SHSession, didFind match: SHMatch) `  在每次发现新的匹配内容都会执行，这是内容同步的基础。
2. 找出下一个问题，即 `offset` 大于 `predictedCurrentMatchOffset` 且 `offset` 最小  `Question` 显示到界面上。

再次编译构建应用，再次播放上面视频，这次，App 中的内容可以和视频同步了！

总结一下自定义目录识别的最佳实践：

- 利用 `shazamcatalog` 文件，自定义目录可以在设备之间无缝共享。这些文件不仅可以是内置在 App 中的，也可以是从网络上下载的。
- 目录可以存储自定义 Key，可以方便的处理自定义数据。

## 结语

以上就是 WWDC21 中关于 ShazamKit 的全部内容。ShazamKit 不仅提供了非常便利的方式听歌识曲，还提供了自定义识别音频的功能，开拓了全新的可能性。相信未来会有许多基于 ShazamKit 的功能，为用户带来崭新的体验。

