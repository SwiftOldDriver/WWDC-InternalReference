> 本文基于 [Session 10181](https://developer.apple.com/videos/play/wwdc2021/10181/) 梳理。

性能优化听起来是一个困难重重的任务，需要追溯诸多指标，使用大量工具。这份性能优化指南能帮助你理解工具、指标、代码范例，进而让开发过程更加流畅，并为用户提供更优秀的体验。

这份指南相比于其他性能优化的 Session，更像是一本手册，指导你在遇到不同的性能问题时，应该使用哪份工具。而想要深入了解的话，则需要前往各个 Session。本文中也会加入作者在日常过程中使用这些工具的心得，帮助大家更好的了解苹果近年来在性能优化方向上为开发者提供的工具。

首先，该 Session 会对性能调试工具做一个整体介绍，包括五个主要的工具：Xcode Organizer、MetricKit、Instruments、XCTest、APP Store Connect API。之后会介绍一些各个领域常见的问题，如滑动性能、电量、网络使用情况等，然后提供解决和预防的方案。最后会介绍一些进一步的优化方案。

## 简介

性能优化就像一条长河，有许多中途的停靠站，需要不同的工具来指引方向；在每一个站点，也会有一些新东西需要学习。

![性能优化求生之路](https://images.xiaozhuanlan.com/photo/2021/04206fddc42c645105cd7d488e61d7a5.png)

目前有八个关键的指标用于衡量 App 的性能：电量使用情况、启动时间、卡顿比例、内存使用情况、磁盘读写、滑动流畅性、应用终止、MXSignposts，这些都有工具可以追踪。

![八个优化方向](https://images.xiaozhuanlan.com/photo/2021/7707d2d844b2f560abd47e0bdfbad4a3.png)

Session 中举了个例子，对比性能优化前后的体验，最直观的就是滑动的卡顿、掉帧。同样，性能优化的目标也是减少卡顿，让滑动更加流畅。每个性能指标都有对应的优化方法和常用工具。

## 电量使用情况

App 的电量使用情况会直接反应在「设置」-「电池」页面下，包括它在前台和后台的耗电量。优化电量使用情况的意义在于，用户不需要充电就能更久的使用手机。优化电量时，主要关注三个方向：CPU、网络、定位，之后也可以关注 GPU、音频播放以及蓝牙。

![电量优化](https://images.xiaozhuanlan.com/photo/2021/9cd26c072cef4f25952cf81094dc0838.png)

在一些工具的帮助下，无论是在开发时，或者 App 版本发布后，我们都能够追踪和诊断电量问题。在 Xcode 中运行 App 时，开发工具中也为我们提供了能耗相关的面板，帮助我们观察当前的 App 的能耗使用情况。其中首要关注的是「高 CPU 使用（CPU High Utilization）」和「CPU 唤醒（CPU Wake Overhead）」。「高 CPU 使用」指的是 CPU 使用超过 20% 的情况，「CPU 唤醒」指的是 CPU 从空闲状态被唤醒执行任务，这两者都会导致能耗的增加。CPU 峰值常出现在 UI 绘制、处理网络数据、进行计算时，但当这些任务完成，App 在等待下一轮的用户操作时，CPU 的用量应该降到 0。

![Debug Navigator](https://images.xiaozhuanlan.com/photo/2021/a491a491d2c32aac7af610ca85047403.png)

在这个面板中，也提供了进行 Time Profile 的按钮，点击以后能在 Instruments 中 App 的各项指标进行更细致的检测，包括 CPU 使用情况及记录下的调用栈。除此之外，也可以使用 Location Energy Model 来检测 `Core Location` 对能耗的影响，并避免在非必要时使用定位功能。

有时候我们可能在 beta 版或已经发布的 App 上发现一些 bug，难以在本地重现，需要更多的日志和上下文来排查。此时可以使用 `MetricKit`，这是苹果从 19 年开始提供的一站式的性能监测框架，能收集用户在使用 App 时出现的各种性能问题。要使用 `MetricKit`，需要实现一个自定义的 `AppMetrics` 类，并遵守 `MXMetricManagerSubscriber` 协议。

```swift
class AppMetrics: MXMetricManagerSubscriber {
	init() {
    // 初始化时让 MXMetricManager 引用当前类的实例
		let shared = MXMetricManager.shared
		shared.add(self)
	}

	deinit {
    // 析构时让 MXMetricManager 移除对自身的引用
		let shared = MXMetricManager.shared
		shared.remove(self)
	}

  // 可以聚合相同类型的数据，比如能耗的打点和 CPU 的使用数据
	// Receive daily metrics
	func didReceive(_ payloads: [MXMetricPayload]) {
		// Process metrics
	}

	// Receive diagnostics
	func didReceive(_ payloads: [MXDiagnosticPayload]) {
		// Process metrics
	}
}
```

最佳实践在上述的代码中，在初始化时让 `MXMetricManager` 引用当前类，然后在析构时解除引用，在 `didReceive:` 方法中聚合相同类型的数据。`MetricKit` 会提供上下文数据，以助于排查问题。当用户使用 App 时，苹果会从授权用户中收集性能数据，然后在服务器中进行处理，你可以从 Xcode Organizer 等渠道获得这些数据。

> 苹果在 20 年时对 MetricKit 做了一次升级，相关 Session「[What's new in MetricKit](https://developer.apple.com/videos/play/wwdc2020/10081/)」中对 `MetricKit` 做了一些相对完整的说明，有兴趣的读者可以阅读。也可以看看 20 年内参的翻译 「[WWDC20 10081 - MetricKit 中的新功能](https://xiaozhuanlan.com/topic/3572084169)」。
>
> 简单来说，每 24 个小时，`MetricKit` 会将性能数据收集，然后打包上传到服务器，我们能拿到可读性更高的数据。这些性能数据被包在 `MXDiagnosticPayload` 中，包括电池相关指标（CPU、网络状态、GPU、定位）、性能指标（应用退出原因、启动耗时、内存使用情况）、用户交互相关指标（Hitch、卡顿情况）、磁盘写入指标、自定义指标（`MXSignpost` 打点的指标）。

![Organizer - Metrics - Battery Usage](https://images.xiaozhuanlan.com/photo/2021/cde94711c8fe849cd99827b27de47ea6.png)

从 Xcode 的 「Window」—「Organizer」中，可以点击「Battery Usage」来查看不同版本 App 的数据，这些数据被分类，展示在右侧的图表中。

![Organizer Regressions](https://images.xiaozhuanlan.com/photo/2021/aa33b394aabcaac877aa3051a8758c38.png)

如果最新版本的 App 出现了严重的性能劣化，Xcode 13 中新提供的 Regressions 面板中会直观的展示。该面板中展现了所有最新版本中显著劣化的性能指标，一目了然。上图中 Reports 下 Crashes、Disk Writes、Energy 三个分类也可以帮助我们更精确的定位问题。这些数据也可以通过 App Store Connect API 访问，这样就可以本地分析返回的 JSON 格式的数据了。

> 目前 Xcode 12 中也是有 Reports 及下面的三个分类的，但是没有集成 `MetricKit` 的话，只能看到 Crashes 中是有数据的。

如果要更深入的了解如何改善耗电量，优化性能问题，可以观看 19 年的 Session 「[Improving Battery Life and Performance](https://developer.apple.com/videos/play/wwdc2019/417/)」。今年的新 Session 「[Analyze HTTP Traffic in Instruments](https://developer.apple.com/videos/play/wwdc2021/10212/)」介绍了如何分析 HTTP 流量，也是一个有效的工具。

> 分析 HTTP 流量之前确实是一个痛点，只能通过 Charles 和 Instrument 中的简略工具 「Network Activity Log」和「Network Connections」看到流量的消耗情况，这次新的工具提供了更详细的指标，具体大家可以看 Session，下面是界面图，可以看出现在能按请求发出时间、请求地址等来进行分类了，比以前只能从 Charles 抓包看会方便不少。
>
> ![HTTP 流量分析 Instrument](https://images.xiaozhuanlan.com/photo/2021/abf84663c9e7d753682b5076ac09876b.png)

## 卡顿和滑动流畅性

> 这里的卡顿原文中用词是 Hang，代表的是超过 250ms App 不响应用户操作。超过 250ms 这个范围有些大，从上下文的联系中（指滑动流畅性）看，会更倾向于是和用户交互相关的描述，所以这里使用了「卡顿」这个翻译。

下一步是关于卡顿和滑动流畅性的，这两项指标表示 App 是否还响应操作。卡顿指的是 App 不响应用户的操作至少 250ms。App 长时间的卡顿会导致用户强杀 App，对用户体验损害极大，需要优先处理。如果新一帧的内容在下一次刷新时还没准备好，就会发生滑动卡顿。卡顿也会让用户用的难受，从而减少使用时间，从卡顿开始优化性能，性价比较高。

还记得我们之前展现过的流畅滑动吗？追求这样的体验也是对用户最有帮助的。在 Xcode Organizer 中，我们能够跟踪卡顿和滑动流畅性的相关指标。如果注意到指标在持续上涨，或者像在滑动 Hitches 的页面中看到指标变黄或变红，那就需要更关注这方面的优化了。

> 苹果在 20 年的 Session 中提出了 Hitch 的概念，用以衡量滑动时的卡顿情况。Hitch 指的是 卡顿时间（一帧延后出现的时间，ms）/ 总时间（一般是 1 秒），低于 5 ms/s 说明比较优秀，高于 10 ms/s 说明发生了较严重的卡顿。

![Organizer - Metrics - Scrolling](https://images.xiaozhuanlan.com/photo/2021/c05a2823ddba6edfc8d7377ed1e3b9d8.png)

如上图所示，这些红色的柱形表示了更差的滑动体验，需要立刻着手优化。如果需要本地检查哪里出了问题，可以用 Instruments 中的 Thread State 或者 System Call Traces 工具来查看相关 trace。Thread State 能够展现当操作系统调度线程运行时，线程状态的时间线，从中能看到具体某个地方线程被 block 了多久。System Call Trace 详细展示了有哪些系统方法调用，以及相应的执行时长。

> Hitch 的详细介绍可以参考「[Find and fix hitches in the commit phase](https://developer.apple.com/videos/play/tech-talks/10856/)」和「[Demystify and eliminate hitches in the render phase](https://developer.apple.com/videos/play/tech-talks/10857/)」。Render Loop 分为的 5 个阶段，Hitch 在 Instruments 中的数据也是按这些阶段展示的。
>
> ![The Render Loop](https://images.xiaozhuanlan.com/photo/2021/b48d387cde71845f870dab9c9c052b00.png)
>
> 下图是本地跑的一个 Hitch 的截图，可以看到是 Commit 阶段导致了 Hitch。同时通过查看 Time Profiler，可以看到此时在执行的相关方法，可以考虑通过拆散或优化这些方法的耗时来降低一次 Commit 的耗时。
>
> ![Hitch](https://images.xiaozhuanlan.com/photo/2021/33b59d09a67e2e2e5556a79fefaa3e27.png)
>
> 常见的除了 Commit 阶段会导致 Hitch，Render 阶段也可能会。Render 阶段导致 Hitch 的原因就比较常见了，如图层混合、阴影等可能用到离屏渲染的地方。

![测试滑动性能](https://images.xiaozhuanlan.com/photo/2021/2a298787d9b89e43da3cc599f22a1d28.png)

为了确保发布 App 时，没有带着会影响滑动体验的 bug，可以使用 XCTest 运行自动化 UI 测试，启动并滑动页面。在该项测试中，我们指定想要测量  `scrollDecelerationMetric`  这个指标，在 `measure` 方法的 block 中，用合适的加速度来执行上滑操作。由于 `measure` 方法的 block 默认执行五次，在每次执行结束后，使用 `XCTMeasureOptions` 重置应用状态。这样就能执行测试代码开始测量滑动性能，然后停止测量、重置状态。

![MetricKit Payload 实时更新](https://images.xiaozhuanlan.com/photo/2021/c333c271a2b97d99c443eaf033fa1ed4.png)

有时候想要重现响应性相关的问题并不简单，得益于 `MetircKit`，将它接入 App 后，我们可以在这些问题发生时收集测试和诊断结果。如果发生了卡顿的情况，在 iOS 14 中，`MetricKit` 会在 24 小时内收集这些诊断信息。而在 iOS 15 和 macOS 12 中，能在性能问题出现时，马上获得诊断信息。结合这些实时的诊断信息以及测试技术，开发者就能快速定位并解决最严重的响应性问题。而对于滑动卡顿问题，iOS 15 在 `MetricKit` 中引入了新的 API，用 `MXSignpost` 来标记自定义动画。`MXSignpost` 是 `MetricKit` 中封装的 API，用于标记重要代码，以供远程收集数据。

![MetricKit Animation 信息收集 API](https://images.xiaozhuanlan.com/photo/2021/53447998344db9dcab21edd4e3fbf0cd.png)

使用 `mxSignpostAnimationIntervalBegin` API，能够标记自定义动画的起始位置。使用 `mxSignpost` end API，能够标记动画的结束，并收集这段时间内发生 Hitch 的比例。这两个函数不仅会收集一些细粒度上的性能数据，也会捕获在这段时间内发生的 Hitch。推荐阅读「[Understand and Eliminate Hangs from your App](https://developer.apple.com/videos/play/wwdc2021/10258/)」这个 Session。如果想要深入了解如何定位滑动卡顿问题，推荐阅读 「[Eliminate animation hitches with XCTest](https://developer.apple.com/videos/play/wwdc2020/10077/)」和「[Explore UI Animation Hitches and the Render Loop](https://developer.apple.com/videos/play/tech-talks/10855/)」两个 2020 年的 Tech Talk。

## 磁盘写入

我们已经走完了半程，接下来讨论的是磁盘写入问题。磁盘写入操作会损耗用户的闪存，影响设备的使用寿命。频繁的写入耗时严重，会导致糟糕的用户体验及较差的性能，最好能分批进行写入操作。

在 App 上线前，可以用 Instruments 中的 File Activity 模版分析是否有相关问题。这个模版以系统调用的形式记录文件系统的使用情况，因此可以轻松定位到哪些代码访问了文件系统。有很多办法限制磁盘写入，常见的比如批量处理写入操作、使用 CoreData 来存储频繁更改的数据、避免快速创建和删除文件。

![磁盘写入性能测试](https://images.xiaozhuanlan.com/photo/2021/5b14dece284240bdd6e42f428a16454c.png)

在分析 App 时，也可以使用 XCTest 来写一些性能测试，以确保代码中没有过度的磁盘写入操作。使用 `MetricKit` 中的 `measure` 方法，传入 `XCTStorageMetric` 的实例，之后调用磁盘写入的相关代码。这能测量写入磁盘的数据量，并在 Xcode 中显示结果。在测试中设定写的阈值后，如果测试代码的写入超限了，就无法通过该项测试。

![Organizer - Metrics - Disk Writes](https://images.xiaozhuanlan.com/photo/2021/69206be2bb2b89ef70473dcf6181f355.png)

如果已经发布了一个磁盘写入量较高的 App 版本，可以使用 Organizer 来追踪该版本在用户设备上的性能。磁盘写入指标展示了现版本的写入量和之前版本的对比趋势图。图中的峰值代表着 App 中已经有 bug，会产生大量的写入操作。此时需要找到导致这个 bug 的原因，尝试理解它是如何产生的，并最终减少写入操作。

![Organizer - Reports - Disk Writes](https://images.xiaozhuanlan.com/photo/2021/31559fdcda6eff36f39f24ecbf1624e1.png)

也可以在 Organizer 中的 Reports 下的 Disk Writes 中看到代码详情，其中展示了在 24 小时内写入超过 1 GB 的代码片段。调用栈展示了代码中哪里进行了过量的写操作，而在 Xcode 13 中，右侧新增了一栏 Insights，简述了可以如何进行优化，减少磁盘写入。这些数据也会通过 App Store Connect API 提供。也可以通过 `MetricKit` 实时收集这些数据。如果使用了 `MetricKit` 来监控 App 的磁盘使用情况，就能够使用 `MXSignpost` 记录关键的磁盘写入的路径，获取更精确的数据，从而找到优化空间。关于如何定位并修复磁盘写入的问题，可以观看今年的 「[Diagnose Power and Performance Regressions in your App](https://developer.apple.com/videos/play/tech-talks/10855/)」。

## 启动时间与应用终止（Termination）

下一步，我们会谈论启动时间与应用终止。启动时间指的是从用户点击 App 到首帧渲染完毕的时间。如果启动时间过久，用户会觉得等的心累，而超长的启动时间也会导致 App 被强行终止。如果系统结束了你的 App，用户需要重新走一遍启动流程，这比从后台恢复要花更久时间。

进程退出可能有多个原因，比如使用了超过系统限制的内存，或者启动耗时太长。App 被终止后，用户需要重新走一遍启动流程，而如果你的 App 不提供状态恢复的能力，那用户需要手动操作来恢复到之前到工作状态，更觉得心累了。

![Organizer - Metrics - Terminations](https://images.xiaozhuanlan.com/photo/2021/137057a1e9ad7dcf8587f14689f636de.png)

要是发现某一个版本的启动时间大幅上升，可以看看 Organizer 中的 Launch Time 和新加的 Termination 面板，这可以将当前的 App 启动时间和过去 16 个版本的进行对比，这样就能对 App 该有的启动时间有个认知，也可以去 Termination 面板中查看 App 被系统终止，有多少次时因为启动耗时太久。就像上图中，有 70% 是因为启动耗时太久导致 App 被终止的。

确认了这个问题的存在之后，就可以通过本地的一些方法来找到具体是哪些代码导致的。首先，可以使用 Instruments 中的 App Launch 模版。该模版会运行 App 5 秒，收集启动时方法耗时数据以及 Thread State Trace，从中可以获得线程被 block 的原因并修复它。其次，可以使用 XCTest 来获取启动时间，通过 `XCTApplicationsLaunchMetric`，在 `measure` 方法中进行测量。如果想要自己进行更详细的分析，也可以使用 `MetricKit` 来收集每日的 App 终止数据。想了解如何在 App 被终止时进行状态恢复，可以参考 2020 年的 「[Why is my App Getting Killed](https://developer.apple.com/videos/play/wwdc2020/10078/)」。

> 这一节的重点其实是启动时间，这也是我们平常在工作中关注的重点。应用的终止是启动时间过长的恶果。启动时间直接关系到用户需要多久打开 App 并开始消费内容，可以说是争分夺秒的优化位置。
>
> 关于如何进行优化，上文中没有详细介绍，其实也和各 App 的启动场景有关。比如有些 App 一打开就会开始播放视频，有些一打开是文章列表，需要加载的模块就不一样。但总体思路还是类似的：**移除首帧显示前不必要的任务**。这个任务影响用户消费首帧的内容吗？不影响就往后挪，放到闲时执行。
>
> 启动优化的难点有时候在于发现问题，看 Instruments 中跑出的结果，有时候会有无从下手的感觉，可能是因为：
>
> 1. 不知道这个方法是不是必要的；
> 2. 不知道这个方法有没有优化空间。
>
> 个人经验上，第一点一般可以分为两个步骤解决：存量方法治理、新增方法管控。如果刚开始做优化，对现有的方法可能不太熟悉，这需要长时间的梳理，列出表以后，对相关方法进行标注，延后不必要的方法。而新增方法管控则是对每个版本中新增的，影响启动的方法做总结，每次改动到启动相关的代码时严格 review，了解影响范围，确保是必须的。
>
> 第二点上，可以从方法的绝对耗时开始，从高到低梳理，投资回报率比较高。耗时严重的方法一般也有相对较大的优化空间，可以结合 Trace 看看。
>
> 这里也推荐一个工具：[AppleTrace](https://github.com/everettjf/AppleTrace)。它能用启动火焰图的方式来分析方法耗时，提供了和 App Launch 模版不一样的思路。

## 内存

最后，我们会讨论内存相关的问题。内存是 App、操作系统和内核间共享的资源，如果 App 使用了超出限制的内存，就会被系统给停止运行，然后下次用户重新启动，又要重新走一遍启动流程。如果在 App 中加入了图片读取或上传的相关功能，就要小心是否可能导致内存使用超限，多关注 Organizer 中的 Memory 和 Terminations 面板。

如果发现内存使用在新版本中达到了峰值，可以使用 Instruments 中的 Leaks、Allocations 和 VM Tracker 模版来进行分析。Leaks 会记录进程的堆，并检查泄露的内存。Allocations 会分析 App 中内存的生命周期。VM Tracker 会随时间展示 App 的虚拟内存空间。同样，可以使用 MetricKit 来获取这些信息并进行更详细的分析。

```swift
// Collect memory telemetry

func saveAppAssets() {
	mxSignpost(OSSignpostType.begin, 
		log: MXMetricManager.makeLogHandle(category: "memory_telemetry"), 
		name: "custom_memory")

	// save app metadata

	mxSignpost(OSSignpostType.end, 
		log: MXMetricManager.makeLogHandle(category: "memory_telemetry"), 
		name: "custom_memory")
}
```

和使用 `MetricKit` 收集内存和应用终止信息相同，可以通过在关键代码前后加上 `MXSignposts` 打点，来获取内存使用的关键信息。

想要了解如何检测和理解如何解决内存问题，可以看看今年的「[Detect and Diagnose Memory Issues](https://developer.apple.com/videos/play/wwdc2021/10180/)」。

> 内存相关的工具可能是比其他方面的工具要全面的多，这也是因为内存优化一直是性能优化的重点。除了上面介绍的 3 个 Instruments 中的工具，Xcode 中还提供 Memory Graph 来帮助查找循环引用，Product 中的 Analyze 也可以对可能的循环应用进行分析。想要深入了解内存问题的话，18 年的 Session「[iOS Memory Deep Dive](https://developer.apple.com/videos/play/wwdc2018/416)」是一个不错的参考。

## 总结

我们来总结今天所讲的内容。性能优化对开发者们来说是一件很有挑战性的事情。在过去几年里，苹果提供的工具帮助大量开发者优化了性能。长期以来，Snapchat 一直致力于改善其应用程序的启动体验，并推动降低终止率。去年，Snapchat 减少了 99% 预期之外的应用终止情况。使用该 Session 中介绍的工具，开发者们也可以做到这一点。

如果你对性能优化工具不熟悉，推荐看看 2020 年的「[Diagnose Performance Issues with the Xcode Organizer](https://developer.apple.com/videos/play/wwdc2020/10076/)」、「[What's New in MetricKit](https://developer.apple.com/videos/play/wwdc2020/10081/)」、「[Identify Trends with the Power and Performance API](https://developer.apple.com/videos/play/wwdc2020/10057/)」三个视频，以及 2019 年的「[Getting Started with Instruments](https://developer.apple.com/videos/play/wwdc2019/411/)」。深入了解了这些指标与工具之后，希望大家能够在这些工具的帮助下，提供性能最优的 App 给用户。作为练习，大家可以去 Xcode 的 Organizer 中看看 App 的性能趋势，使用 Instruments 中不同的模版来检测性能，写写 XCTest 来提前检测问题，用 MetricKit 来强化数据收集与分析。

本次的 Session 内容就到此为止了，希望大家能在读完后花一些时间开始尝试优化性能，多多加油。

