# Watch OS 8 中的新特性

> 作者 kk，字节跳动啥缺人做啥的开发。前端、后端、客户端都会写一点，也都不擅长
> 本文基于[session 10009](https://developer.apple.com/videos/play/wwdc2021/10009/)以及 [session 10002](https://developer.apple.com/videos/play/wwdc2021/10002/)整理。 

# 前言

本文包含两个内容：

1. Watch OS 8 新特性介绍
2. 结合Swift UI构建一个健身类应用。

# Watch OS 8 新特性

下面给大家介绍下 watch OS 8 的一些新特性和新功能。为了让大家不会看了简要介绍就不看文章了，这里非常简单的列一下大概的内容。提前剧透下：看完后我马上把 -多- 年没用的 S6 重新掏了出来。

- 常亮显示
- 健康数据
- 蓝牙
- 位置信息
- 其他的新功能

## 常亮显示(Always-On display)

常亮显示是在 watch OS6 中发布的新功能，但是之前支持的是系统级别的常亮显示，当放下手腕手表进入常亮显示状态时，APP 的界面会变的模糊，从而突出系统的时间展示（如图）

![29356629-71B4-4F99-B39D-F1D643740FB1](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/29356629-71B4-4F99-B39D-F1D643740FB1.png)

Watch OS 8 的重点是提升 App 的使用体验，因此在 Wacth OS 8 中，苹果让 App 也具有了常亮显示的功能。

### 最佳实践

我们先来看看可以通过常亮显示做出什么效果：

![9E694CD2-E88E-4BAC-A089-2CEDC9136C58](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/9E694CD2-E88E-4BAC-A089-2CEDC9136C58.png)

在常亮显示状态下，整体的亮度会变低。同时淡化了很多高亮颜色的显示，像是按钮的颜色，数字输入框的边框。让整体看起来不是特别的显眼。

![5B39174F-1EB0-40F8-AEE6-C3C8FC9672C2](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/5B39174F-1EB0-40F8-AEE6-C3C8FC9672C2.png)

在这个例子中，我们突出了操作相关的 UI，把次要的背景图隐藏了。

![8CED83F3-673A-4F55-B911-B9BB22FFF1BF](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/8CED83F3-673A-4F55-B911-B9BB22FFF1BF.png)

这又是个非常适合常亮显示的例子。在用户放下手腕的时候。我们可以隐藏一些敏感的信息，例如用户的财务信息、健康信息等。

### 代码实现

上文展示了几个通过在APP 中应用常亮显示的例子，那我们该如何在代码中实现这种效果。其实很简单, watch OS 8 中引入了一个新的环境变量 `isLuminanceReduced` 用于告诉我们当前用户手表的一个状态。

![84BB3C8F-7B39-4C36-B759-0375EB089AFE](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/84BB3C8F-7B39-4C36-B759-0375EB089AFE.png)

通过这个变量我们可以很方便的在 SwiftUI 中绘制不同状态下的手表视图表现形式。

### 常亮显示下的视图更新

既然已经支持了 APP 的常亮显示状态，显然我们也需要在此状态下更新下视图。接下来我们介绍下常亮显示状态下的应用视图如何更新。

![7A174616-D4C2-4357-A1C4-421797DA6128](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/7A174616-D4C2-4357-A1C4-421797DA6128.png)

在手表活跃状态下，我们可以每秒更新一次视图。而在非活跃状态，我们允许 APP 一分钟更新一次视图。

>  watch OS 的 APP 默认会在处于非活跃状态 2 分钟之后返回手表主页，但用户可以更改这个设置，我们可以假定这里会显示超过 2 分钟。  

在代码中我们需要通过  `TimelineView` 来告知手表我们应用的视图更新计划。

```swift
TimelineView.init(Schedule, content: (TimelineView<Schedule, Content>.Context) -> Content)
```

`TimeLineView`接受一个 `Schedule` 的参数来控制视图的更新频率，同时提供一个闭包来返回一个需要更新的视图。例如我们可以通过一下方式来更新一个钟表视图:

```swift
TimelineView(PeriodicTimelineSchedule(from: startDate, by: 1.0)) { context in

  ClockTimerView(

​    date: context.date,

​    showSeconds: context.cadence <= .seconds)

}
```

上述代码的意思是我们每隔 1 秒更新一次`ClockTimerView`，同时将时间信息传入 `ClockTimeView` 。当更新节奏 `cadence` 小于秒级的时候，视图不展示秒数。

> cadence 代表更新节奏，例如正常显示状态下的是连续更新(.live)而常亮显示的活跃状态是几秒更新一次(.seconds)，非活跃状态下就要变成几分钟一次(.minutes)。  

其中`Schedule`有以下三种：

* [EveryMinuteTimelineSchedule](doc://com.apple.documentation/documentation/swiftui/everyminutetimelineschedule?language=swift) 

![4638CFDB-E8AF-4872-8EEA-39C6BD7F396A](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/4638CFDB-E8AF-4872-8EEA-39C6BD7F396A.png)

每分钟更新一次，和系统时针保持一次，即每次更新都在系统时针的头部发生。

* [PeriodicTimelineSchedule](doc://com.apple.documentation/documentation/swiftui/periodictimelineschedule?language=swift)

![B190AA1A-94B7-4ADB-96E9-66AB38EEFF00](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/B190AA1A-94B7-4ADB-96E9-66AB38EEFF00.png)

允许设定更新间隔，例如 2 分钟一次，2.5 分钟一次。p.s：如果使用`PeriodicTimeLineSchedule`即使设置 1 分钟一次，也不会和系统时针保持一致。

* [ExplicitTimelineSchedule](doc://com.apple.documentation/documentation/swiftui/explicittimelineschedule?language=swift)  

![BA958A2A-9ACC-4240-BD33-25FEFB6B7E62](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/BA958A2A-9ACC-4240-BD33-25FEFB6B7E62.png)

允许指定特定的更新时机，例如 1.5 分钟的时候更新一次，4 分钟的时候更新第二次。

## 健康数据

Watch OS 8 中允许 APP 在后台更新健康数据。当 `HealthKit` 产生了新的健康数据且和你 APP 设定的关心数据一致时，手表会唤醒你的 App 并传递相关的数据。

![704B9E1E-B97A-47BC-AD7B-51A6C1C8550D](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/704B9E1E-B97A-47BC-AD7B-51A6C1C8550D.png)

App 一小时会收到一次结果，但如果用户将你的 APP 当做复杂功能添加到活跃表盘的时候，你的 APP 将会在一小时收到四次数据。这些数据刷新都会占用你 APP 的后台刷新预算。



![7F38348F-6877-4F2A-BDD7-4873E894B7E7](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/7F38348F-6877-4F2A-BDD7-4873E894B7E7.png)

对于包括跌倒事件、低血氧饱和度、心率事件之类比较重要的数据，手表会马上将数据发送给 App，而其余并不是非常重要的数据则会一小时真是更久传递一次。

## 蓝牙链接

在 watch OS 8 中，将允许 APP 在后台期间链接到蓝牙设备获取到相关的数据

![DD3250FB-9DC4-4340-A699-085260C1D380](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/DD3250FB-9DC4-4340-A699-085260C1D380.png)

这是 Qardio ，通过连接用户的心电图检测设备来检测用户的心脏状态。

![4243F010-7ABE-49DD-A4BD-FFE21E1CAE48](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/4243F010-7ABE-49DD-A4BD-FFE21E1CAE48.png)

当我们将 Qardio 添加到复杂功能时，他可以在后台连接到对应的蓝牙心电图设备，然后更新相应的心电图信息。与上文的健康数据后台刷新一样，该操作一小时只能触发四次，同时也会占用 APP 的后台刷新预算。

## 基于地理位置的通知

![7EF83A59-857E-4EEE-8E2B-449258F69EC3](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/7EF83A59-857E-4EEE-8E2B-449258F69EC3.png)

在手表可以独立运行之后，用户经常会带着手表去做很多事，例如去喝咖啡、上网、购物。在watch OS 8 中，手表可以基于用户所处的区域给用户发送对应的通知。

例如：当你在升降机上时，提醒你使用 SLOPES(国外的健身 App) 开始滑雪锻炼。当到机场的时候，使用 APP IN THE AIR 接收航班信息。

![3CD5A99D-AA5C-4579-96DC-84734E13201F](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/3CD5A99D-AA5C-4579-96DC-84734E13201F.png)

用户需要开启`When in use`的地理位置权限才会收到通知，一开始会收到一条预设好的本地通知，点击后才可以查看完整的动态通知。

并且用户可以限制只有到关注的几个地点时才接受通知，当区域半径设置为200m左右的时候，效率最高。



![7CAD8947-2B87-4608-B315-4700FDB97298](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/7CAD8947-2B87-4608-B315-4700FDB97298.png)

Location 还提供了一个增强功能 `Location Button` ，让用户无需在获取单次地理位置的时候都要确认单次的地理位置授权弹窗，只需要点击此按钮，即可获取单次地理位置信息。

## 其他的功能增强

![FCF0019D-DA1F-4EF6-BF80-915246E6B317](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/FCF0019D-DA1F-4EF6-BF80-915246E6B317.png)

1. 增加了呼吸频率的记录，可以在睡眠期间记录呼吸频率

2. 引入了`无障碍访问`(Assistive Touch)，帮助有肢体障碍的人更好的使用手表。

3. 更大的无障碍文本尺寸，方便有视听障碍的人士更好的使用手表。

4. 加了单元测试功能（哭~

5. 滑动视图的Large Title(大字标题)



![20E4DBC0-F3E4-4E0F-9594-C2915F25C55E](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/20E4DBC0-F3E4-4E0F-9594-C2915F25C55E.png)

6. 改进了文本输入

   ![805C1A1C-23EE-441B-8E7F-A1E443F1C8EE](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/805C1A1C-23EE-441B-8E7F-A1E443F1C8EE.png)

7. 新的搜索 API， 让你可以更轻松的把字段加到应用程序。

8. 列表左滑删除

9. 新的按钮类型~
10. 更强大的画布



## 说点啥

可以看出本次 watch OS 8 的更新没有引入特别重大的更新，都是一些提升 APP 体验的功能，对于大多数人来说可能影响不大，对于我来说更是毫无吸引力~可能稍微感兴趣的就是睡眠的呼吸频率分析(失眠患者又多了个数据可以看）

# 构建一个训练应用

在此Session中，苹果工程师会带我们从0到1的构建一个健身类APP，因为整体代码难度不高，APP也比较简单，我不会完全按照苹果工程师循序渐进的一个顺序来构建这个 APP。如果感兴趣的朋友建议从头完整看下视频（极易上手）



下面我们将会按照下面的框架去解析如何构建一个健身类应用：

1. 展示这个APP的功能。

2. 分析各个模块所需要实现的功能和数据流转。

3. 数据管理器、视图的实现简单分析。



## 功能展示 

![watch1](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/watch1.gif)

## 功能实现

从上面的 GIF 图中可以看出这是一个很简单的 Watch 应用，他包含四个界面，其中一个音乐播放页是用`NowPlayingView`直接实现的，我们不做详细讲解

![D47D1F51-6B71-4071-B908-97136F2A9611](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/D47D1F51-6B71-4071-B908-97136F2A9611.png)

所以这个应用包含了四个界面。分别为：训练选择页(StartView)、训练指标展示页(MertricsView)、训练结果汇总页(SummaryView)以及训练状态控制页(ControlView)。同时需要一个 `pagingView` 来做四个页面的容器，最后需要一个数据管理器(WorkoutManager)用来管理各个视图的数据和状态变更。

根据上述动图的展示，我们可以概括出这几个模块大概要提供什么功能：

![B934D836-3A51-4F97-85C4-2A820C5946FC](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/B934D836-3A51-4F97-85C4-2A820C5946FC.png)从上图的模块功能图里可以看出，这个 App 的功能还是比较简单的。`WorkoutManager`承担了 Controller 和 Model 的作用，把各个视图之间的数据流转和页面切换(状态变更)串连起来。

![E691DBC6-02F3-4025-987F-C84D4FE3DA54](/Users/lucca/Lucca/WWDC21/session-10104-lucca/images/E691DBC6-02F3-4025-987F-C84D4FE3DA54.png)

## 代码实现浅析

因为代码实现比较简单，所以会简单分析下各个模块的一些状态、数据提供的实现，大家感兴趣可以自行下载完整代码学习

[下载地址](https://docs-assets.developer.apple.com/published/9e97282099/BuildAWorkoutAppForAppleWatch.zip)

### WorkoutManager

1. 数据源初始化

```swift
// HealthKit 存储，获取健康数据，需要获取健康数据查看权限

let healthStore = HKHealthStore() 

// WatchKit 提供的训练会话，方便开发者构建训练引用

// 当选择了对应的活动的时候，Session会把对应的训练数据通过delegate传

// 递过来，例如选择了室内训练，会传递心跳。选择了骑行会传递地理位置信息。

var session: HKWorkoutSession? 

// HKWorkoutSession的属性，可以实时获取训练过程中的指标信息。

var builder: HKLiveWorkoutBuilder?


```

2. 数据源提供

```swift
// MARK: - HKWorkoutSessionDelegate

// 训练结束的时候，将训练结果的信息workout保存起来，以便SummaryView获取相关的训练结果信息

extension WorkoutManager: HKWorkoutSessionDelegate {

func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState,

​            from fromState: HKWorkoutSessionState, date: Date) {

​    DispatchQueue.main.async {

​      self.running = toState == .running

​    }



​    // Wait for the session to transition states before ending the builder.

​    if toState == .ended {

​      builder?.endCollection(withEnd: date) { (success, error) in

​        self.builder?.finishWorkout { (workout, error) in

​          DispatchQueue.main.async {

​            self.workout = workout

​          }

​        }

​      }

​    }

  }



  func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {



  }

}



// MARK: - HKLiveWorkoutBuilderDelegate

// 实时获取训练过程中的运动数据，方便MetricsView展示

extension WorkoutManager: HKLiveWorkoutBuilderDelegate {

  func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {



  }



  func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {

​    for type in collectedTypes {

​      guard let quantityType = type as? HKQuantityType else {

​        return // Nothing to do.

​      }



​      let statistics = workoutBuilder.statistics(for: quantityType)



​      // Update the published values.

​      updateForStatistics(statistics)

​    }

  }

}
```



4. 开始训练

```swift
// 开始训练

func startWorkout(workoutType: HKWorkoutActivityType) {

  let configuration = HKWorkoutConfiguration()

  configuration.activityType = workoutType

  configuration.locationType = .outdoor



  // 使用HealthStore创建 HKWorkoutSession 用于获取每次运动结束的结果
  // 从 HKWorkoutSession 中的 associatedWorkoutBuilder 实时获取运动过程的指标信息

  do {

​    session = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)

​    builder = session?.associatedWorkoutBuilder()

  } catch {

​    return

  }



  // 设置代理

  session?.delegate = self

  builder?.delegate = self



  //设置数据源

  builder?.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore,

​                         workoutConfiguration: configuration)



  // 传入一个开始时间开始运动

  let startDate = Date()

  session?.startActivity(with: startDate)

  builder?.beginCollection(withStart: startDate) { (success, error) in

  }

}
```



4. 训练状态管理

``` swift
// 当前的训练状态 

@Published var running = false

//暂停/恢复事件

func togglePause() {

  if running == true {

​    self.pause()

  } else {

​    resume()

  }

}



func pause() {

  session?.pause()

}



func resume() {

  session?.resume()

}

// 结束训练

func endWorkout() {

  session?.end()

  showingSummaryView = true

}

```

## StartView

```swift
struct StartView: View {

  @EnvironmentObject var workoutManager: WorkoutManager

  var workoutTypes: [HKWorkoutActivityType] = [.cycling, .running, .walking]



  var body: some View {

​    List(workoutTypes) { workoutType in

​      NavigationLink(workoutType.name, destination: SessionPagingView(),

​              tag: workoutType, selection: $workoutManager.selectedWorkout)

​        .padding(EdgeInsets(top: 15, leading: 5, bottom: 15, trailing: 5))

​    }

​    .listStyle(.carousel)

​    .navigationBarTitle("Workouts")

​    .onAppear {

​      workoutManager.requestAuthorization()

​    }

  }

}
```

简单的列表页，展示可选的训练类型，选择后跳转到`PagingView`开始训练。



## ControlsView

```swift
var body: some View {

​    HStack {

​      VStack {

​        Button {

​          workoutManager.endWorkout()

​        } label: {

​          Image(systemName: "xmark")

​        }

​        .tint(.red)

​        .font(.title2)

​        Text("End")

​      }

​      VStack {

​        Button {

​          workoutManager.togglePause()

​        } label: {

​          Image(systemName: workoutManager.running ? "pause" : "play")

​        }

​        .tint(.yellow)

​        .font(.title2)

​        Text(workoutManager.running ? "Pause" : "Resume")

​      }

​    }

  }
```

使用 SwiftUI 绘制了两个按钮，对应的按钮会调用`WorkoutManager`的对应事件(暂停/恢复 训练，结束训练)。

## MetricsView

1. 视图内容

```swift
struct MetricsView: View {

@EnvironmentObject var workoutManager: WorkoutManager



var body: some View {

  //新特性中提到的TimelineView，接收一个Schedule来进行视图的更新

  TimelineView(MetricsTimelineSchedule(from: workoutManager.builder?.startDate ?? Date())) { context in

​    VStack(alignment: .leading) {

  // 当更新节奏是实时更新时，展示毫秒，否则不展示

​      ElapsedTimeView(elapsedTime: workoutManager.builder?.elapsedTime ?? 0, showSubseconds: context.cadence == .live)

​        .foregroundStyle(.yellow)

​      Text(Measurement(value: workoutManager.activeEnergy, unit: UnitEnergy.kilocalories)

​          .formatted(.measurement(width: .abbreviated, usage: .workout, numberFormat: .numeric(precision: .fractionLength(0)))))

​      Text(workoutManager.heartRate.formatted(.number.precision(.fractionLength(0))) + " bpm")

​      Text(Measurement(value: workoutManager.distance, unit: UnitLength.meters).formatted(.measurement(width: .abbreviated, usage: .road)))

​    }

​    .font(.system(.title, design: .rounded).monospacedDigit().lowercaseSmallCaps())

​    .frame(maxWidth: .infinity, alignment: .leading)

​    .ignoresSafeArea(edges: .bottom)

​    .scenePadding()

  }

}

}
```

2. 视图更新计划

```swift
private struct MetricsTimelineSchedule: TimelineSchedule {

  var startDate: Date



  init(from startDate: Date) {

​    self.startDate = startDate

  }

   

  func entries(from startDate: Date, mode: TimelineScheduleMode) -> PeriodicTimelineSchedule.Entries {

// 根据当前的更新频率，确定更新的时间间隔。

​    PeriodicTimelineSchedule(from: self.startDate, by: (mode == .lowFrequency ? 1.0 : 1.0 / 30.0))

​      .entries(from: startDate, mode: mode)

  }

}
```



##  SummaryView



```swift
struct SummaryView: View {

  @EnvironmentObject var workoutManager: WorkoutManager

  @Environment(.dismiss) var dismiss

  @State private var durationFormatter: DateComponentsFormatter = {

​    let formatter = DateComponentsFormatter()

​    formatter.allowedUnits = [.hour, .minute, .second]

​    formatter.zeroFormattingBehavior = .pad

​    return formatter

  }()

   

  var body: some View {

​    if workoutManager.workout == nil {

​      ProgressView("Saving Workout")

​        .navigationBarHidden(true)

​    } else {

​      ScrollView {

​        VStack(alignment: .leading) {

​          SummaryMetricView(title: "Total Time",

​                   value: durationFormatter.string(from: workoutManager.workout?.duration ?? 0.0) ?? "")

​            .foregroundStyle(.yellow)

​          SummaryMetricView(title: "Total Distance",

​                   value: Measurement(value: workoutManager.workout?.totalDistance?.doubleValue(for: .meter()) ?? 0,

​                             unit: UnitLength.meters)

​                    .formatted(.measurement(width: .abbreviated,

​                                usage: .road,

​                                numberFormat: .numeric(precision: .fractionLength(2)))))

​            .foregroundStyle(.green)

​          SummaryMetricView(title: "Total Energy",

​                   value: Measurement(value: workoutManager.workout?.totalEnergyBurned?.doubleValue(for: .kilocalorie()) ?? 0,

​                             unit: UnitEnergy.kilocalories)

​                    .formatted(.measurement(width: .abbreviated,

​                                usage: .workout,

​                                numberFormat: .numeric(precision: .fractionLength(0)))))

​            .foregroundStyle(.pink)

​          SummaryMetricView(title: "Avg. Heart Rate",

​                   value: workoutManager.averageHeartRate.formatted(.number.precision(.fractionLength(0))) + " bpm")

​            .foregroundStyle(.red)

​          Text("Activity Rings")

​          ActivityRingsView(healthStore: workoutManager.healthStore)

​            .frame(width: 50, height: 50)

​          Button("Done") {

​            dismiss()

​          }

​        }

​        .scenePadding()

​      }

​      .navigationTitle("Summary")

​      .navigationBarTitleDisplayMode(.inline)

​    }

  }

}
```

将`workoutManager`中`workout`的健康数据提取出来展示到页面上。



# 总结

上文是使用 SwiftUI 结合 HealthKit 快速构建一个训练类应用的代码教学，其代码实现非常简单，同时也使用到了一些 SwiftUI 和 Watch OS 8 的新特性， 大家对 Wacth 比较感兴趣的话，也可以自己使用这些新特性构建一些简单的应用。
