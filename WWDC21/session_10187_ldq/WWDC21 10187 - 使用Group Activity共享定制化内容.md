# WWDC21 10187 - 使用Group Activity共享定制化内容

> 作者：Darwin-lv，客户端架构师，就职于字节跳动飞书视频会议团队。
>
> 审核：
> 
> 刘思源，目前就职于字节跳动音乐团队
>
> 莲叔 ，任职于阿里uc事业部，负责uc主端短视频，直播等业务。对于音视频，端智能等技术领域有一定经验。

![](https://images.xiaozhuanlan.com/photo/2021/685edcf53a1d7dc756b257ca747cd8f9.png)

## 导读

刚刚结束的 WWDC 2021 ，苹果给 Facetime 带来了新功能 SharePlay。使用苹果设备的用户，无论是 iOS、iPadOS 还是 MacOS，都可以通过 Facetime 开启 SharePlay，和其他苹果用户，无论他使用什么类型的苹果设备，都可以实时的共享电影、音乐等媒体。 

当然不仅仅是共享媒体， SharePlay 的底层通信框架 Group Activities Framework 还支持通过 GroupSessionMessenger API 发送和接收结构化的数据。GroupSessionMessenger 会自动进行序列化和反序列化，并且进行端到端的加密。

本文通过一个简单的白板应用为例， 讲解了开发共享定制化内容的相关技术， 包括：

- 开发共享定制化内容和共享媒体的区别
- 通过 GroupSessionMessenger API 进行数据通信
- 一个优秀的共享应用还需要注意的细节

> 在阅读本文前建议首先阅读 [WWDC21 10183/10184 - 初探 Group Activities](https://xiaozhuanlan.com/topic/0593748621)   和[WWDC21 10225 - 使用 Group Activity 共享媒体](https://xiaozhuanlan.com/topic/2560189374) 了解 Group Activities API 的基本概念
> 本文主要信息来源于[WWDC21 session 10187：Build custom experiences with Group Activities](https://developer.apple.com/videos/play/wwdc2021/10187/)

## 共享定制化内容
### 基本概念

- GroupActivity: 应用用来定义共享内容的实体
- GroupSession: 用来一个SharePlay会话的对象

详细描述参见 [WWDC21 10183/10184 - 初探 Group Activities](https://xiaozhuanlan.com/topic/0593748621)，这里不再详述。

### 基本流程

先简单回顾一下 SharePlay 共享媒体的基本流程，详细描述参见 WWDC21 10225 - 使用 Group Activity 共享媒体 

1. 应用声明支持 GroupActivity， 并创建实现 GroupActivity 协议的对象
2. 发送方通过 GroupActivity 对象的 `prepareForActivation`、`activate` 等方法发起共享
3. 会话中的设备通过 GroupActivity 对象的异步方法 `sessions` 来获得 GroupSession
4. 会话中各方将 GroupSession 配置到 `AVPlaybackCoordinater` 或者 `AVDelegatingPlaybackCoordinator` 来同步状态
5. 会话中各方调用 GroupSession 的 `join` 方法，开始同步数据
6. 会话中各方调用 GroupSession 的 `end` 或者 `leave` 方法来结束会话，停止同步数据

相比于共享媒体，共享定制化内容主要有两个地方不同。 一个是 GroupActivity 定义 metadata 需要更改类型。另一个是获得 GroupSession 后不再配置到 `AVPlaybackCoordinater`， 而是用GroupSession构造一个 `GroupSessionMessenger` 对象来管理数据传输。

#### GroupActivity 定义

在实现 GroupActivity 协议的时候， 设置 metadata 的类型为 `generic`，这样系统就知道这个 GroupActivity 是一个定制化的内容，而不是多媒体内容。

![](https://images.xiaozhuanlan.com/photo/2021/ee59d8cce8dc897349d1bd03c88487f4.png)

### GroupSessionMessenger
`GroupSessionMessenger` 类和 `AVPlaybackCoordinater` 类类似， 提供了一组简单的 API，帮助开发者通过 GroupSession 利用现有的 Facetime 通信通道来发送与接收特定的数据。例如，电影观看应用程序可能会在电影播放时共享用户评论或标签。
`GroupSessionMessenger` 对象的创建和简单，只需要一个 GroupSession 作为参数。

```swift
let messenger = GroupSessionMessenger(session: groupSession)
```

不过需要注意的是，要想通过 `GroupSessionMessenger` 发送和接收数据，需要在会话的生命周期内对 `GroupSessionMessenger` 对象强引用。

#### 数据结构
`GroupSessionMessenger` 支持传递 Data 类型的数据，或者 Codable 类型的数据。`GroupSessionMessenger` 会自动进行序列化和反序列化 Codable 类型的数据，并且进行端到端的加密。

```swift
struct UpsertStrokeMessage: Codable {
    let id: UUID
    let color: Color
    let point: CGPoint
}
```

#### 接收数据
接收数据 API 也支持 Data 和 Codable 的数据结构。其 API 定义如下：

```swift
final func messages(of type: Data.Type) -> GroupSessionMessenger.Messages<Data>
final func messages<Message>(of type: Message.Type) -> GroupSessionMessenger.Messages<Message> where Message : Decodable, Message : Encodable
```

API 返回一个支持 AsyncSequence 协议的数据结构，可以通过 Swift 的新特性 await 来读取数据。 在本例中， 接收对方所画线条的消息代码如下：

```swift
for await （message, context) in  messenger.messages(of: UpsertStrokeMessage.self) { [weak self] in
    self?.handle(message)
}
```
#### 发送数据
发送数据的 API 支持 async 和回调函数两种方式。默认会发送给所有的参与者，并保证数据可靠传输。API 定义如下：

```swift
final func send<Message>(_ value: Message, to participants: Participants = .all, reliability: GroupSessionMessenger.MessageReliability = .reliable) async throws where Message : Decodable, Message : Encodable
final func send(_ value: Data, to participants: Participants = .all, reliability: GroupSessionMessenger.MessageReliability = .reliable) async throws
final func send(_ value: Data, to participants: Participants = .all, reliability: GroupSessionMessenger.MessageReliability = .reliable, completion: @escaping (Error?) -> Void)
final func send<Message>(_ value: Message, to participants: Participants = .all, reliability: GroupSessionMessenger.MessageReliability = .reliable, completion: @escaping (Error?) -> Void) where Message : Decodable, Message : Encodable
```

在本例中，简单的发送所画线条，采用默认的参数即可。

```swfit
do {
    try await messenger.send(UpsertStrokeMessage(...))
} catch {
    // Handle error
}
```
在某些情况下， 只想发送特定消息给特定的参与者， 此时需要提供 participants 参数， 在本文同步全量数据章节中有具体的示例。

默认情况下 GroupSessionMessenger 会在发送失败的情况下尝试重试。 对于一些实时性很强，很快会被更新，可以丢弃的数据，可以将reliablility 参数设置为 `unreliable`，来表示失败时不重试。

### 限制

并非任何类型的消息都适合通过 GroupSessionMessenger 发送，也有一些限制需要考虑。

#### 发送消息的大小

GroupSessionMessenger 适用于较小的有效负载，不应用于流式传输文件图像或视频等大型资源。如果发送的数据太大，会引发发送API报错。

#### 发送消息的频率

快速连续的发送消息，超出 GroupSessionMessenger 所承受的阈值，可能导致从发送API抛出错误。

#### 消息定义的版本

需要考虑到参与者使用的应用版本可能不同， 因此互通消息的时候，要考虑到不同版本之间的差异，避免数据解析错误导致的异常。

## 需要注意的细节
### 同步全量数据

当发起 SharePlay 的时候，并不是所有的参与者都是同一时刻加入的。 有些参与者可能由于网络延迟，安装应用等原因，在较晚的时刻才加入到共享会话中。

为了确保适当的用户体验，后来加入的用户也需要得到最新的信息。所以需要让所有的设备都在使用相同的数据。考虑这种情况对于确保一致的用户体验至关重要。

为了解决这个问题， 通过监听与会者变化，给新加入的参与者发送全量的数据。本例中定义了一种新的数据类型用来传递全量数据。

```swift
struct CanvasMessage: Codable {
    let strokes: [Stroke]
    let pointCount: Int
}
```

和前面接收笔画数据的方法一样，我们可以接收到 `CanvasMessage`。 GroupSessionMessenger 会根据类型区分，两种消息不会混淆。

```swift
for await （message, context) in  messenger.messages(of: CanvasMessage.self) { [weak self] in
    self?.handle(message)
}
```

本例中，我们监听 GroupSession 的 `ActiveParticipants` 属性来获取新增的参会者。然后将消息仅发送给新增的参会者。

```swift
groupSession.$activeParticipants
    .sink { activeParticipants in
        let newParticipants = activeParticipants.subtracting(groupSession.activeParticipants)
        
        async {
            do {
                try await messenger.send(CanvasMessage(...), to: .only(newParticipants))
            } catch {
                // Handle error
            }
        }
    }
    .store(in: &subscriptions)
```
 
 > 这个示例主要是为了展示 Group Activities Framework 的能力，真实场景中不要忘记了通过 GroupSessionMessenger 发送数据是有数量和频率的限制的。 因此将大规模的数据存储到自建服务器， 而通过该通道同步类似id和版本这样的简单数据可能是更好的方案。
 
### 更换共享内容

真实世界中，SharePlay 共享的内容不会是一成不变的。 人们会很正常的期望更换电影、歌曲或者一个新的白板。
有两种办法可以更换共享的内容。创建新的 GroupSession 或者更新 GroupSession 所持有的 GroupActivity

#### 创建新的 GroupSession

创建新的 GroupSession 是更换共享内容的首选方法。 只需要按照启动共享的步骤重新调用对应的 API 即可。因为清晰的加入会话、退出会话流程，这种方法更容易将参与者之间的状态同步一致，因此不需要担心从旧的会话中得到不需要的滞留状态或消息。
在本文白板的例子中，通过创建新的 GroupSession 来创建一个新的画板显然更合适。

```swift
func reset() {
    // clear local data
    strokes = []
    
    // Teardown existing groupSession
    messenger = nil
    tasks.forEach { $0.cancel() }
    tasks = []
    subscriptions = []
    if groupSession != nil {
        groupSession?.leave()
        groupSession = nil 
        DrawTogether().activate()
    }
}
```

#### 更新 GroupActivity
GroupSession 提供了一个简单的方法来更新 GroupActivity。

```swift
GroupSession.activity = newActivity
```
框架会保证所有加入的会话保持 `activity` 属性的同步。 开发者需要做的只是监听这个属性的变化。

```swift
groupSession.$activity
    .sink { activity in
        // 更新用户界面
    }
    .store(in: &subscriptions)
```

> 需要确保 `groupsession` 已经调用过 `join()` 函数， 并且状态是 `GroupSession.State.joined`，否则读取和写入 `activity` 属性的行为是未定义的。另外 `activity` 属性的[官方文档](https://developer.apple.com/documentation/groupactivities/groupsession/activity)被标记为 Beta， 代表该属性的的行为未来可能会改变，需要以最终版本为准。

### 根据系统状态调整用户界面

有时候我们期望能够在可以发起共享的时候调整应用程序的用户界面，让用户可以快速意识到，他们可以在 Facetime 通话中共享这个应用。在本文白板的例子中，我们期望只有在可以共享的场景下显示共享按钮。
`GroupStateObserver` 对象可以完成这个工作。要获取当前系统状态，可以创建一个 `GroupStateObserver` 对象并检查其 `isEligibleForGroupSession` 属性的值。

```swift
var groupStateObserver = GroupStateObserver()

if groupSession == nil && groupStateObserver.isEligibleForGroupSession {
    // 显示共享按钮
}
```

## 总结

使用 Group Activity 共享定制化内容和共享媒体的基本流程是一致的。 最主要的区别是共享定制化内容需要通过 GroupSessionMessenger  收发自定义的数据结构。这样的设计给了开发者很大自由空间。

虽然 GroupSessionMessenger 提供的数据通道有一定的能力限制，但是目前大多数应用本身就具备了联网协同的能力，并不缺乏实时通讯能力。而通过这个数据通道完成创建房间，加好友，交换名片等信息，相当于借助苹果自身的 Facetime 社交连接为自己的应用增加更多的社交能力。


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
