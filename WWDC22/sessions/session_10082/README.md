---
session_ids: [10082]

---

# Session 10082 - 利用Xcode和设备上的检测工具排查卡顿

本文基于 [Session 10082](https://developer.apple.com/videos/play/wwdc2022/10082) 梳理。

> 作者：Wilson，就职于字节跳动剪映团队，iOS开发者。
>
> 审核：
>
> 红纸 🤯。
>
> 呼神护卫。


## 导读
今年Apple在开发全链路过程中对于卡顿问题的治理分析工具上做了一次相对较完整的更新，借此机会笔者将结合本次WWDC22的更新内容与大家一同探讨个话题——卡顿的治理。本文篇幅有点长，建议大家先浏览下文章的思维导图，可以帮助大家提前梳理本文的主体脉络。
![mind](images/mind.png)


## 背景介绍
我们先来看一个简单示例（以下片段截取至Session视频的开头部分），示例展示的是Apple内部新研发的一款Food Truck应用（餐车，用于管理销售甜甜圈产品），当开发人员点击Donuts进入甜甜圈种类列表并尝试滚动时，发现需要等一段时间后界面才响应。借着这种体验现象，我们来引入今天的话题——卡顿的治理。在话题具体讨论之前，首先先讨论两个问题：什么是卡顿？以及我们为什么要治理卡顿？
![demo](images/session_demo.gif)

什么是卡顿？

卡顿，顾名思义就是App在使用过程中出现了一段时间的阻塞，其表现为在用户触摸屏幕后，需要等待一段时间App才有响应，在这段时间内用户都无法进行其它操作，屏幕上的内容也没有任何的更新，正如上述示例所示；

为什么要治理卡顿？

卡顿从表现层面来讲，小到给用户一种掉帧和延迟感，大到用户不耐烦主动退出应用或超出系统阈值而发生崩溃；而这种体验对用户的伤害其实比普通的崩溃更加严重，而持续的卡顿感可能导致用户退出并转去使用其他应用，甚至可能卸载应用并在App商店留下不好的评论，直接关系到用户留存率、DAU和DNU等各项产品数据。因此卡顿目前已成为iOS最重要的性能指标之一，治理并减少App的卡顿率变得尤其关键。

## 卡顿原理分析
> 在正式进入排查和解决卡顿之前，我们简单先分析下卡顿发生的原理以及日常开发中通常导致卡顿的原因。

正常情况下，iOS默认显示频率是60Hz，所以GPU渲染只要达到60fps就不会产生卡顿；以60fps为例，vSync会每16ms(1/60)渲染一次，假如在16ms内没有准备好下一帧数据就会使画面停留在上一帧，就造成了掉帧或卡顿现象（参考：[iOS 保持界面流畅的技巧 | Garan no dou](https://blog.ibireme.com/2015/11/12/smooth_user_interfaces_for_ios/)）。

![session_vsync](images/session_vsync.png)

而在iOS开发中，由于UIKit是非线程安全的（参考：UIKit | Apple Developer Documentation），因此一切与UI相关的操作都必须放在主线程执行，系统会每16ms将UI的变化计算重新绘制，渲染至屏幕上。如果UI刷新的间隔能小于16ms，那么用户是不会感到卡顿的。但是如果在主线程进行了一些耗时操作，阻碍了UI的刷新，那么就会产生卡顿，甚至是卡死。
主线程对任务的处理是基于Runloop机制，如下图所示。Runloop支持并提供给外部注册6个时机的事件回调，分别是：

- RunloopEntry
- RunloopBeforeTimers
- RunloopBeforeSources
- RunloopBeforeWaiting
- RunloopAfterWaiting
- RunloopExit

其流转关系如下图所示。Runloop在没有任务需要处理的时候就会进入休眠状态，直至有信号将其唤醒，它又会去处理新的任务。

![runloop](images/session_runloop.png)

在日常开发中，`UIEvent`事件、`Timer`事件以及`dispatch`主线程块任务都是在Runloop循环机制的驱动下完成的。一旦我们在主线程中的任一个环节进行了一个耗时的操作，或者因为锁使用不当造成了主线程因等待而阻塞，那么主线程就会因为无法执行`Core Animation`回调而造成界面无法刷新。而用户的交互又依赖于`UIEvent`事件的传递和响应，该流程也必须在主线程中完成。所以主线程的阻塞会导致应用UI和交互双双阻塞，这也是导致卡顿的根本原因。

实际在日常开发中通常造成卡顿的原因主要是以下几种：（具体可参考往期[【WWDC21 10258】理解和消除 App 中的卡死 - 小专栏](https://xiaozhuanlan.com/topic/9027453618)）
- 主线程执行耗时的任务（CPU密集型任务），比如调用`UIGraphicsGetCurrentContext`等接口在CPU上进行绘制计算；
- 主线程等待子线程任务完成（线程优先级反转），比如在主线程使用queue.sync同步派发任务或使用`semaphore.wait()`将异步调用转化为同步调用等；
- 主线程等待系统资源，`比如使用Data(contentsOf:)`进行IO读取等；

## 如何排查卡顿
> 了解了卡断的原理以及日常开发中通常发生卡顿的原因之后，接下来我们就来简单聊聊有哪些工具可以帮助排查和定位卡顿问题。

在iOS 16和Xcode 14以前，Apple提供了Instruments、MetricKit以及Xcode Organizer等工具供开发者在不同开发阶段进行App性能的统计分析，但是针对卡顿的排查分析十分有限。值得高兴的是今年在iOS 16和Xcode 14上苹果Apple在不同开发阶段都更新了一些帮助开发者进行排查和分析卡顿的工具；它们分别是：

- Thread Performance Checker
- Hang detection in Instruments
- On-Device Hang Detection
- Xcode Reports Organizer

因此我们将简单探讨下在App不同开发阶段应该怎么如何这些工具帮助我们更快发现，定位分析和解决卡顿问题，不断提升我们App的性能体验。

### Thread Performance Checker

首先是开发阶段，当我们在使用Xcode进行真机调试时，可以在 Edit Scheme -> Run -> Diagnostics选项卡中开启Thread Performance Checker。（其实升级到Xcode 14后就已经默认开启Thread Performance Checker）

![tpc_enable](images/session_tpc_enable.png)

当开启Thread Performance Checker后，Xcode如果检测到App在运行时有例如线程优先级反转和非UI工作在主线程运行等问题时就会在Xcode问题导航栏中提示该卡顿风险警告。这可以帮助我们在开发初期就能发现并去解决隐含的卡顿风险问题。

![tpc_issue](images/session_tpc_issue.png)

但是该卡顿风险警告提示仅显示主线程堆栈信息，并没有展示在该卡顿期间其它线程的堆栈信息。这时就可以使用开发阶段的另一个工具——Instruments Timer Profile进行进一步分析；

### Instruments

接下来我们将使用Timer Profiler来对上述Thread Peformance Checker提示的线程优先级反转问题进一步深入分析。针对Timer Profiler具体使用方法我这边也不做赘述了，大家可通过往届WWDC视频[Instruments入门](https://developer.apple.com/videos/play/wwdc2019/411/)和官方文档[Instruments Developer Help](https://help.apple.com/instruments/developer/mac/current/)了解更多；
当我们在使用Xcode 14的Timer Profiler工具分析App重现的卡顿问题时，可以惊喜地发现新的Timer Profiler在检测到App有卡顿问题时就会在轨道时间线上展示红色的Hang标记，该标记的长度代表了卡顿的时间间隔。然后，我们可以通过点击三次Hang标记过滤出该卡顿时间间隔区间内的所有事件并展开详细的线程轨道视图，以方便查看其它线程的繁忙情况；如下图所示，可以看到主线程在这段时间内属于空闲状态，而有一个worker子线程在这段时间内却属于繁忙状态，可见应该是主线程在等待该子线程完成任务。这与上述Thread Performance Checker中展示的线程优先级反转风险警告问题遥相呼应，最后我们可以展开Timer Profiler下方的调用堆栈分析当时子线程的堆栈信息，结合实际上下文并最终解决优先级反转问题。

![timeprofiler](images/session_timeprofiler.png)

值得一提的是上述的Instruments中卡顿检测与标记在Timer Profiler和CPU Profiler工具中同样都是默认可用的，另外也可以在其它Trace模版中添加Hang tracing来跟其他工具结合进行测试。

### On-Device Detection

前面讨论了可利用Thread Performance Checker和Instruments中的卡顿检测工具来帮助我们发现并定位问题，其实可以发现这两个工具都是线下的定位手段。虽然我们可能在开发阶段已经做足了相对完整的测试，并取得了较好的测试覆盖率，但是在后续的Beta测试阶段和线上发布阶段中也有可能会出现自己没考虑到的卡顿问题的路径。这时候用户设备都是无法连接到Xcode进行线下调试的，所以就非常依赖线上的工具进行发现和定位问题。
谈到线上工具，首先值得高兴的是今年Apple在iOS 16的开发者设置中引入了Hang Detection（卡顿检测）功能，为App运行时提供实时的卡顿检测通知并诊断的能力，不过这只适用于由开发证书签名的以及通过TestFlight安装的应用。具体打开方式：Settings -> Developer -> Hang Detection，并切换Enable Hang Detection开关状态到开启状态。开启后可以看到以下三部分：

- Hang Threshold：可设置卡断检测的阈值，目前只有250ms、500ms、1000ms和2000ms四个可选；
- Monitored Apps：展示可监控的App列表；（注意：只展示由开发证书签名的和通过TestFlight安装的应用，企业证书签名无法适用）
- Avalable Hang Logs：展示了收到卡顿警告通知时诊断所产生的卡顿日志列表，这个后续我们排查具体问题时会用到；

![odd_settings](images/session_odd_settings.png)

现在我们将Food Truck应用部署到TestFlight并在个人设备上安装运行，如下图所示，当我们首次点击Orders打开订单列表时，在屏幕上方收到了一个卡顿提示。

![food_truck_with_hangs](images/session_food_truck_with_hangs.gif)

这显然是我们在开发时都没有注意到的卡顿问题，它出现在了Beta测试阶段，此时我们可以切换到上述Hang Detection的Avalable Hang Logs列表中来查找该卡顿产生的日志并打开详情。如下图所示，日志详情分为两部分：一部分是基于文本的卡顿日志文件（格式类似崩溃日志），文件后缀名为.ips；另一部分则是tailspin压缩文件，tailspin文件可以在Instruments中打开查看更多维度信息（例如Timer Profile和Disk Usage等系统资源使用情况等）供深入分析使用。

![hang_detection_logs](images/session_hang_detection_logs.png)

此时我们可以通过分享到Airdrop方式将这些日志发送到Mac上，我们将日志符号化后，可得到如下图所示的堆栈信息，可以看到App在发生卡顿期间，主线程正在执行一个同步读取网络/磁盘数据的方法，最终我们定位到了该问题的原因是主线程在等待资源而发生阻塞。

![hang_stack_logs](images/session_hang_stack_log.png)

### MetricKit

然后说回到线上工具，值得一提的是MetricKit框架，它是Apple在iOS 13发布的用于收集和诊断性能的工具，其中就包括卡顿指标（具体可查阅：[MetricKit | Apple Developer Documentation](https://developer.apple.com/documentation/metrickit)）。不过它始终只是一个框架，线上使用时还需要人为接入它并上报相关诊断数据才能进行系统性地分析，不过其实苹果也考虑到了这点，也一并在Xcode Organizer中加入相应的指标分析能力，这一点我们接下来会简单探讨下。另外它还可以作为一个性能测试工具供开发阶段单元测试使用，具体这边就不赘述了，详情可查阅[XCTMetric | Apple Developer Documentation](https://developer.apple.com/documentation/xctest/xctmetric)。

### Xcode Organizer

最后当App发布到正式环境以后，后续我们就可以通过Xcode Organizer来分析线上版本App的性能指标。Xcode 14以前Organizer只提供了卡顿率这种系统性分析后的数据指标，并没有提供诸如包含堆栈信息的卡顿报告来帮助排查定位，功能上相对鸡肋。终于在Xcode 14 Organizer支持了Hang Reports，它能收集并上报线上用户在遇到卡顿时系统所产生的诊断报告数据（前提是用户同意了与App开发者共享应用分析）。如下图，Xcode 14 Organizer的Reports分类中新增加了Hang Reports栏目；左起第二栏展示问题的聚合列表，问题按用户影响程度进行排序；第三栏展示了具体问题的堆栈信息，可帮助开发者分析定位卡顿原因；第四栏展示了具体问题的汇总统计信息，比如发生卡顿的数量，操作系统和设备分布比例等。

![organizer_hang_reports](images/session_organizer_hang_reports.png)

例如，我们观察到Hangs Reports的问题列表中最顶部的问题占了该版本卡顿问题的21%，问题相当严重。我们尝试解决该问题，选中该问题并展开查看具体的堆栈信息，最终可以推断出该问题是因为在主线程同步读取磁盘文件而引起阻塞。这里要补充说明下上述堆栈信息是经过符号化的结果，具体只要用户在App上传到App Store时一并上传符号信息，报告中的堆栈信息就能自动符号化了。
除了Xcode Organizer本身提供的可视化分析工具之外，它也支持第三方开发者通过App Store Connect REST API获取应用的卡顿报告数据，以方便开发者将卡顿分析集成到自己内部的分析系统中并做额外分析。（具体观看WWDC20视频[Identify trends with the Power and Performance API](https://developer.apple.com/videos/play/wwdc2020/10057)的介绍）
另外在进行排查和治理现有问题时，做好防劣化监控其实也同样重要，Apple建议开发者到Organizer的Regressions中开启版本性能指标劣化通知，当版本卡顿率突然上涨时就能收到劣化通知，并根据相应问题及时做出调整。具体可观看Apple去年WWDC21视频[Diagnose Power and Performance regressions in your app](https://developer.apple.com/videos/play/wwdc2021/10087)介绍

![session_hang_regression](images/session_hang_regression.png)

至此我们就今年WWDC22上Apple为开发者提供的线上/线下排查卡顿的工具做了相关探讨，对工具的使用上也有了简单的了解。但是笔者想要吐槽一点的是，Apple针对线上卡顿问题的治理分析工具的更新来得太晚了。过去大家在解决线上用户反馈的卡顿问题时苦于没有相对成熟稳定的工具进行排查定位，大多数公司和开发者不得不走上自研道路，经过多年的耕耘，业界也逐渐有了相对成熟完善的WatchDog方案，接下来我们就来简单展开讨论下。

### 业界WatchDog方案

目前业界大多数企业（如微信、字节、美团和得物等）的APM工具实现线上卡顿监控能力的思路都是采用监听Runloop回调的方式进行卡顿的捕获，这也是综合性能和准确性表现最好的一种方案。整体流程如下：

![session_watchdog_flow](images/session_watchdog_flow.png)

具体首先对主线程Runloop注册两个事件回调：一个为begin事件回调，用于启动检测；另一个为end事件回调，用于关闭检测；在begin事件回调被触发时，可以利用`signal`机制将其运行状态传递给另一个卡顿检测线程（后面称之为monitor线程），monitor线程可以设置等待主线程signal的超时时间进行间隔采样，如果等待`signal`信号超时了，这说明主线程可能发生了阻塞；另外在end事件被触发时，通过`signal`通知monitor线程关闭卡顿检测，进入休眠状态。通过monitor线程，我们可以完整地了解主线程Runloop的运行状态，目前处于哪个阶段，耗时了多久等等。根据这些信息，我们就可以判断主线程是否发生了卡顿/卡死，并采取对应的策略进行异常捕获和上报。更多对方案补充介绍可参考：

- [字节跳动 iOS Heimdallr 卡死卡顿监控方案与优化之路](https://juejin.cn/post/7055190328260689951)
- [iOS 稳定性问题治理:卡死崩溃监控原理及最佳实践](https://juejin.cn/post/6937091641656721438)
- [得物iOS卡顿监控实施与性能调优](https://mp.weixin.qq.com/s/Rs1lvFdQlXK6k9jkXHAhHQ)
- [微信iOS卡顿监控系统](https://mp.weixin.qq.com/s/M6r7NIk-s8Q-TOaHzXFNAw)
- [移动端性能监控方案Hertz](https://tech.meituan.com/2016/12/19/hertz.html)

了解了大致思路后，可以将方案用伪代码实现如下：

```C++
/***********以下为monitor监听runloop事件回调的核心逻辑*************************************/
 - (void)addRunLoopObservers {
    CFRunLoopRef mainRunloop = CFRunLoopGetMain();
    // 注册kCFRunLoopEntry|kCFRunLoopBeforeSources|kCFRunLoopAfterWaiting事件
    CFRunLoopObserverRef runloopBeginObserver = CFRunLoopObserverCreate(kCFAllocatorDefault, kCFRunLoopEntry|kCFRunLoopBeforeSources|kCFRunLoopAfterWaiting, YES, LONG_MIN, runloopBeginCallback, NULL);
    CFRunLoopAddObserver(mainRunloop, runloopBeginObserver, kCFRunLoopCommonModes);
    // 注册kCFRunLoopBeforeWaiting|kCFRunLoopExit事件
    CFRunLoopObserverRef runloopEndObserver = CFRunLoopObserverCreate(kCFAllocatorDefault, kCFRunLoopBeforeWaiting|kCFRunLoopExit, YES, LONG_MAX, runloopEndCallback, NULL);;
    CFRunLoopAddObserver(mainRunloop, runloopEndObserver, kCFRunLoopCommonModes);
}

// begin事件回调
static void runloopBeginCallback(CFRunLoopObserverRef observer, CFRunLoopActivity activity, void *context) {
    // 通过signal通知检测线程从休眠中恢复运行，开启卡顿检测
}

// end事件回调
static void runloopEndCallback(CFRunLoopObserverRef observer, CFRunLoopActivity activity, void *context) {
    // 通过signal通知检测线程关闭卡顿检测并进入休眠状态
}

/***********以下为monitor线程的核心逻辑*************************************/
- (void)startMonitor {
    dispatch_async(monitor_queue, ^{
        runMonitor();
    });
}

// monitor线程事件循环
- (void)runMonitor {
    while(true) {
        // 进入休眠，等待signal唤醒
        waitForSignalWithoutTimeout();
        
        // 卡顿检测逻辑
        while(isMainRunloopRunning()) {
            // 等待signal进入休眠，设定超时等待时间50ms（时间可配置）进行隔采样，然后通过采样数据判断主线程runloop状态是否卡顿/卡死；
            if (!waitForSignalWithTimeout(timeout)) {
                // 信号超时
                waitDuration += timeout;
                if (waitDuration > hangThreadhold) {
                    hangDetected();
                }
            }
        }
    }
}
```

## 如何解决卡顿

在分析和定位到了具体的卡顿原因之后，我们就可以着手解决问题了。面对大多日常开发中的常见问题我们可以有以下通用解决方案：

- 将CPU密集型工作迁移到子线程队列处理，降低主线程繁忙的概率；
- 避免主线程等待子线程的场景（即优先级反转），尽量使用异步子线程处理任务，完成后通知回调到主线程的方式；
- 避免在主线程同步读取磁盘或网络数据，可通过在后台线程代替处理，待IO操作完成后再回调主线程；

另外，除了进行现有问题的排查和治理外。提升发现和定位线上问题的能力和效率同样重要，在实际开发过程中，我们应该尽早搭建性能防劣化体系，针对每个版本的卡顿进行统计分析，并对指标进行监控报警，这样当线上版本质量发生劣化时，我们就能在第一时间收到通知，及时跟进解决；

## 总结

本文以卡顿的治理为主线，首先介绍了卡顿背景，了解了什么是卡顿以及为什么要治理卡顿后；其次我们对卡顿做了原理性分析并探讨了日常开发中导致卡顿的原因；然后结合今年WWDC22的内容讲述了如何利用线上/线下工具进行定位分析卡顿，并对业界WatchDog方案进行展开性讨论；最后探讨了日常开发中的卡顿问题该如何解决，并强调了线上防劣化和监控体系搭建的重要性。整体上来说本文简单分享了一个常规化的卡顿治理思路。

## 参考资料

- [Understand and eliminate hangs from your app](https://developer.apple.com/videos/play/wwdc2021/10258)
- [Diagnose Power and Performance regressions in your app](https://developer.apple.com/videos/play/wwdc2021/10087)
- [Identify trends with the Power and Performance API](https://developer.apple.com/videos/play/wwdc2021/10087)
- [Improving app responsiveness](https://developer.apple.com/documentation/Xcode/improving-app-responsiveness)
- [iOS 保持界面流畅的技巧 | Garan no dou](https://blog.ibireme.com/2015/11/12/smooth_user_interfaces_for_ios/)
- [【WWDC21 10258】理解和消除 App 中的卡死](https://xiaozhuanlan.com/topic/9027453618)
- [字节跳动 iOS Heimdallr 卡死卡顿监控方案与优化之路](https://juejin.cn/post/7055190328260689951)
- [iOS 稳定性问题治理:卡死崩溃监控原理及最佳实践](https://juejin.cn/post/6937091641656721438)
- [得物iOS卡顿监控实施与性能调优](https://mp.weixin.qq.com/s/Rs1lvFdQlXK6k9jkXHAhHQ)
- [微信iOS卡顿监控系统](https://mp.weixin.qq.com/s/M6r7NIk-s8Q-TOaHzXFNAw)
- [移动端性能监控方案Hertz](https://tech.meituan.com/2016/12/19/hertz.html)