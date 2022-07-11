# WWDC22 10117 - Experience improvement of "walkie-talkie" / “对讲机”的体验提升

## 前言
本文主要是通过分析业内 app 中“对讲机”这类产品的功能痛点，结合 [Session 10117：Enhance voice communication with Push to Talk](https://developer.apple.com/videos/play/wwdc2022/10117/) 的内容，分析 iOS 16 如何帮助我们解决这些痛点实现更好的“对讲机”，最后讲述了 PushToTalk.framework 的如何集成、代码上如何使用，以及开发要点。

本文基于  Session 10117：Enhance voice communication with Push to Talk 整理

作者：Luoke，钉钉音视频 iOS 端开发，专注于 iOS 端音视频领域

审核：

-----
## 引言
对讲机是一种在近距离、相同频率下，可以便捷地通过语音通话的通信设备。那么，iPhone 可以成为一台“对讲机”吗？还真可以！


- 你是否还记得 2021年，一款名为“ClubHouse”的 app 爆红全球，马斯克（下图中的红短裤头像）、张小龙等各路大咖争相体验，邀请码一码难求，其实“ClubHouse”就是一种“对讲机”形式的业务：发言之前，主持人先邀请上台，想发言就按解除静音开始发言，结束发言就静音；
<div align=center>
<img src="https://github.com/SwiftOldDriver/WWDC22/blob/sesion_10117/sessions/session_10117/images/wwdc_clubhouse.jpeg" width="40%"/>
</div>

- 另外一个大家都在用的“对讲机”业务，就是微信的“共享实时位置”：我们在下图中共享位置的地图页面中，按住下面按钮，就可以发言，对方就能实时听到，而没人发言时，是没有声音播放的。

<div align=center>
<img src="https://github.com/SwiftOldDriver/WWDC22/blob/sesion_10117/sessions/session_10117/images/wwdc_wechat.JPG" width="40%"/>
</div>




-----
## 痛点和问题
这种“对讲机”业务其实就是“语音会议”的简单伪装，具体是怎么实现的呢？ 阿里云的 [如何用 4 个小时搭建一个新 “Clubhouse” ，引爆声音社交新风口](https://developer.aliyun.com/article/781827)、网易云信的 [简单五步，轻松构建本土「Clubhouse」](http://yunxin.163.com/blog/buildclubhouse/)等给出的技术方案类似，可以概述如下：

- 对讲前，主持人创建一个语音会议（channel），服务端维护这个会议；

- 其他人需要首先加入会议（channel），才能参与语音通话；

- 每个参会人都默认静音加入会议；

- 每个参会人都将订阅这个会议的音频流；

- 想要发言时，解除静音，录制语音，编码，通过实时推流到服务端；

- 服务端广播给其他每个参会人；

- 收到语音消息的参会人，将订阅收到的语音消息播放出来；


这种通过与媒体服务器保持连接，订阅媒体流的实现方式，只要有音频流到达就可以开始播放，实时性好，互动性强。但是iOS端现有的这些 app 通过这种方式实现之后，体验上的主要痛点在哪呢？

1. 后台保活耗电
从上面实现方式看，或者实测微信的共享位置，我们会发现，app 切到后台后，其他人发来语音消息，我们可以直接播放出语音消息，说明此时 app 处于后台保活状态，当然这是系统允许的，我们在 Xcode 中可以配置 VoIP 这种后台能力，向系统申请后台保持活跃，目前所有语音通话、会议类 app 也都是这样实现的。但是问题也很明显：后台期间，audio unit、IO 硬件、网络等都处于工作状态，对于 CPU 消耗都很大，所以设备耗电、发热也很明显。

2. 后台保活可靠性差
极端条件下，当系统性能处于瓶颈时 ，可能会将后台 app 强杀，以保证前台 app 的优先工作，此时我们将完全断开与其他人的联系，无法收听到语音消息。
如果我们误将 app 杀进程，也将无法收听到语音消息，必须通过回到 app，再加入语音会议，才能恢复与其他人的互通。

3. 后台期间他人说话没有任何提示
后台期间，我们只能听到语音，但是不能直接知道说话人是谁，只能通过语音来识别

4. 后台期间无法交互
这也是当前的最大痛点！我们虽然在后台期间，可以随时听到其他人的语音，却无法直接回复语音，必须回到 app 前台，再点击按钮才能回复消息。如果在锁屏状态下，还需要更多交互步骤。

-----
## iOS 16 带来 Push to talk
### 苹果的技术解析
iOS 16 终于给我们带来了“对讲机”的福音，我们可以完美解决前述的这类 app 的三个痛点:


- 首先，我们不再需要后台保活，当 app 进入后台，我们停止 audio unit、IO等硬件，app可以完全销毁进程，这不仅解决耗 CPU、耗电、发热等问题，也不再惧怕 app 被杀进程或强杀导致的问题；

- 其次，后台期间他人讲话，我们也能知道说话人是谁；

- 最后，最大痛点也得到解决，我们可在后台，甚至锁屏情况下，随时启动录音，语音回复其他人；


那么苹果是怎么做到的呢？ 哪些技术保证了体验上的提升呢？总结下来，苹果的改动主要是下面几点：


#### 新增 APNs

得益于 iOS 16 新增 APNs 类型，我们可以在后台期间，接收到服务端的消息通知，从而得知会议（channel）中的语音消息或者会议（channel）的状态变化。而苹果此次 APNs 的变化是，我们服务端发到 APNs 的 post 请求对应的字段跟其他推送类型有一些区别，主要体现在：

    ○ 请求的 header 中 apns-push-type 字段：需要设置成 "pushtotalk"；
    
    ○ 请求的 header 中 apns-topic 字段：需要设置 app 的 bundle id， 并以".voip-ptt"为后缀；
    
    ○ 请求的 header 中 apns-priority 字段：设置优先级为10；
    
    ○ 请求的 header 中 apns-expiration 字段：设置超时时间为0；
    
    ○ 请求的 payload 中可以为空，也可以包含自定义的关键字，例如 channel 是否可用的标志位等；
    
从 header 中的优先级和超时时间两个字段，我们能看出系统给了这种推送与 PushKit 支持的 VoIP 推送（具体可参考官方说明）是同等的地位，而 VoIP 推送主要用于系统给 VoIP 类应用提供快速、实时的来电通知，从而也能看出这个新增推送类型的实时性要求很高。


#### 新增系统 UI 支持

新增 UI 包含两方面，一方面后台期间启动录制的快速启动入口，以及录制相关 UI，我们可以通过下面两个视频看到后台期间，启动录制的两种方式，前一种是未锁屏情况下：

<div align=center>
<img src="https://github.com/SwiftOldDriver/WWDC22/blob/sesion_10117/sessions/session_10117/images/wwdc_lockscreen_record.gif" width="60%"/>
</div>

后一种是锁屏情况下：

<div align=center>
<img src="https://github.com/SwiftOldDriver/WWDC22/blob/sesion_10117/sessions/session_10117/images/wwdc_background_record.gif" width="60%"/>
</div>

另一方面，后台期间接听到会议（channel）中的语音消息，系统 UI 也支持了一种区别于其他通知类型的UI形式，可以展示出会议（channel）的图像和发言人信息：

<div align=center>
<img src="https://github.com/SwiftOldDriver/WWDC22/blob/sesion_10117/sessions/session_10117/images/wwdc_receive_apns.gif" width="60%"/>
</div>

p.s. 遗憾的是，启动录制的入口和启动录制的界面都不支持自定义，我们只能通过系统UI来展示。


#### 维护“channel”生命周期

iOS 16 系统增加了对“channel”生命周期的维护，通过 PushToTalk.framework 提供的 join、leave 接口我们可以加入和离开会议“channel”， 当我们成功进入或离开“channel”时， 系统都会更新当前 channel 的状态，同时将系统 UI 与 channel 的状态关联：
当我们在 channel 中未离开时 ，iOS 16系统的导航栏一直保持一个“pill”，我们可以随时点击它从而唤起录制相关的系统UI界面，启动录音发送消息；
同时，当我们离开 channel 后，系统将同步维护的 channel 状态，并清除系统导航栏上的“pill”入口。


#### 接管后台期间的 Audio Session

我们上面实现“对讲机”的方案中，“语音会议”保证了充分的实时性，但是它需要长期的心跳保活，后台期间长期占用着音频设备，通过 audio unit 进行录音和播放，Audio Session 一直处于活跃（active）状态，而音频相关的录制和播放线程通常都是音视频类 app 的消耗 CPU 大户。

但是从 [Session 10117：Enhance voice communication with Push to Talk](https://developer.apple.com/videos/play/wwdc2022/10117/) 的内容，我们能看苹果在在节能方面的良苦用心：苹果期望的不是一个长期在后台存活着的“语音会议”，苹果提供的是一个在后台期间挂起，仅依靠APNs能短暂活起来接收、订阅、解码、播放语音消息，然后再挂起这样一个最佳实践，而这个最佳实践的另一个关键技术，就是系统接管了 Audio Session。

通过对 Audio Session 的接管，我们app不需要管理 Audio Session 的生命周期，系统将给与其合适的优先级，并在适当的时机激活和挂起，从而实现更好地节省能耗。当我们 app 处于后台，

    ○ 当我们发送语音消息时，我们点击唤起系统录制UI时，系统将激活 Audio Session，我们通过 audio unit 可以录制语音，录制结束，系统将挂起 Audio Session；
    
    ○ 当我们接收到语音消息时，系统将自动激活 Audio Session，从而我们可以将音频消息播放出来；

系统在接管Audio Session时，会通过代理方法将相关事件同步给我们：
```
- (void)channelManager:(PTChannelManager *)channelManager 
didActivateAudioSession:(AVAudioSession *)audioSession;

- (void)channelManager:(PTChannelManager *)channelManager 
didDeactivateAudioSession:(AVAudioSession *)audioSession;
```
通过系统对 Audio Session 的合理调度，我们可以尽可能地减少对音频设备的占用，较小 CPU 消耗，从而减少电量消耗和发热。

<br/>
<br/>
### 新技术方案

结合 iOS 16 在 APNs、系统 UI、接管 Audio Session、维护 channel 生命周期等方面的支持，我们还需要对技术方案进行改造：在原方案基础上，通过改造在线方式、支持多种消息通知方式，端到端支持音频编码、解码、打包、解析、传输工作（在传输通道上，苹果只提供APNs用于消息的通知，而不包含具体的流媒体流），从而升级为低功耗、高可靠、易交互的新方案。

下图主要通过两个参会人 iPhoneA、iPhoneB 来示意主要流程，包含了创建会议、加入会议、录音发送消息、推流、订阅拉流、切入后台通知服务端、APNs 通知后台参会方等。下面将结合时序图来描述新的技术方案：
<div align=center>
<img src="https://github.com/SwiftOldDriver/WWDC22/blob/sesion_10117/sessions/session_10117/images/wwdc_flow.png" width="80%"/>
</div>



1. 改造在线方式
前述方案中，由于采用后台保活，所以客户端在服务端侧的在线方式只有一种方式。但是我们新方案中，需要支持两种在线方式：前台在线和后台在线。支持两种在线方式，主要是为了保证后台期间不保活，也能感知到其他人的说话，这时就通过 APNs 来获取到最新信息。

- 见上图中流程1、2，iPhoneA 首先创建了一个会议（channel），加入会议，这次A就处于第一种前台在线方式，通过心跳保持与服务端互通；

- 见上图中流程3，当 iPhone 用户 B 进入后台时，通知服务端已经进入第二种在线方式，这时 B 停止录制，释放资源，使 app 可以自然进入挂起状态；


2. 多种消息通知方式
这里的消息通知，主要是指服务端广播消息通知客户端。我们根据新增的 APNs 增加支持在后台期间的消息通知，包含会议状态变化和会中语音消息。而这部分通知需要服务端根据前文 APNs 类型说明，开发增加新的 post 请求。当服务端推送通知给客户端时，涉及到两种交互：

- 当 iPhone 用户 A 启动录制并开始推流时，将与媒体服务器交互，见图中流程4；

- 媒体服务端会通知会议管理服务器，当前有用户A在说话，见图中流程5；

- 会议管理服务器收到有人说话通知，将广播给 channel 中所有人，见上图中流程6，其中第一种在线的用户将收到会议管理服务器发出的通知，而第二种在线用户将通过会议管理服务器，发送请求给苹果的APNs，经由 APNs 发出通知给这种用户；


3. 处理消息

- 此时 iPhone 用户 B 在后台，收到 APNs 的通知，见图中流程7；

- 用户 B 解析 APNs通知，识别到有用户 A 在推流，用户B将向媒体服务器发起订阅A的音频流的请求，见图中流程8；

- 用户 B 拉取到音频流后播放出来，见图中流程9；

- 当 iPhone 用户 B 录音并推流时，见图中流程10，相似地，服务端会通知用户 A，见图中流程11；

- 此时用户 A 在前台，所以服务端直接通知用户 A，见图中流程12；

- 用户 A 去订阅用户 B 的音频流，见图中流程13；

- 用户 A 订阅成功后，将拉取用户 B 的音频流，见图中流程14；

另外还有会议状态变化类通知，需要根据通知具体内容，更新会议，例如 channel 创建、channel 销毁、某个成员被踢出 channel 等。

-----
## 配置Xcode
Push to talk 新增 framework 名为 PushToTalk.framework，在 Xcode 中 import这个 framework 之前需要先配置一下：

- info.plist 中配置 NSMicrophoneUsageDescription 获取麦克风权限的文案，用来解决隐私问题；

- provisioning profile 中增加 Push to talk 相关 capability；

- entitlements 中增加 Push to talk 相关 capability；

- 增加后台模式中的 VoIP 的 capability，如下图；

- 增加后台模式中的 Push to talk 的 capability，此选项为 Xcode14 新增，Xcode 14 beta1 上面的配置如下图；
<div align=center>
<img src="https://github.com/SwiftOldDriver/WWDC22/blob/sesion_10117/sessions/session_10117/images/wwdc_xcode_ptt.png" width="70%"/>
</div>

-----
## 代码实现
iOS 16 新增的 PushToTalk.framework， 主要通过新增类 PTChannelManager 来管理 channel，提供 channel 生命周期相关的 API，如 join、leave、发送音频、接收音频等，并通过新增协议 PTChannelManagerDelegate 来通知我们 channel 生命周期变化或者接口调用成功与否，同时提供了注册 Push to talk 相关 APNs 相关的接口来支持后台期间收到相关推送通知。

### 入会配置
channel manager 通过初始化方法来创建，这个方法需要设置 channel 管理的代理和 channel 存储的代理。这个初始化方法是单例，多次调用都会返回同一个共享的实例，建议通过一个实例变量来持久化第一次生成的实例。

<br/>
- 启动后实例化

需要在 app 启动时的 didFinishLaunchingWithOptions：代理方法中尽早初始化 channel manager；通过下面方法初始化，这个方法中需要设置管理 channel 的代理和持久化 channel 的代理：
```
+ channelManagerWithDelegate:restorationDelegate:completionHandler:
```
这个初始化方法返回的是单例，app 内共享的实例，建议通过实例变量持有一下；

<br/>
- 配置Audio Session

配置 Audio Session 的 category 为 AVAudioSessionCategoryPlayAndRecord （一般会同时配置 mode 为 AVAudioSessionModeVoiceChat）


<br/>
- 创建channel

如果多方参与通信的 channel 还没创建，需要由某个人先创建一个 channel，由服务端返回 channel 相关信息，包括 channel id等；


<br/>
- 配置 channel Description：

PTChannelDescriptor 包含了 channel 的 id、image、name 信息，用于识别这个 channel
```
- (void)setChannelDescriptor:(PTChannelDescriptor *)channelDescriptor 
              forChannelUUID:(NSUUID *)channelUUID 
           completionHandler:(void (^)(NSError *error))completionHandler;
```
如下图所示，虽然下图 UI 我们无法自定义，但是系统UI中下面 channel name 和 image 都是我们配置的，而 channel status 会展示录音状态：当我们按住“Talk”启动录音，status 会展示录音中相关文案。



### 加入离开

- 加入 channel

通常，app 启动需要尽快加入到 channel，以便及时注册 APNs，如果 channel 已经存在，可以通过 channel manager 获取到缓存的 channel 信息（或者 app 自己维护的缓存），调用 channel manager 的 join 接口加入，加入的成功或失败通过相关代理方法得知：
```
/// 加入 channel接口：
- requestJoinChannelWithUUID:descriptor:

/// 加入 channel 成功的代理方法：
- channelManager:didJoinChannelWithUUID:reason:

/// 加入 channel 失败的代理方法：
- channelManager:didLeaveChannelWithUUID:reason:
这里加入chanenl的第二个入参 descriptor，可以定义这个 channel 的名字和图片，用于识别这个 channel，注意：requestJoinChannelWithUUID 接口只在前台期间调用是有效的。
```

- 离开 channel

通过 channel manager 的接口可以离开 channel，服务端也会相应更新这个成员的状态，以后不再推送相关会议消息给他。接口以及相关代理方法如下：
```
/// 离开 channel 接口：
- leaveChannelWithUUID:

/// 离开 channel 成功或失败的代理方法：
- channelManager:failedToJoinChannelWithUUID:error:

/// 离开 channel 失败的代理方法：
- channelManager:failedToLeaveChannelWithUUID:error:
```

### 配置推送

- 获取 token：加入 channel 成功后，将通过代理方法获取到用于注册 APNs 的 token
```
- channelManager:receivedEphemeralPushToken:
```
这个 token 只在 channel 生命周期内有效，即离开channel后，token就失效了。


- 注册 APNs：拿到 token 之后，我们需要通过服务端接口向苹果的 APNs 服务器注册，注册成功后，以后需要给这个 token 对应的设备发送推送消息时，就可以经由服务端发送请求来实现；


- 服务端在需要发送推送消息时，通过苹果 APNs 提供的 post 接口请求发送推送给对应iOS设备。


- 收到推送消息：推送消息包含推送类型、自定义消息等，从而通知UI更新对方正在说话状态、说话人名字、channel 图片等。通过下面代理方法可以获取到苹果 APNs 推送到客户端的推送消息：
- (PTPushResult *)incomingPushResultForChannelManager:(PTChannelManager *)channelManager 
                                          channelUUID:(NSUUID *)channelUUID 
                                          pushPayload:(NSDictionary<NSString *,id> *
跟其他 APNs 通知类似，我们可以配置推送消息的图片和标题。这里 push to talk 推送消息展示的时候，会展示 channel 的头像和名字，而这些信息正是前面配置 channel Description 时，配置到 APNs 中。
<div align=center>
<img src="https://github.com/SwiftOldDriver/WWDC22/blob/sesion_10117/sessions/session_10117/images/wwdc_ptt_desc.png" width="40%"/>
</div>

### 音频传输
发送音频有三个途径： 
1. PushToTalk.framework 系统的系统 UI，用于后台期间启动录音；
2. app 内自定义 UI，一般用于前台期间启动录音；
3. 蓝牙设备的录音操作，需要 app 自己来兼容蓝牙设备的接入，支持后台期间启动录音；

开始传输时，调用相关接口，系统就会解锁设备的麦克风，激活 app 的 Audio Session，开始录音， 接口和相关代理方法如下：
```
/// 请求开始传输音频接口
- (void)requestBeginTransmittingWithChannelUUID:(NSUUID *)channelUUID;

/// 音频传输成功的代理方法
- (void)channelManager:(PTChannelManager *)channelManager 
           channelUUID:(NSUUID *)channelUUID 
didBeginTransmittingFromSource:(PTChannelTransmitRequestSource)source;

/// 音频传输失败的代理方法
- (void)channelManager:(PTChannelManager *)channelManager 
failedToBeginTransmittingInChannelWithUUID:(NSUUID *)channelUUID 
                 error:(NSError *)error;
```

停止传输时，调用的接口和相关代理方法如下：
```
/// 请求停止传输音频接口
- (void)stopTransmittingWithChannelUUID:(NSUUID *)channelUUID;

/// 停止传输成功的代理方法
- (void)channelManager:(PTChannelManager *)channelManager 
           channelUUID:(NSUUID *)channelUUID 
didEndTransmittingFromSource:(PTChannelTransmitRequestSource)source;

/// 停止传输失败的代理方法
- (void)channelManager:(PTChannelManager *)channelManager 
failedToStopTransmittingInChannelWithUUID:(NSUUID *)channelUUID 
                 error:(NSError *)error;
```


### 状态更新
channel 的生命周期内，如果发生一些状态变化，需要通过相关接口更新一下：


- 参会人的名字或图片需要更新，使用这个接口：
```
- (void)setActiveRemoteParticipant:(PTParticipant *)participant 
                    forChannelUUID:(NSUUID *)channelUUID 
                 completionHandler:(void (^)(NSError *error))completionHandler;
```
- channel 的描述信息发生变化，使用这个接口：
```
- (void)setChannelDescriptor:(PTChannelDescriptor *)channelDescriptor 
              forChannelUUID:(NSUUID *)channelUUID 
           completionHandler:(void (^)(NSError *error))completionHandler;
```  
- channel 的网络连接状态或者跟服务端的连接状态变化，也需要及时通知系统，以便更新 UI：
```
- (void)setServiceStatus:(PTServiceStatus)status 
          forChannelUUID:(NSUUID *)channelUUID 
       completionHandler:(void (^)(NSError *))completionHandler;
```

### 处理干扰
<div align=center>
<img src="https://github.com/SwiftOldDriver/WWDC22/blob/sesion_10117/sessions/session_10117/images/wwdc_audiosession_airport.png" width="70%"/>
</div>
音视频通话场景，可能存在多种被打扰或打扰其他 app 的情况，就像一个繁忙的机场，总有很多飞机到达需要降落机场，可能还有突发情况需要协调避让，当正常的流程收到干扰时，需要特别处理，否则将影响用户体验：
1. 传输过程中，AVAudioSession 可能被其他源打断，打断时，我们的 AVAudioSession 将暂时被挂起，例如 pstn 电话或者 FaceTime 通话，这时需要处理一下这类打断：

<div align=center>
<img src="https://github.com/SwiftOldDriver/WWDC22/blob/sesion_10117/sessions/session_10117/images/wwdc_audio_session_interrupted.png" width="60%"/>
</div>

```
// interruption addObserver
[[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(audioSessionWasInterrupted:)
                                                 name:AVAudioSessionInterruptionNotification
                                               object:sessionInstance];
```
例如当播放被系统电话打断时，我们可以暂停播放，并在打断恢复之后，重新激活 AVAudioSession，并恢复播放。

2. 当 app 中存在多个模块使用，可能其他模块对 AVAudioSession 的设置不符合规范要求时，导致我们播放时，使用了错误的 catagory 或 mode，此时我们可以监听 AVAudioSession 的相关通知，感知 AVAudioSession 的错误配置：
```
// AVAudioSessionRouteChangeNotification  addObserver
[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleRouteChangeNotification:) name:AVAudioSessionRouteChangeNotification object:nil];
```
3. 当系统的音频服务被重置的时候，如果你需要对这种情况作出处理，需要监听AVAudioSessionMediaServicesWereResetNotification通知来处理，需要是实现以下操作

处理孤立的音频对象（如播放器，录音机，转换器或音频队列）并创建新的音频对象

重置正在跟踪的所有内部音频状态，包括所有属性 AVAudioSession

适当时，AVAudioSession 使用该 setActive:error:方法重新激活实例

减少对其他 app 的侵扰
当我们的“对讲机”收到语音消息准备播放时，需要确保不影响其他 app 的播放，例如其他音乐类 app 正在播放歌曲，在我们 app 在后台准备启动并播放语音时，需要检查 AVAudioSession 的 secondaryAudioShouldBeSilencedHint 属性，判断是否有 其他 app 在播放，如果有，并且这个 app 是 nonmixable 类型的catagory ，我们的 app 尽量不在此时播放语音消息。当我们的 app 在前台时，需要监听相关通知 AVAudioSessionSilenceSecondaryAudioHintNotification 来做类似的响应。

-----
## 其他注意点

### 优化重连
对于网络断开需要重连的情况，可以考虑使用 Network.framework 和 QUIC 来提高下次重建网络时的速度。

### 不需要自定义音效
系统提供了内置的声音效果来提示用户麦克风的可用和不可用，我们不要再针对这些事件增加声音效果了。


-----
参考链接

http://yunxin.163.com/blog/buildclubhouse/

https://developer.aliyun.com/article/781827

https://developer.apple.com/library/archive/documentation/Audio/Conceptual/AudioSessionProgrammingGuide/Introduction/Introduction.html#//apple_ref/doc/uid/TP40007875-CH1-SW1

https://developer.apple.com/videos/play/wwdc2022/110339/

https://developer.apple.com/videos/play/wwdc2021/10094/

https://developer.apple.com/videos/play/wwdc2019/707/

https://developer.apple.com/videos/play/wwdc2019/417

https://xie.infoq.cn/article/2cc7b6df1d2b26bfc02bd8a6f
