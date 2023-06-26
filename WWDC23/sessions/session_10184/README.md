---
session_ids: [10184]
---

# WWDC2023 - Meet ActivityKit/相遇实时小组件

本文基于 Session 10184 - Meet ActivityKit 梳理和扩展
作者信息:小杰瑞，猪场资深 iOS 开发工程师

## 0. 前言

Hi 大家好，我是小杰瑞，这篇文章主要是对 WWDC2023 `Meet ActivityKit` 这个 Session 做一个全面的梳理，并辅以一个 Demo 来方便大家熟悉和掌握快速适配一个实时小组件。主要内容包含了对于这个 Session 所提到的所有的核心内容，并在关键的一些步骤中稍加扩展(毕竟 Session 之间还是存在一定的联系的，而如果太割裂的来看效果不是很好)。

首先，先谈一下自己的一些感想。这期 Session 其实严格意义上不能算是全新的技术特性，锁屏实时小组件第一次出现是在 WWDC2022 中，但是碍于九月份才能发布灵动岛的 iPhone，Apple 也是把它藏到了九月份才发布了 ActivityKit 框架，开发者才开始能够进行全面的实时小组件的开发和设计。因此这篇 Session 更多的是对过去一年相关内容缺失的一个补充，正因为这个原因，去年的 Demo 其实用在今天的这篇文章中显得非常合适(摸鱼好理由)，但为了卷的更好看一点，硬生生的给去年的 Demo 加上了两个按钮，也算是有了一定的升级了。好了，废话到这里，开始我们的实时小组件之旅，希望对大家的适配和学习有一定的帮助。

## 1. ActivityKit 它是什么

在去年分享的一些文章或者视频的留言中，总会有小伙伴问我这个不就是一个通知么。说他是，锁屏里的它静静地在那里还确实很像通知，且文档中又明确的提到了它可以通过 Push 来驱动数据更新，但如果真的把它归为这个作用，又稍有违背 Apple 设计它的初衷。

首先来看一下 Apple 对于它的定义:

> Live Activities 是一个可以在 iPhone 或者 iPad 锁屏以及灵动岛上展示我们 App 核心内容的功能，这个入口可以让用户直达他正在进行的一个任务或者活动，并清晰的看到它的内容变化。

### 1.1 不仅仅是 iPhone，锁屏上的 Live Activities

这段描述相较于去年 7 月 28 日第一版文档是发生了变化的。没错，去年实时小组件是`仅iPhone`的，而在今年第一个变化就是支持了`iPad`。而在 iOS 平台上，同时也支持了`StandBy`模式。

![ipad_live](images/ipad_live.png)

![standby](images/standby.png)

而关于使用场景，举个例子，用户点了一杯咖啡的外卖，或者关注了一场自己喜欢球队的比赛，那外卖的进度、比赛的比分，这些关键的信息和用户的操作息息相关，那他们则将会是非常完美的呈现对象。如下图:

![live_demo_session](images/live_demo_session.png)

而实时小组件我认为和灵动岛属于是互相成就了。在丝滑动画的加持下，用户会更加喜欢这种能带来小惊喜的上岛体验。下面我们来看看灵动岛上的实时小组件的样子。

### 1.2 灵动岛上的 Live Activities

相对于锁屏堆叠放置的各家实时小组件(包涵自家 App 的多个实时小组件)来说，在灵动岛上的展示要复杂的多了，背后自然有 Apple 关于多个 App 登岛的逻辑，我们所需要做的或者说必须要做的，就是适配好所有尺寸的灵动岛上的视图。而关于尺寸，Apple 甚至在你新建`Target`时边为你搭好了所有代码，我们只需要在相应的代码块中塞进我们的视图就可以了。

单个 App :这一部分也叫做`compact` 紧凑型，分为前后两个 View 来组成。

![type-compact](images/type-compact~dark@2x.png)

多个 App 登岛，也叫做`minimal`型，一个紧贴摄像头，一个分离与摄像头，这里需要注意的是，看似这两个 View 长得不一样，但实质上都是一样的。我们也不要对多个 App 登岛时，我们自己 App 是前边的还是后边的做假设。

![type-minimal](images/type-minimal~dark@2x.png)

而长按灵动岛时，会变成展开模式，该模式下可以展示更多的内容，而当我们推送 Live Activity 为`Alert`模式时，同样也会触发展开样式。

![expanded-layout](images/expanded-layout~dark@2x.png)

基于上面实时小组件在不同平台上展示的图例，我们可以联想和脑洞一些能够上岛的功能点了。当然肯定不止下面我列举的这些，仅作为抛砖引玉之用:

1. 比赛直播类 App，实时的更新用户关心的比赛

2. 外卖、打车类 App，实时的更新外卖骑手进度、食物制作进度、司机到达情况

3. 上传、下载等任务的实时更新显示

4. 重大事件的持续跟踪报道，专题性质的新闻更新，24 小时热点新闻轮播

而在这儿，则要引出今年第二个新特性，也是今年整个`Widget`小组件主题最为让我惊喜的新特性了：添加更多的交互性，也就是我们可以在桌面小组件和实时小组件中增加按钮和切换键了(当然了仅有这俩组件可以，翻遍了 AppIntent 框架也搜不到第三了)，关于这个会在后边的 Demo 中稍有涉及，因为大部分的内容在《Bring Widgets to life》这个 Session 中，感兴趣的小伙伴可以去看那篇博文。

在第一部分的最后，还想提醒 2 个小 Tips，或者说再啰嗦 2 个小感想。

1. Live Activities 的实现依赖`SwiftUI`和`WidgetKit`，新特性用 SwiftUI，包括今年的 VisionOS，都可以看出 SwiftUI 的重要性，而结合我个人和一些同行的聊天，可以看出大厂在历史包袱的重压下或者快速迭代的压力下，也很难快速的转型 SwiftUI，甚至 Swift。小组件的出现和更迭便成为了一个很好的说服产品和领导们的理由，想适配么？那得先留点时间学 SwiftUI 丫！
2. 实时小组件的开启，需要明确的和用户操作相对应，切忌什么都上岛，在过去一年的实际体验当中，还是看到了一些不当用法的，遇到这种我是直接设置-关闭走起了。因此还是那句话，适配是好事儿，但硬凑或许真的适得其反。

## 2. Live Activities 的生命周期

在开始动手实现或者适配一个实时小组件功能前，我们有必要对其整个的生命周期做一个了解。开发者本质上需要做的主要有四件事儿，分别是:

1. 开启，开启前，比较好的做法是先 check 当前环境实时小组件功能是否可用
2. 更新，可以开启后台任务更新，也可以通过 Push 更新
3. 持续监听每一个开启的实时小组件的状态，并进行相应的逻辑处理
4. 结束，当比赛结束时，又或者外卖送到时，我们有义务关闭掉一个没有后续的小组件任务，虽然用户可以手动关闭，或者系统自动关闭，但如果我们处理的非常优雅，会带给用户非常不错的使用体验

在这里也是画了一个简图，来更好的说明我们需要做的工作，在后边的 Demo 中也会有详尽的代码加以描述:

![widgetKit](images/widgetKit.png)

## 3. 展示球赛比分的完整 Live Activities 实现之旅

在大致了解了实时小组件是什么以及它的生命周期之后，我们便可以打开~~产品文档~~开发文档进行实际的开发了。

[Live Activity 开发文档](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities)

本 Demo 基于`Xcode 15 Beta2`。

### 3.1 准备工作

由于是拿着去年的 Demo 进行的演示，因此在用新的 Xcode15 打开之后，需要稍微调整一下工程代码的，也就是需要做一些准备工作，其实就是编不过-，-，这里稍微扩展一丢丢:

大家在打开之前的 Widget SwiftUI 工程后，`command+option+p`激活 Xcode Preview 预览时，会遇到这个错误

![errorforfirst](images/errorforfirst.png)

原因是 Widget 今年支持了更多的平台，引入了`containerBackground`，可移除的背景容器修饰符，解决办法是创建 View Extension，来兼容一下即可，在要展示在 Widget 中的 View 加上这个修饰符。由于 Demo 中会填充队伍的主色调，因此这里显示 Clear

```swift
extension View {
     func widgetBackground() -> some View {
         if #available(iOS 17.0, *) {
             return containerBackground(for: .widget) {
                 Color.clear
             }
         } else {
             return background {
                 Color.clear
             }
         }
    }
}
```

而在使用的地方，尤其是需要 Xcode Preview 的 View 上添加该修饰符
![background](images/background.png)

### 3.2 创建 ActivityAttributes

无论是主 App 还是推送更新，我们和 ActivityKit 传输数据的媒介叫做`ActivityAttributes`，它由两部分组成，一部分数据自始至终都不会发生变化，静态的数据，而另一部分则是我们定义好的，用来告知 WidgetKit 数据发生了变化，需要重新绘制和存储 View。

```Swift
struct NBAWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var homeScore: Int
        var guestScore: Int
        var homeLike: Int
        var guestLike: Int
        var score: String?
        var time: TimeInterval
    }

    // Fixed non-changing properties about your activity go here!
    var home: NBATeam
    var guest: NBATeam
}
```

`ContentState`记录了实时小组件中将会变更的动态数据，例如两个队的得分情况、两个队的助力情况，以及比赛时间。而外部则定义了不会发生变化的两个球队的基础信息，包涵球队的名称、ID 等。而在开启小组件之后，更新数据传输只负责不断地生成新的`ContentState`,并告知 WidgetKit 即可更新我们的小组件视图。

### 3.3 绘制实时小组件 UI

下一步则是按照文档给出的需要适配的不同类型的 View，来定制业务 View，当我们新建`Widget Extension`并勾选`Live Activity`之后，Xcode 会非常贴心的给我们安排了一个完形填空，下图为 New -> Target -> 勾选 Live

![createLive](images/createLive.png)

大致长这个样子，实例代码中给出了详细的注释，然后耐心的完形填空即可。

```Swift
struct DemoWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DemoWidgetAttributes.self) { context in
            // 锁屏/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // 展开 UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L") //紧凑型前边View
            } compactTrailing: {
                Text("T \(context.state.emoji)") //紧凑型后边View
            } minimal: {
                Text(context.state.emoji) //多App上岛后的mini
            }
            .widgetURL(URL(string: "http://www.apple.com"))//点击跳转
            .keylineTint(Color.red)
        }
    }
}
```

这里主要的工程 Demo 代码不再展开，感兴趣的小伙伴可以去我的 Github 上下载到 Demo。下图为 Demo UI 的一个拆分:

![demoUI](images/demoUI.png)

首次出现时，会出现一个是否允许 XXX App 的实时活动的提醒的，用户可以像操作通知一样左滑删除掉我们创建好的 Live Activities。下图为 Demo 的一个 GIF 演示:

![demoGif](images/demoGif.gif)

### 3.4 根据业务逻辑实现 Live Activities 的生命周期

这里先补充一个细节，那就是我们的 App 不止可以激活一个实时小组件的，例如世界杯期间，同一时间可能同时进行 2 场比赛，而用户则是可以同时激活这两场比赛的实时小组件的。因此关于实时小组件的管理，个人建议是实现一个类似 Manager 一样的管理类，通过数组等方式来进行管理，而对应的 API，都会返回给我们相应的`Activity<Attributes>`实例。注:本 Demo 为了演示，仅保存一个小组件实例。

首先的首先，我们要引入`ActivityKit`, 这是这篇文章的核心 -。-

#### 3.4.1 开启普通 Live Activities

特别要注意一点的是，开启 Live Activities 需要我们的 App 保持在前台，其实这也和 Apple 推荐的 Live Activities 最佳实践是保持一致的，既实时小组件是用户非常主动的开启的一个任务或者事件。

实时小组件的更新方式有两种，一种是端内触发，一种是 Push 触发，其实还有一个，留个悬念后边说。我们先看端内触发的情况，此时开启 Live Activities 的方式如下:

```swift
self.statusActivity = try Activity<NBAWidgetAttributes>.request(attributes: attribute, contentState: startState, pushType: nil)
```

此时`PushType`参数传 nil。`attributes`参数则为上面我们定义好的 ActivityAttributes，`contentState` 参数则是我们定义好的一个初始状态。例如，初始是湖人对阵勇士的比赛，我们分别模拟两个球队的数据(Demo 使用，测试数据)，并模拟了一个主队 12:10 领先的开启状态。

```swift
let guestTeam = MatchDataManager.shared.teams.filter { $0.teamId == "Lakers" }.first!
let homeTeam = MatchDataManager.shared.teams.filter { $0.teamId == "Warriors" }.first!
let attribute = NBAWidgetAttributes(home: homeTeam, guest: guestTeam)
let date = Calendar.current.date(byAdding: .minute, value: (11), to: Date())!.timeIntervalSince1970        
let startState = NBAWidgetAttributes.ContentState(homeScore: 12, guestScore: 10,homeLike: homeTeam.likeNum,guestLike: guestTeam.likeNum, tips: "Q1", score: nil, time: date)
```

创建完成之后，便可以调用上面的`Request`方法，来进行实时小组件的开启了。当然！我这么做是十分不严谨的，应该在开启前，先 check 当前环境功能是否开启，例如用户已经主动关闭了我们实时小组件的设置内的权限，则开启也是白开启。

```swift
//check
guard ActivityAuthorizationInfo().areActivitiesEnabled else {
     print("当前设备不可用Live Activities，用户关闭或者设备无法使用")
     return
}   
```

#### 3.4.2 开启 Push Live Activities

与 3.4.1 几乎一致，只不过`PushType`参数需要传进去`.token`，并且在适当的时候拿到 Push Token，给到我们的后台，后台便可以拿着这个 Push Token 来发送通知。这里有几点需要额外注意:

1. request API 不会立刻返回带有 Token 的 Activities 实例，我们需要起一个 Task 来监听 Push Token 的回调，来给到我们的后台。
2. 此 Token 并不是我们 App 启动注册的 Token，需要区分，后台同学需要知晓他们之间的不同
3. 实时小组件的 Push 和 App 正常的远程 Push 非常容易造成混淆，本质上其实是两种实现的方式；且实时小组件的开关并不依赖系统设置中自己 App 的 Push 推送开关，也就是说当用户关闭了主推送开关时，只要授权了实时小组件的功能权限，我们依然可以通过 Push 的方式来驱动实时小组件的更新
4. Token 会变化，客户端需要监听 Token 的变化来及时的通知后台
5. 一定要是 Token-Base 链接形式的 Push 发送

下面代码为客户端开启 Activities 后，更新 Token 给到后台

```swift
Task {
    for await tokenData in activities.pushTokenUpdates {
    let pushTokenString = String(deviceToken: tokenData)
    print("\(activities.id)新Token:\(String(describing: pushTokenString))")
                   
    //发送这个ID和Token给后台服务器
    UploadManager().uploadToken(tokenString: pushTokenString)
    } 
}
```

具体的 Push 更新和结束实时小组件可以参考这篇文档：[利用 Push 来更新 Live Activities](https://developer.apple.com/documentation/ActivityKit/updating-and-ending-your-live-activity-with-activitykit-push-notifications) 以及[Session 10185: Update Live Activities with push notifications](https://developer.apple.com/videos/play/wwdc2023/10184)

这里简单的贴出一个测试的 APNS 数据，`event`字段用来标志此条是更新还是结束，`content-state`则和我们刚才定义的 ActivityAttributes 要一一对应。

```
{
    "aps": {
        "timestamp": 1660556374,
        "event": "end",
        "content-state": {
            "estimatedEndTime": 1660559974,
            "homeScore": 2,
            "guestScore": 2,
            "halfInfo": "下半场"
        }
    }
}
```

#### 3.4.3 更新 Live Activities

当比分发生变化时，我们需要主动的更新实时小组件的 UI，调用 Update 方法，不再需要传递静态的球队数据，仅关心动态的一些数据。

```swift
let updateState = NBAWidgetAttributes.ContentState(homeScore: 22, guestScore: 10, homeLike: homeTeam.likeNum, guestLike: guestTeam.likeNum, tips: "Q1", score: nil, time: date)
Task {
  await self.statusActivity?.update(using: updateState)
}
```

在更新前，我们最好 check 一下本地存储的所有 Activities 实例的状态，如果已经是不可用了，则及时清除:

```swift
let activityState = activity.activityState
if activityState == .dismissed {
    self.cleanUpDismissedActivity()
}
```

#### 3.4.4 关闭 Live Activities

就像开篇所说，优雅的帮用户关闭无用的实时小组件，可以极大的提升用户的使用体验。因此在一场比赛结束后，我们可以主动的关闭我们开启过的 Live Activities:

```swift
public func endLiveActivities() -> Void {
    Task {
        let date = Calendar.current.date(byAdding: .minute, value: (12), to: Date())!.timeIntervalSince1970
        let endState = NBAWidgetAttributes.ContentState(homeScore: 94, guestScore: 102, homeLike: 100 ,guestLike: 200 ,tips: "Finished", score: nil, time: date)
        await self.statusActivity?.end(using: endState,dismissalPolicy: .default)//+4h
        //await self.statusActivity?.end(using: endState,dismissalPolicy: .immediate)//立刻结束
        //await self.statusActivity?.end(using: endState,dismissalPolicy: .after(Date().addingTimeInterval(60 * 60)))//一小时之后结束
        }
    }
}
```

在 Demo 当中，我们将最终的比分传递给 Activity 框架，以确保用户看到的是最后的比分状态，并清楚的在 UI 上显示 Finished。而关于 API 当中`dismissalPolicy` 的含义，参考文档可以总结为:
1. `.default` 系统对于实时小组件`默认`的消失策略，当我们设置这个参数时，系统会继续保持我们的实时小组件最长 4 个小时的展示，或者被用户主动清除掉；而在文档中，我们可以看到一个实时小组件最长可以停留八个小时，也就是理论上，我们的小组件可以存在 8+4=12 个小时
2. `.immediate` 会立即结束我们实时小组件的展示，使用这个可能会让用户失去瞥见最后信息的机会
3. `.after(someDate)` 我们可以通过设置这个参数来制定消失实时小组件的时机，需要注意的是，这个策略也需要传入最长 4 个小时的窗口，如果大于这个时间，系统会在 4 小时时清除掉我们的小组件

当用户主动清除锁屏中的实时小组件时，我们又该做什么呢:
1. 首先，移除实时小组件不等于取消当前任务，例如外卖类的实时小组件，被移除不代表我们要`cancel` 掉这份外卖(用户会被气疯的吧。。。)
2. 端内可以通过`self.statusActivity?.activityState` 来主动获取我们创建出的小组件实例的状态，当发现是`dismissed`时，则意味着不需要再更新它了，可以在我们的数据管理 Manager 中做移除

### 3.5 给实时小组件增加一个按钮

在 iOS17 之前，实时小组件通过`widgetURL`来进入 App 指定的页面来进行后续的操作，略显繁琐，而在 iOS17 我们可以借助`AppIntent`的力量来实现增加按钮和切换键 (Toggle) 这两个组件来丰富我们的功能。

```swift
struct likeAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Configuration"
    static var description = IntentDescription("This is an example widget.")

    // An example configurable parameter.
    @Parameter(title: "Like")
    var teamId: String
    
    init() {
        
    }
    
    //to hold data
    init(teamId: String) {
        self.teamId = teamId
    }
    
    func perform() async throws -> some IntentResult {
        if let index = MatchDataManager.shared.teams.firstIndex(where: {
            $0.teamId == teamId
        }) {
            let resultTeam = MatchDataManager.shared.teams[index];
            resultTeam.likeNum += 10
            NBALiveTrigger.shared.updateLiveActivitiesLAVSWA()
        }
        
        return .result()
    }
}
```

我们定义了一个`LikeAppIntent`的助力 Intent，将球队 ID 进行保存，实现 Perform 协议方法，并找到模拟的球队数据，将他们的点赞数加 10，这里触发了上面 Live Activities 管理类中的更新方法，来更新我们的实时小组件。

而在我们的 Widget UI 中，加入按钮也是十分的简单，如下代码所示，Button 新增了一个构造方法，引入`AppIntents`框架，即可传入我们定义好的`favorAppIntent`，当该按钮被点击时，触发我们写好的 Perform 程序

```swift
                    if #available(iOS 17.0, *) {
                        HStack {
                            Text(likeNum.formatted())
                                .foregroundColor(.white)
                                .contentTransition(.numericText())
                            Button(intent: favorAppIntent(teamId: team.teamId)) {
                                Image(systemName: "hand.thumbsup")
                                    .foregroundColor(.white)
                            }
                            .buttonStyle(.plain)
                        }
                    } else {
                    //仅展示其他UI
                    }
```

这里需要注意判断系统版本，这是一个仅 iOS17+ 的功能。

### 3.6 息屏处理

锁屏时，一段时间后，屏幕会进入到息屏状态，而此时，我们的 UI 表现可能会很糟糕，因此我们可以通过`isLuminanceReduced`环境变量来拿到此时的机器状态，从而从容的来设置我们的 UI 表现。因此，我简单封装了一个 View Extension：

```swift
struct LuminanceReducedColor: ViewModifier {
    var foregroundColor: Color
    @Environment(\.isLuminanceReduced) var isLuminanceReduced
    func body(content: Content) -> some View {
        if isLuminanceReduced {
            content.foregroundColor(.white)
        } else {
            content.foregroundColor(foregroundColor)
        }
    }
}

extension View {
    func luminanceReducedColor(color: Color) -> some View {
        modifier(LuminanceReducedColor(foregroundColor: color))
    }
}
```

当息屏时，文字等颜色变为白色，更加便于辨认。

## 4. 已有 Widget 工程如何加入 Live Activities

对于已经拥有了 Widget Extension 的工程，我们同样也可以快速支持 Live Activities。

首先我们需要在 Widget Extension 中 新建一个 Swift 文件，并引入`ActivityKit`框架, `WidgetKit`框架以及`SwiftUI`框架，然后则需要创建`ActivityAttributes` 来定义实时小组件的传输数据媒介。

然后我们需要创建一个 Widget Struct 来声明我们所要实现的实时小组件 Widget:

```swift

    var body: some WidgetConfiguration {for: DemoWidgetAttributes.self} dynamicIsland: { context in
            DynamicIsland {...} compactLeading: {...} compactTrailing: {...} minimal: {...}
            .widgetURL(URL(string: "http://www.apple.com"))//点击跳转
    }

```

最后我们需要使用`WidgetBundle`来将刚才定义好的 Widget 加入进去，系统才会识别我们有一个实时小组件可用:

```swift

@main
struct DemoWidgetBundle: WidgetBundle {
    var body: some Widget {
        DemoWidget()
        DemoWidgetLiveActivity() //刚才定义好的新的实时小组件
    }
}

```

## 5. 你可能还会需要了解的 TIPS

1. [Live Activities 人机交互指南](https://developer.apple.com/design/human-interface-guidelines/live-activities)
2. 无论你采用什么方式更新，数据量都不能大于 4KB
3. Live Activities 可以独立于 Widget 小组件，但 Apple 建议实时小组件都搞了，不差 Widget 了，再做一个
4. Info.plist 文件需要添加 NSSupportsLiveActivities == YES
5. 锁屏中 UI、灵动岛展开 UI 如果超过 160points，系统有可能会裁切我们的 View
6. StandBy 模式，是采用我们的 Lock Screen 的 UI 来填充展示
7. 一个 App 可以开启多个 Live Activities，而一台设备可以开启多个 App 的多个 Live Activities，不要对这个数量作出假设，也不要对岛上出现的时机和顺序或者位置做出假设
8. 在开启、更新等重要时机前，我们应该处理当 Live Activities 不可用时的错误，给予用户友好的提示
9. Push 暂时是无法开启 Live Activities 的

## 6. 小结

虽然实时小组件出现到现在的时间不长，但它可以快速拉进用户和 App 之间的距离，并能将用户最关心的任务和信息展示在锁屏和灵动岛等比较重要的系统 UI 中，这些优点会随着更多第三方应用的适配而无限放大。但与此同时，滥用它的特性也一定会被用户甚至 Apple 所嫌弃。因此如何精简出自己 App 适合上岛的功能点，我觉得要比如何适配如何实现更加的重要，毕竟总览 Live Activities 的实现，Apple 已经几乎做到手把手了，如果之前有过桌面小组件开发经验的同学，或者 SwiftUI 相关经验的同学，上手起来会非常的快。

那关于这期 Session 的梳理就到这里，希望对大家有所帮助。

[本篇 Demo 地址](https://github.com/jerryliurui/Live-Activities-Demo-NBA-Score)

