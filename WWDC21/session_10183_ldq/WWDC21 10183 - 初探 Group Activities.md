# WWDC21 10183/10184 - 初探 Group Activities 

> 作者：Darwin-lv，客户端架构师，就职于字节跳动飞书视频会议团队。
>
> 审核：
> 
> 刘思源，目前就职于字节跳动音乐团队
>
> 莲叔 ，任职于阿里uc事业部，负责uc主端短视频，直播等业务。对于音视频，端智能等技术领域有一定经验。

![](https://images.xiaozhuanlan.com/photo/2021/9236b14a97541f806fff6ad749c1ace9.png)

## 缘起
WWDC 2021 上， 苹果给 Facetime 增加了新功能 SharePlay。 可以在语音通话过程中实时分享桌面，同步观看视频，同步操作应用。为了让应用支持 SharePlay， 苹果开放了 Group Activities 框架。应用开发者可以通过接入 Group Activities Framework， 开发支持 SharePlay 的应用。

笔者一直以来从事实时通讯应用的开发，对 SharePlay 这种新的共享内容的方案很感兴趣，想用本文探讨一下下面几个问题：

- SharePlay 是什么？
- 开发者能用 Group Activity framework 做什么？
- 苹果推出的 Group Activity framework 可能会对应用开发带来什么影响？

本文主要信息来源于以下两个 WWDC session：

- [Session 10183 Meet Group Activities ](https://developer.apple.com/videos/play/wwdc2021/10183)
- [Session 10184 Design for Group Activities](https://developer.apple.com/videos/play/wwdc2021/10184)

更多的针对实时同步多媒体、实时同步自定义UI的技术细节，将会在另外的文章中探讨。 如果本文成功勾起了你的兴趣，想探索更多的技术细节，请移步
 
- [WWDC21 10225 - 使用Group Activity共享媒体](https://xiaozhuanlan.com/topic/2560189374) 
- [WWDC21 10187 - 使用Group Activity共享定制化内容](https://xiaozhuanlan.com/topic/6205739184)

## SharePlay 

![](https://images.xiaozhuanlan.com/photo/2021/b8f185f3960a131c6e8113ef03e08a14.png)

去年的疫情使人们不太方便直接面对面交流，带来了实时通讯的需求旺盛。 人们也开始养成了实时视频通讯的习惯。在音视频实时通讯中共享“内容”，一直以来都是“刚需”。传统的视频会议应用通过共享屏幕的功能来实现共享“内容”。共享屏幕的原理是将发起共享者的设备屏幕通过视频编码压缩的方式传递给被共享者。因此会消耗大量的的设备性能、网络带宽。 同时清晰度也无法和原生应用体验相比。

这次Facetime 推出SharePlay 功能，提供了一种新的方式来共享“内容”。 通过 Group Activities framwork，加入 Facetime 会话的各个设备可以同步应用的状态，在各自的设备上通过原生应用的方式展示“相同”的“内容”。

最典型的场景是观看电影，苹果构建了一个全新的回放同步协议，并与 AV Foundation 进行了深度集成。这意味着有人点击播放，组中的每个人立即同时开始播放。每个人都会得到你完整的高清视频，因为它正从应用程序中播放，并像往常一样从服务器中流式传输数据，并确保所有观众都在观看最高质量的视频。用户将获得身临其境的社交观看体验，永远不会损害内容的质量。SharePlay 实现了智能音量，让播放过程中的交流感觉自然。当人们在播放过程中大声说话时，会自动扣除内容的音频，并在适当的时候将其带回来。所以人们可以通过语音视频和文本自然地交流，就像他们坐在同一个房间里一样。

Facetime 的愿景是每一个媒体的播放按钮，都能支持 SharePlay。为此苹果为 SharePlay 在 SF symbol 中创建了一个符号。可以直接使用这个SF symbol 来标志支持 SharePlay。让用户有预期点击播放按钮后会启动 SharePlay。

![](https://images.xiaozhuanlan.com/photo/2021/ed47c9b86eb63d05c5c11f0b12484845.png)

苹果也支持开发者分享除了音视频的定制化内容。 WWDC session 中是实现了一个白板作为例子。不过分享定制化内容，可以更有想象力。比如同步展示一个演示文档，会比共享屏幕有更好的用户体验。

<!---
> 飞书视频会议的妙享功能，支持在视频会议中共享一篇飞书云文档，参会人可以按照自己的节奏自由浏览文档和协同编辑， 也可以一键跟随共享人。应该算是一种在实时通讯中分享定制化内容的方案。 相比于 SharePlay 来说更早，跨平台生态。不过无法像 SharePlay 共享视频一样无缝切换。
--->

## 我们能用 Group Activity 做什么？

### 基本能力
Group Activities 是一个基于 Facetime 实时通讯技术的实时通讯框架。使用 Swift 实现，需要iOS 15以上的操作系统支持。框架主要提供了保证端到端加密的实时数据传输能力，并且通过和 AV Foundation 的紧密集成，Group Activities 框架还可以很轻松创建共享的视频和音频播放，并提供流畅的用户体验。

要了解使用这个框架首先需要理解两个核心概念， GroupActivity 和 GroupSession。

#### GroupActivity

GroupActivity 是应用用来定义共享内容的实体。主要是用来提供被共享的元信息，例如，标题、副标题、播放媒体的url等。 也可以存放一些自定义数据等。发起 SharePlay 是通过操作 GroupActivity 来完成的。你可以把任何一个你想要共享的实体，定义成一个 GroupActivity。

代码层面上， GroupActivity 是一个继承自 Codable协议的协议。 当一个 GroupActivity 实体被共享时， 它会被序列化并通过实时数据通道传递给所有参与者。 这样参与者就可以获得被共享的内容信息。

#### GroupSession

GroupSession 代表一个 SharePlay 会话。它维护着参与者列表，以及实时数据传输通道，可以通过它来收发一些数据，来保持各个设备同步。这个通道不是传输大量数据的， 只是用来传输轻量的状态同步数据。 参考 APNS 推送的实际到达率，Facetime 传输通道的实际质量也待验证。

GroupSession 只能通过系统创建，通过监听 GroupSession 的异步类方法获得实例，目前还无法自行创建 GroupSession。

### 附加能力

借助系统权限， 在 SharePlay 场景下，应用可以通过 Group Activity 获得一些额外的附加能力。

#### 后台启动播放

当一个 SharePlay 启动的时候，本质上是多任务处理的。Group Activity API 支持在后台直接启动应用并播放多媒体。

#### 启动应用到前台

有时候应用可能需要一些互动，例如需要登录或者订阅更多内容。如果是这样，只需调用 Group Activity API，告诉系统应用需要前台演示。用户将点击横幅，应用程序将被带到前台。允许用户在加入体验之前进行交互。

![](https://images.xiaozhuanlan.com/photo/2021/2022b88d453633518724110d46aa1692.png)

#### 安装应用

如果有人在 SharePlay 开始时没有安装分享应用程序，Facetime 会提示用户跳转到 Appstore 安装应用。

![](https://images.xiaozhuanlan.com/photo/2021/67386b63903018adf03bb384e4bf8bcd.png)

### 需要开发者额外考虑的

#### 控制权

GroupActivities 框架本身没有提供权限控制的能力，所有人相同的权限，都可以操作。 这个在家庭场景下没有什么问题。不过对于某些类型应用，需要自己考虑操作权限控制策略。

#### 冷启动

实时沟通对于时效性要求很强。因此当应用通过 GroupActivities 框架启动时，应该快速进入共享场景，否则用户很容易失去耐心，导致放弃。 GroupActivities 只是一个通讯框架，应用需要自己设计启动流程，尤其是新用户流程。

### 对开发者的影响

#### 新的流量入口

类似 iMessage app， SharePlay 提供了一种通过沟通触达新用户的途径。 App 可以借助 SharePlay 达到传播的目的。 并且根据苹果的习惯，支持新技术的 app 在 AppStore 应该有一定的推荐位置。

不过由于一些众所周知的原因， Facetime 在国内不大方便使用，对国内影响可能不大。

#### 跨生态的“SharePlay”

目前 GroupSession 只能是苹果系统在 Facetime 通话中创建， 所以实际上 “SharePlay” 只能在 Facetime 通话中实现。 如果苹果支持第三方应用实现 GroupSession， 那么支持 SharePlay 的应用的应用场景将得到扩展，第三方实时通讯应用的能力也会得到提升，是一个双赢的局面。不过目前来看，这还是一个“美好的愿望”。

实时通讯中更高质量的内容共享是一个刚需，顺着类似的思路， 是否会有一个实时通讯产品，推出类似 GroupActivity 的 SDK， 支持跨生态的“SharePlay”，提供屏幕共享和特定应用内容共享的无缝切换，成为实时通讯行业的统一标准，值得期待。

## 参考文档
Group Activity 相关的 WWDC Session：

[【WWDC21 10183/10184】初探 Group Activities](https://xiaozhuanlan.com/topic/0593748621)

-  [Meet Group Activities](https://developer.apple.com/videos/play/wwdc2021/10183/) 
-  [Design for Group Activities ](https://developer.apple.com/videos/play/wwdc2021/10184/)


[【WWDC21 10225】使用 Group Activity 共享媒体](https://xiaozhuanlan.com/topic/2560189374)
-  [Coordinate media experiences with Group Activities ](https://developer.apple.com/videos/play/wwdc2021/10225/)

[【WWDC21 10187】使用 Group Activity 共享定制化内容](https://xiaozhuanlan.com/topic/6205739184)
-  [Build custom experiences with Group Activities](https://developer.apple.com/videos/play/wwdc2021/10187/) 

[【WWDC21 10189】使用 Group Activity 在 Safari 中共享媒体](https://xiaozhuanlan.com/topic/7165042893)
-  [Coordinate media playback in Safari with Group Activities](https://developer.apple.com/videos/play/wwdc2021/10189/) 


开发手册

- [Inviting Participants to Share an Activity](https://developer.apple.com/documentation/groupactivities/inviting-participants-to-share-an-activity)
- [Joining and Managing a Shared Activity](https://developer.apple.com/documentation/groupactivities/joining-your-app-to-a-shared-activity)

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
