# WWDC21 10045 - 用 ShazamKit 创造自定义音频体验

> 作者：[kukushi](https://kukushi.github.io)，Swift 爱好者，独立编写多款 App 上架 AppStore。就职于字节跳动音乐团队。
>
> 审核：曾铭，iOS 开发，老司机技术周报编辑，就职于字节跳动音乐团队

> 本文基于 [Session 10044 - Explore ShazamKit](https://developer.apple.com/videos/play/wwdc2021/10044) 和 [WWDC 10045 Create custom audio experiences with ShazamKit](https://developer.apple.com/videos/play/wwdc2021/10045/) 整合编写而成。

## ShazamKit 是什么？

2008 年，音乐识别应用 Shazam 作为首批 App 亮相 App Store，凭借其出色的识别能力，上线便大获成功。在六年后发布的 iOS 8 中，Shazam 与 Apple 达成合作，为 Siri 提供了听歌识曲的能力。转眼到 2018 年，Apple 斥资 4 亿美元将 Shazam 收入麾下。而在 WWDC2021 上，苹果推出了 [ShazamKit](https://developer.apple.com/documentation/shazamkit)，将音频识别能力带给 App 开发者。

Shazam 的核心技术是音频识别。通过捕获音频独特的声学特征，并在音频特征目录（Audio Catalog）中搜索匹配的内容，Shazam 实现了嘈杂环境中快速准确的音频识别。ShazamKit 支持在 Shazam 特征目录和自定义特征目录中搜索匹配。

与 SoundAnalysis 不同，Shazam 并不是一个能够检测并识别出不同类别声音的音频分类器，也不能识别出音频中像是笑声和掌声的特定声音。如果你想继续了解音频分类，欢迎查看 [Discover built-in sound classification in SoundAnalysis](https://developer.apple.com/videos/play/wwdc2021/10036/)（[《【WWDC21 10036】使用 SoundAnalysis 内置分类器实现声音分类》](https://xiaozhuanlan.com/topic/5627914803)） Session。

ShazamKit 的功能大体可以分为三个部分：

- Shazam 特征目录识别：识别歌曲并添加到 App 中，这个过程依赖网络
- 歌曲库管理：对识别后的歌曲进行管理
- 自定义特征目录识别：对任意音频进行识别匹配，完全在设备本地进行

让我们先来看看 ShazamKit 是如何从音频中识别出歌曲。

## Shazam 特征目录识别

从按下 Shazam 识别按钮，到识别出歌曲，背后究竟发生了什么？

![Recognize Song](https://images.xiaozhuanlan.com/photo/2021/6f9e2c8d313554b328d039c6924b949d.png)

开始识别后，ShazamKit 会基于待查询的原始音频生成特征信息（Signature）。由于这个特征会被发送到 Shazam 服务器进行查询，因此也被称为查询特征（Query Signature）。使用特征而不是原始数据进行匹配带来了两个好处：其一，特征数据比原始数据小一个数量级，大大减少了网络上传输的数据量。其二，特征数据无法还原出原始音频，更好地保护了用户的隐私。

![Reference Signature Catalog](https://images.xiaozhuanlan.com/photo/2021/f4356cfd7b0dd9076772bb42407b7038.png)

服务器在接收到特征后，会用特征在 Shazam 特征目录中搜寻匹配。特征目录，故名思义，是由多个特征组成的集合。特征通常还包含了对应音频内容的元数据，元数据让特征能引用回原始的音频内容，因此这类特征被称为引用特征（Reference Signature）。

Shazam 特征目录是由苹果维护的一个特殊的特征目录，包含了世界上大部分歌曲的引用特征。这个目录会定期用最新的歌曲进行更新，目录中的每个特征都是用歌曲的完整音频生成的，并且包含了歌曲完整元信息的引用。

![Query Signature](https://images.xiaozhuanlan.com/photo/2021/a0160cf0a591712649ad143b784e630c.png)

进行目录搜索时，服务器会用查询特征与 Shazam 特征目录中的每首歌的引用特征进行对比，寻找匹配的歌曲。在找到歌曲后，将歌曲完整的元数据信息发送回 ShazamKit。

总结一下，整个匹配的过程中 ShazamKit 会基于原始音频生成特征，发送到服务器，服务器会利用这个特征在 Shazam 特征目录中进行搜索匹配，并将结果返回给 ShazamKit。

ShazamKit 很好的将这个复杂的过程封装在了 `Session` 类中。`Session` 接收音频或特征进行查询，并通过代理回调结果。在与 Shazam 目录匹配之前，我们需要在开发者中心为 App Identifier 启用 ShazamKit 服务。如果只使用自定义特征目录，无需开启这个服务。

接下来让我们来看看具体用代码是如何实现匹配的：

```swift
// 用 SHSession 匹配特征

let session = SHSession()
session.delegate = self

let signatureGenerator = SHSignatureGenerator()
try signatureGenerator.append(buffer, at: nil)

// 将音频转换成特征
let signature = signatureGenerator.signature()

// 使用 `match(_:)` 进行匹配
session.match(signature)
```

> 对于流式的音频，如来自麦克风的声音，建议使用 `matchStreamingBuffer(_:at:)` 匹配。下文的自定义特征目录章节中将详细介绍如何使用这个方法。

在 Shazam 特征目录匹配到结果后，我们可以从媒体项目（Media Item）中取得歌曲的信息，如歌名、艺人名、专辑封面等。

```swift
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

除了常见的歌曲信息外，`mediaItem` 中还包含了 `appleMusicURL` ，可以直接链接到 Apple Music。需要注意的是，如果要在 App 中显示 Apple Music 图标，需要按照 [Apple Music Identity Guidelines](https://www.apple.com/itunes/marketing-on-music/identity-guidelines.html#listen-on-apple-music-badge) 中的规定使用图标。

至此，我们得到了 Shazam 特征目录识别的完整流程：

![Shazam Catalog Recognization](https://images.xiaozhuanlan.com/photo/2021/2b5fb676748d4aa4dffb982830dcfe7c.png)

## 歌曲库管理

在成功识别歌曲后，用户可能会想把歌曲添加到 Shazam 歌曲库中。Shazam 库可以在 Shazam App 或控制中心中查看，支持多设备同步。

通过 `SHMediaLibrary` 可以管理内容也十分简单：

```swift
// 将匹配的歌曲添加到用户的库中
guard let matchedMediaItem = match.mediaItems.first else {
    return
}

// SHMediaLibrary.default 是用户默认的 Shazam 歌曲库
SHMediaLibrary.default.add([matchedMediaItem]) { error in
    if error != nil {
        // handle the error
    }
        
}
```

用户默认的 Shazam 歌曲库十分特殊，只有在 Shazam 特征目录中识别到的歌曲可以被添加进去。出于隐私的考虑，库中的内容是端到端加密存储的，且只有开启了两步认证的设备可以访问。将内容添加到 Shazam 库中并不需要特别的权限，但苹果还是强烈建议开发者不要在用户不知情的时候存储内容。

匹配结果中的  `MediaItem` 上还暴露了许多其他属性，比如 `matchOffset`，它显示了在歌曲中进行匹配的位置。此外，新版本 MusicKit 框架提供了描述歌曲以及关系的对象。关于更多细节，你可以查看 [Meet MusicKit for Swift](https://developer.apple.com/videos/play/wwdc2021/10294/)（[《【WWDC21 10291/10294/10295】MusicKit 概述》](https://xiaozhuanlan.com/topic/6102839475)）。

在继续探索 ShazamKit 之前，我们先总结下 Shazam 特征目录识别的最佳实践：

1. 对流式音频进行匹配时，建议使用 `matchStreamingBuffer(_:at:)`。
2. 使用麦克风进行匹配时，一旦得到结果，立即停止录音。这样不仅可以减少资源使用，也不会让用户因为 App 使用麦克风太久使用感到困惑。
3. 写入用户的 Shazam 歌曲库之前，强烈建议先告知用户会发生什么并提供选项让用户选择。

## 自定义特征目录识别

Shazam 特征目录识别极大地简化了音乐识别的流程，但 ShazamKit 的能力并不局限于此。自定义特征目录识别让我们能够为应用程序创造出独特的音频体验。

![Question 1](https://images.xiaozhuanlan.com/photo/2021/5a10a96d5e5c103a8076cb48d2c807d8.png)

近两年，线上教育越来越流行，但上课中的小朋友的投入度往往没有线下的高。如果我们可以有一个 App，可以随着教育视频的播放实时且不断的显示出对应的问题，让小朋友们通过 App 交互回答提问，应该能极大提高小朋友的投入度。

文章接下来的部分将一步步实现一个基于定义特征目录识别的教学 App，展示如何使用麦克风录制音频并进行匹配、如何用自定义音频建立特征目录、如何让 App 与音频进行同步，强烈建议下载[例子工程](https://developer.apple.com/documentation/shazamkit/building_a_custom_catalog_and_matching_audio)跟着文章一起实现。

### 创建自定义特征目录

首先，我们需要基于教育视频的音频创建出特征目录，用于后续的匹配。自定义特征目录泛指由开发者创建的特征的集合。使用 `SHSignatureGenerator` 可以从音频数据中生成特征：

```swift
let signatureGenerator = SHSignatureGenerator()
 
// 添加 Audio Buffer 到特征中
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

上面的代码中，我们通过 `AVAudioEngine` 的输入节点 `inputNode` 通过安装一个 Tap 捕获 `audioBuffer` 和对应的时间戳。`audioFormat` 需要设置为支持的采样率和 `PCM` 格式。接着我们生成了特征，并添加到了特征目录中。

除了上面的方式外，也可以使用 `shazamsignature` 文件添加特征。 `shazamsignature` 文件是从特征导出的数据文件，在可以直接内置在 App 中，或通过网络下载使用。为了方便介绍，例子工程会使用预先生成好的 `shazamsignature` 进行说明。

> 如果你想了解如何导出 `shazamsignature`  文件，可以看看[这个链接](https://developer.apple.com/forums/thread/682149)。

接下来，我们要利用生成好的特征构建出自定义特征目录。在 `CatalogProvider.swift` 中:

```swift
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
        
	    // 3
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

2. 使用一个 `MediaItem` 作为这个特征的元数据信息，`MediaItem` 包含了这个小节的信息。除了 `title` 和 `subtitle` 这两个原生的 Key 外，我们还需要两个自定的 Key： `episode` 和 `teacher` 。
	
	> 这两个 Key 定义在 `FoodMathMediaItemProperties.swift` 中。
	
3. 创建了一个自定义特征目录并将引用特征添加到目录中。

自定义特征目录准备好之后，就到了非常激动人心的匹配环节，我们会使用麦克风实时录制音频并进行匹配。 为了实时获取到麦克风中的音频，需要用到 `AVAudioEngine`。在 Xcode 中添加好麦克风相关的权限配置后，可以开始编写实际的录制代码了。

打开 `Matcher.swift`：

```swift
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

实时录制识别的代码和**自定义特征目录识别**中的非常相似。

1. Apple 建议在 `matchStreamingBuffer` 中提供 `audioTime`， 这样 `Session` 可以校验并确保音频是连续的。
2. 匹配到的 `mediaItem` 包含了我们在上面自定义的信息，如 `episode` 和 `teacher`。 `MatchResult` 是我们自定义的匹配结果，包含了 `Question`。这里我们暂时将 `question` 设置为了 `nil`。

写到这里，Episode 3 的识别部分已经完成！在 iPad 上编译运行示例工程，并在任意设备上开始播放 [Learn with Neil LQ](https://developer.apple.com/sample-code/audio/shazamkit-mov.zip)，播放几秒后，**Count on Me** 立马就在 iPad 的屏幕上跳出，识别成功，Amazing！

### 让 App 与视频内容同步

上面已经实现了小节的匹配，接下来需要为小节添加对应问题。打开例子工程中 `Part 1 - Matching Audio` 中的 `Question.swift`：

```swift
// Question.swift

struct Question: Comparable, Equatable {
    let title: String                       // 1
    let offset: TimeInterval                // 2
    let equation: Equation?                 // 3
  
    // ...
}
```

1. `title` 描述了问题出现的小节的标题。

2. `offset` 则表示了这一小节出现的时间偏移点。

   > 举个 🌰️，假设在  45 秒时，老师开始谈论一个数学方程式，那我们就可以这小节作为 `title` 和 45 秒作为 `offset` 创建一个问题。

3. `Equation` 代表了问题中的数学方程式。我们会用多个等式构建出一个完整的等式。例如，我们可以使用不同的偏移量显示一个方程的左边和右边。

在 `FoodMatchQuestions.swift` 里可以看到所有已经定义好的问题：

```swift
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

在上面的代码中对应了图 `Question 1` 的场景：第一个问题在 14 秒开始。在 21 秒时会出现一个红苹果在左侧，在 25 秒时会出现三个绿苹果在右侧。最后，在 31 秒的位置，学生们将要计算出这个等式。

利用 `Question` 对象 ，我们可以找出在特定位置的音频中应该显示哪些内容。`mediaItem` 的 `predictedCurrentMatchOffset` 代表了引用特征在音频中的位置，我们可以用它来算出现在音频的位置，并找出合适的 `Question`。

打开例子工程中的 `Part 2 - Content Synchronization` 目录，找到 `Matcher.swift`

```swift
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

1. `session(_ session: SHSession, didFind match: SHMatch) `  在每次发现新的匹配内容都会调用，这也是视频与 App 能够同步的基础。
2. 找出下一个问题，即 `offset` 大于 `predictedCurrentMatchOffset` 且 `offset` 最小的 `Question` 显示到界面上。

再次编译构建应用，播放上面视频，这次，App 中的内容可以和视频同步了！

总结一下自定义特征目录识别的最佳实践：

- 与 `shazamsignature` 文件类似，特征目录也可以[导出](https://developer.apple.com/documentation/shazamkit/shcustomcatalog/3747143-write?changes=_2.)成 `shazamcatalog` 文件，在不同设备中使用。
- 目录可以存储自定义 Key，方便处理自定义的元数据。

## 结语

以上就是 WWDC21 中关于 ShazamKit 的全部内容。ShazamKit 不仅提供了非常便利的接口实现听歌识曲，还提供了自定义识别音频的功能，开拓了全新的可能性。相信未来会有许多基于 ShazamKit 的功能，为用户带来崭新的体验。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
