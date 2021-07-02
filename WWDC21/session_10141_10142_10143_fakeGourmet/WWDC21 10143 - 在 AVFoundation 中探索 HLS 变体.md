# WWDC21 10143 - 在 AVFoundation 中探索 HLS 变体

![img](https://images.xiaozhuanlan.com/photo/2021/c6e24f2d0ee2c824724483db60f5aef0.png)

# Overview

了解如何使用 AVFoundation API 来突出 App 中内容的不同变体。 我们将向您展示如何使用这些 API 来检查 HLS 内容的不同视频特性，包括 SDR/HDR、FPS 等属性。 我们将探索代表流媒体和离线内容的 AVAssetVariant。

# 本篇

[HTTP Live Streaming (HLS) ](https://developer.apple.com/documentation/http_live_streaming)是苹果公司在 2009 年推出的基于 HTTP 的流媒体协议。相较于实时传输协议 RTP，HLS 可以穿过任何允许 HTTP 数据通过的防火墙或者代理服务器，它也很容易使用 CDN 来传输媒体流，因而得到了广泛的应用。

本 session 介绍的是如何使用 AVFoundation API 检查 HLS 变体的属性以及如何下载你所偏好的 HLS 变体，由苹果 AVFoundation 团队的工程师 Nishant Nelogal 讲解。

> 注意，在阅读本文前我们假设你已经对 HLS 技术有所了解。如果你还不是很了解，建议先阅读[iOS 边学边记 HLS协议 m3u8 ts详解](https://blog.csdn.net/u014219492/article/details/110184490)

如果你想了解其他有趣的 HLS 新特性，请参考：

- [WWDC21 10141 - 使用 HLS 内容调度提升全球范围流媒体的可用性](./WWDC21 10141 - 使用 HLS 内容调度提升全球范围流媒体的可用性.md) 
- [WWDC21 10142 - 使用 HLS 让媒体无缝切换](./WWDC21 10142 - 使用 HLS 让媒体无缝切换.md) 

## 查看 HLS 变体属性

首先，我们来看看如何查看 HLS 变体的属性。比如有这样一个主播放列表。

```
#EXTM3U
#EXT-X-VERSION:
#EXT-X-INDEPENDENT-SEGMENT

#EXT-X-MEDIA:TYPE=AUDIO,NAME="English",GROUP-ID="stereo",LANGUAGE="en",DEFAULT=YES,
AUTOSELECT=YES,CHANNELS="2",URI="eng_stereo.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,NAME="French",GROUP-ID="stereo",LANGUAGE="en",DEFAULT=YES,
AUTOSELECT=YES,CHANNELS="2",URI="fr_stereo.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,NAME="Spanish",GROUP-ID="stereo",LANGUAGE="en",DEFAULT=YES,
AUTOSELECT=YES,CHANNELS="2",URI="fr_spanish.m3u8"

#EXT-X-MEDIA:TYPE=AUDIO,NAME="English",GROUP-ID="atmos",LANGUAGE="en",DEFAULT=YES,
AUTOSELECT=YES,CHANNELS="16/JOC",URI="eng_atmos.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,NAME-"French",GROUP-ID="atmos",LANGUAGE="fr",DEFAULT=YES,
AUTOSELECT=YES,CHANNELS="16/JOC",URI="fr_atmos.m3u8"

#EXT-X-STREAM-INF:BANDWIDTH=14516883,VIDEO-RANGE=SDR,CODECS="avc1.64001f,mp4a.40.5",
AUDIO="stereo",FRAME-RATE=23.976,RESOLUTION=1920x1080
sdr_variant.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=34516883,VIDEO-RANGE=PQ,CODECS="dvh1.05.06,ec-3",
AUDIO="atmos",FRAME-RATE=23.976,RESOLUTION=3840x1920
dovi_variant.m3u8
```

在这个例子中，我们有两个变体。其中一个是带有立体声音频的 SDR 变体，另一个是带有杜比全景声音频的杜比视界变体。

通过观察，我们可以知道这个播放列表具有 4K、杜比视界和杜比全景声属性。在一个 App 中，可能会以这样的形式展示这些属性。

![img](https://images.xiaozhuanlan.com/photo/2021/a04a987dbd20ab250f6960eea0a06971.png)

## AVAssetVariant 介绍

那么，如何让代码知道这些属性呢？在 iOS 15 之后，AVFoundation 提供了自动推断这些信息的能力，这个法宝便是 [AVAssetVariant](https://developer.apple.com/documentation/avfoundation/avassetvariant) 。

AVAssetVariant 是 AVURLAsset 的一个属性，它以数组的形式存在。当 AVURLAsset 解析完 m3u8 文件后，就可以通过访问 variants 属性查看 HLS 媒体的属性了。

![img](https://images.xiaozhuanlan.com/photo/2021/04b841905bbec543409f8a109d03d019.png)

AVAssetVariant 的结构大致如下图。第一级属性能直接获取码率信息。剩下的视频信息和音频信息分别用 VideoAttributes 和 AudioAttributes 两个子属性表示。

其中，VideoAttributes 包含编解码器、帧率、分辨率和动态范围成像([AVVideoRange](https://developer.apple.com/documentation/avfoundation/avvideorange))信息。

AudioAttributes 包含音频格式(formatID)以及更深一层的音频渲染属性(RenditionSpecificAttributes)所包含的的音频渲染频道数(channel count)信息。

![img](https://images.xiaozhuanlan.com/photo/2021/1f11fb4e4af3678f1c927afac3c0bdda.png)

## AVAssetVariant 在 HLS 下载中的应用

有时候我们希望能离线观看 HLS 视频，这时候就需要提前把 HLS 视频流下载下来存储。

> 如果你对 HLS 下载还不了解，可以观看 [WWDC20-10655](https://developer.apple.com/videos/play/wwdc2020/10655/) 了解详尽信息。

好了，现在我们假设你已经对 HLS 下载有所了解。在 iOS 15 中，HLS 下载功能更加丰富灵活。

### 下载指定的 HLS 视频

我们一般下载视频都是下载最高清的，但用户有时希望能自由选择下载不同分辨率的视频。

在 iOS 15 前，我们往 AVAssetDownloadTask 中传入 options 参数来控制下载的选项。options 存在有限的几个选项，用来区分 HDR、无损音乐、分辨率、码率等等。

如果要下载一个码率大于 10 Mbps 的 HDR 视频，你的代码可能是这样的。

```swift
// 后台 session 配置
let configuration = URLSessionConfiguration.background(withIdentifier: "my-background-session")

// 初始化 AVAssetDownloadURLSession
let downloadSession = AVAssetDownloadURLSession(
    configuration: configuration, 
    assetDownloadDelegate: self, 
    delegateQueue: OperationQueue.main
)

// 创建 AVURLAsset
let url = URL(string: "https://devimages-cdn.apple.com/samplecode/avfoundationMedia/AVFoundationQueuePlayer_HLS2/master.m3u8")!
let asset = AVURLAsset(url: url)

// 创建 downloadTask
let downloadTask = downloadSession.makeAssetDownloadTask(
    asset: asset, 
    assetTitle: "master",
    assetArtworkData: nil, 
    options: [
        // 声明需要下载码率大于 10Mbps 的视频
        AVAssetDownloadTaskMinimumRequiredMediaBitrateKey: 10000000,
        // 声明需要下载 HDR 视频
        AVAssetDownloadTaskPrefersHDRKey: true
    ]
)

// 开始下载
downloadTask?.resume()
```

显然，这样的配置不够直观也不够灵活。接下来让我们看看 iOS 15 做了哪些优化。

### AVAssetVariantQualifier

在 iOS 15 之后，苹果引入了 AVAssetVariantQualifier  来代替 AVAssetDownloadTask 的 options。

AVAssetVariantQualifier 有几个好处：

- 支持复合条件过滤
- 能作用于任何属性
- 能够自定义构造函数

它的使用依赖 NSPredicate。

> NSPredicate 是基础库中用来过滤获取数据的类。如果你不曾了解，可以参考[官方文档](https://developer.apple.com/documentation/foundation/nspredicate)。

有了 AVAssetVariantQualifier 后，上面的配置条件代码可能是这样的。

```swift
let predicate = NSPredicate(format: "videoAttributes.videoRange == %@ && peakBitRate > 10000000"，argumentArray: [AVVideoRange.pq])

let variantQualifier = AVAssetVariantQualifier(predicate: predicate)
```

### 内容配置

配置好 AVAssetVariantQualifier 后，需要将其交给 AVAssetDownloadContentConfiguration。

一个 AVAssetDownloadContentConfiguration 代表了一组音频、视频和字幕的配置。

除了变体相关参数外，AVAssetDownloadContentConfiguration 还会指定一组 AVMediaSelection，负责配置音频和字幕的语言。

> 如果你不太了解 AVMediaSelection 的配置，可以参考[官方文档](https://developer.apple.com/documentation/avfoundation/media_playback_and_selection/selecting_subtitles_and_alternative_audio_tracks)。

比如用户还想指定下载法语语言和英文字幕，可以这样配置。

```swift
let contentConfig = AVAssetDownloadContentConfiguration()

let variantPref = AVAssetVariantQualifier(predicate: NSPredicate(format: "videoAttributes.videoRange == %@ && peakBitRate > 10000000", argumentArray: [AVVideoRange.pq]))
contentConfig.variantQualifiers = [variantPref]

// 指定法语语言和英语字幕
let myMediaSelections : [AVMediaSelection] = [frAudioMS, enLegibleMS]
contentConfig.mediaSelections = myMediaSelections
```

如果你不指定 mediaSelections，AVFoundation 将会选择默认的语言和字幕。

### 下载配置

有了 AVAssetDownloadContentConfiguration 后，还需要传给 AVAssetDownloadConfiguration。

AVAssetDownloadConfiguration 是 HLS 下载的最终配置环节，它能接收多个 AVAssetDownloadContentConfiguration。

注意，这里有主内容配置(primaryContentConfiguration)和辅助内容配置(auxiliaryContentConfigurations)的区分。

AVAssetDownloadConfiguration 能接收一个主内容配置和多个辅助内容配置。辅助内容配置的作用是进一步约束你的配置选项，避免下载到多个满足主内容配置的不同资源，从而增加了下载内容的大小。

![img](https://images.xiaozhuanlan.com/photo/2021/29c889ae1a5219c9cfc0a65bcc8908d2.png)

另外，你可以通过 optimizesAuxiliaryContentConfigurations 灵活控制辅助内容配置是否生效(默认生效)。这里举个例子：

```swift
let asset = AVURLAsset(url: URL(string: "http://example.com/master.m3u8")!)
let dwConfig = AVAssetDownloadConfiguration(asset: asset, title: "my-title")

// 主内容配置
let varPref = NSPredicate(format: "videoAttributes.videoRange == %@ && peakBitRate > 10000000", argumentArray: [AVVideoRange.pq])
let varQf = AVAssetVariantQualifier(predicate: varPref)

dwConfig.primaryContentConfiguration.variantQualifiers = [varQf]
dwConfig.primaryContentConfiguration.mediaSelections = [enAudioMS, frAudioMS, enLegibleMS]

// 辅助内容配置
let auxVarPref = NSPredicate(format: "%d IN audioAttributes.formatIDs", argumentArray: [kAudioFormatAppleLossless])
let auxVarQf = AVAssetVariantQualifier(predicate: auxVarPref)

let auxContentConfig = AVAssetDownloadContentConfiguration()
auxContentConfig.variantQualifiers = [auxVarQf]
auxContentConfig.mediaSelections = [enAudioMS]

dwConfig.auxiliaryContentConfigurations = [auxContentConfig]

dwConfig.optimizesAuxiliaryContentConfigurations = true
```

在这个例子中我们的主内容配置指定下载码率大于 10 Mbps 的 HDR 视频，同时音频语言选择英语和法语，字幕指定英语。

同时，我们的辅助内容配置指定要英语的无损音频。在 optimizesAuxiliaryContentConfigurations 为 true 的情况下，法语音频和非无损的音频就不会被额外下载。

### 全新的下载流程

有了以上的配置，我们就可以开始下载我们指定的 HLS 视频了。另外值得一提的是，在 iOS 15 之后，下载的进度能直接通过 Progress 属性监控了。同时该属性也支持了 KVO，用来做一些 UI 交互等逻辑。

完整流程如下：

```swift
let myAssetDownloadDelegate = MyDownloadDelegate()

// 后台 session 配置
let configuration = URLSessionConfiguration.background(withIdentifier: "my-background-session")

// 初始化 AVAssetDownloadURLSession
let session = AVAssetDownloadURLSession(
    configuration: configuration, 
    assetDownloadDelegate: myAssetDownloadDelegate, 
    delegateQueue: OperationQueue.main
)

// 创建 AVURLAsset
let asset = AVURLAsset(url: URL(string: "http://example.com/master.m3u8")!)

// 下载内容配置
let dwConfig = AVAssetDownloadConfiguration(asset: asset, title: “my-title”)

...

// 创建 downloadTask
let downloadTask = session.makeAssetDownloadTask(downloadConfiguration: dwConfig)

// 开始下载
downloadTask.resume()

// 直接获取下载进度
let progress = downloadTask.progress
```

### 直接通过变体配置你的下载

有些业务场景需要使用 AVAssetVariant 来进行 HLS 下载配置，这时候使用 NSPredicate 就不太合适了。因此苹果提供了另一种内容配置方案，直接传配好的 AVAssetVariant。

```swift
let asset = AVURLAsset(url: URL(string: "http://example.com/master.m3u8")!)
let dwConfig = AVAssetDownloadConfiguration(asset: asset, title: "my-title")

// 主内容配置
let myVariant : AVAssetVariant = ...
let myMediaSelections : [AVMediaSelection] = ...

// 此处直接通过变体初始化 qualifier
let variantQf = AVAssetVariantQualifier(variant: myVariant)

dwConfig.primaryContentConfiguration.variantQualifiers = [variantQf]
dwConfig.primaryContentConfiguration.mediaSelections = myMediaSelections

// 辅助内容配置
let myAuxVariant : AVAssetVariant = ...
let myAuxMediaSelections : [AVMediaSelection] = ...

// 此处也是直接通过变体初始化 qualifier
let auxVariantQf = AVAssetVariantQualifier(variant: myAuxVariant)

let auxContentConfig = AVAssetDownloadContentConfiguration()
auxContentConfig.variantQualifiers = [auxVariantQf]
auxContentConfig.mediaSelections = myAuxMediaSelections
dwConfig.auxiliaryContentConfigurations = [auxContentConfig]
```

# 结语

AVAssetVariant 的引入很大程度上丰富了 HLS 下载的配置，同时也简化了之前很多额外的工作。有了这些方便的特性，相信在不久的将来对 HLS 下载的支持将会成为音视频 App 的标配。

# 参考资料

https://developer.apple.com/videos/play/wwdc2020/10655/

https://developer.apple.com/streaming/

https://blog.csdn.net/u014219492/article/details/110184490