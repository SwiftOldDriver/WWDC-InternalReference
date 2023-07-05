---
session_ids: [10170]
---

# Swift 结构化并发进阶

本文章基于 WWDC23 中 [Beyond the basics of structured concurrency](https://developer.apple.com/videos/play/wwdc2023/10170/) 进行创作

由于本课程是进阶类课程，在阅读本文之前，您需要对 `Swift Concurrency` 并发框架有所了解。您可以通过以下 Session 来掌握 Swift 并发的基础。
[Meet async/await in Swift](https://developer.apple.com/videos/play/wwdc2021/10132/) / [Protect mutable state with Swift actors](https://developer.apple.com/videos/play/wwdc2021/10133/) / [Explore structured concurrency in Swift](https://developer.apple.com/videos/play/wwdc2021/10134/) / [认识 Swift 中的异步与并发(该文章包含以上三个 Session)](https://xiaozhuanlan.com/topic/8627905413)
[Swift concurrency: Behind the scenes](https://developer.apple.com/videos/play/wwdc2021/10254/) / [Swift 并发编程：原理探究](https://xiaozhuanlan.com/topic/7604819352)
[Swift concurrency: Update a sample app](https://developer.apple.com/videos/play/wwdc2021/10194/)

## Contents


本文将先来结构化并发的任务层次结构，如何使用自动化任务取消、任务优先级传递和新增的任务本地值功能；然后将探讨任务组模式，以及不同模式的资源使用情况比较；最后我们将给予这些 Swift 并发新功能在服务器环境中追踪和分析并发任务的性能。

### 结构化并发在任务取消和优先级传递方面的优势

Swift 结构化并发能够通过明确的 `async`, `await` 语义来帮助理解阅读并发代码，与此同时能够执行可以并发的分支代码，以及跟踪异步回调结果的返回位置，这些异步代码会类似于 if 代码块和 for 循环块在同步代码中定义的控制流行为的体验。
在 Swift 并发框架中，使用 `async let` ，`task group` 任务组，或创建执行独立(`detached`)或普通 `Task` 任务来触发并发任务执行。但使用 async let 和任务组创建的任务是结构化的，而直接执行 `Task` 和独立 `Task.detached` 任务并非结构化并发。
与局部变量一样，结构化任务会在执行完毕前一直存在，并当任务超出作用域时自动被取消，这些特性使得结构化任务能够让你非常清晰的理解任务会存在多久，以及在何处结束。

![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882864880777.jpg)


因此建议在必要时，优先选择结构化并发任务，但本文讨论的结构化并发任务的优点不总适用于非结构化任务，这个后文会提到。

本文中，我们的代码将围绕一个厨房做汤的场景，做汤需要有三个步骤：

1. 切好食材
2. 腌制鸡肉
3. 将汤煮沸

最后汤才可以被上菜供客人食用。上述三个步骤中，切菜包含多个子任务，这些子任务可以被并发执行，但切菜、腌制和烹饪三个步骤需要按照顺序执行。
首先需要明白，父任务包含了子任务，是子任务的创建方和调用方，以做汤为例，makeSoup 是切菜 `chopIngredients(🥔,🥕,🧄)`, 腌制`marinate(🍗)`, 煮沸`boilBroth()`的父任务，而 `chopIngredients(🥔,🥕,🧄)`拥有三个子任务 `chop(🥔)`, `chop(🥕)`, `chop(🧄)`
这种层级关系就是任务树 Task Tree

![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882792394824.jpg)

结合该例子，我们围绕做汤来实现做汤的函数 `makeSoup()`，以下的例子是非结构化的并发实现，但不建议使用，比较和原因会在下面展开。

![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16883497426075.jpg)

由于每个步骤任务之间的以来关系，我们可以通过 async let 来创建对应数量的子任务，这些子任务与其父任务形成结构化关系(三个 `async let` 是三个子任务，`makeSoup()`是其父任务)，以下是结构化并发的实现，那结构化并发相较于非结构化并发，有什么益处呢？

![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16883496855870.jpg)

首先 Swift 并发任务是一种函数中的挂起等待，耗时任务完成后会返回结果，在等待过程中，也许不再需要该结果，那么与之对应的任务应该停止，或者返回部分结果或错误信息。在实际餐厅场景中，假设顾客下单后提前离开餐厅，我们需要停止已经在进行中的 `makeSoup()` 任务。
针对结构化并发，在任务超出范围时会被隐式取消，或者针对父任务 `makeSoup()` 手动执行 `cancelAll()`，那么任务树种的所有子任务都会被取消。而针对非结构化并发，你需要手动去针对每个单独任务显式调用 `cancel()` 来取消任务。

![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882865459988.jpg)


请注意任务的取消只是在 Swift 并发任务层面的取消，实际代码中还需要额外的手动抛出异常或释放资源，这点在文章开头提到的关联 Session 中有详细介绍。
![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882823835642.jpg)

既然任务树中的子任务可能会被父级任务批量取消，那么在我们执行消耗资源的子任务时，进行当前任务是否被取消的状态检查是有必要的，比如上述例子中，假设任务在父任务的 `guard` 之后被取消，那么我们可以在切菜的函数 `chopIngredients()` 中检查任务的取消状态，具体而言，我们可以通过 `Task.checkCancellation()` 来检查，当前任务假设被取消时，该方法会抛出 `CancellationError`错误，如果不做上述检查，那么耗时且消耗资源的切菜函数就会继续被执行下去。

![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882865944104.jpg)


该种方式的任务取消检查是一个同步操作，因此推荐无论在同步或异步的函数中，都在任务开始前进行该种检查。当任务运行时，使用`isCancelled` 或者`checkCancellation` 来检查任务取消状态很有用，但有时子任务可能已经在挂起等待状态，或没有代码在执行（例如自行构建的 `AsyncSequence`），此时对于任务的取消相应就需要用到 `TaskCancellationHandler`。
回到餐厅的场景，假设厨房中的厨师需要轮班换人，厨房中会按照顺序消耗订单做汤，但需要轮班换人时，需要取消当前厨师的所有做汤任务，在前述的做汤和切菜函数中我们已经正确处理了做汤过程的取消。
针对该场景，假设任务取消发生在 `makeSoup()` 之前，那么其函数内实现的任务取消判断就能正确处理取消事件并抛出错误；
![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882839998667.jpg)

但如果该异步函数在等待异步序列的下个元素，即`next()`方法，此时没有任务和代码在执行，无法通过显示轮询取消属性来判断任务是否被取消，这时候我们就需要 `TaskCancellationHandler` 来检测此时的取消事件，并退出异步的 `for` 循环。

![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882841537129.jpg)

`AsyncSequence` 由 `AsyncIterator` 来驱动，和普通的 `Sequence` 类似，异步序列定义了一个异步的 `next()` 函数作为迭代器来获取下一个元素，`next()`可能会返回一个元素或代表序列末尾的 `nil`。
许多异步序列都使用状态机实现的，在该例子中，我们使用 `withTaskCancellationHandler` 来在迭代器内部检查 `state` 状态机是否在运行，如果被取消，将同步调用 `onCancel` 内的闭包，由于状态机的 `state` 在不同的 `cancellation handler` 之间共享，因此可能会并发竞争，因此需要对状态机进行写入保护。

![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882848182534.jpg)

Swift 并发中，`actor` 对于封装和数据竞争写入保护非常有用，但针对我们的场景需要在状态机中修改和读取属性，因此 `actor` 不适合于我们的诉求。并且我们也无法保证在 `actor` 上执行的操作的顺序，因此我们也无法保证取消操作会被最先执行。
这里推荐使用苹果官方 Swift 开源库 [Swift Atomics](https://github.com/apple/swift-atomics)；与此同时，也可以使用 `GCD` 队列或锁来确保状态机中状态的原子性，以及解决写入竞争问题；因而我们无需在 `cancellationHandler` 中增加非结构化任务，也可以取消一个正在运行的状态机。下图展示的 `Swift Atomics` 库的订单状态机原子性实现。
![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882858596757.jpg)

综上，我们讨论了任务的取消，针对结构化的任务树，取消事件会从父级到最底一级被逐级传递；通过取消判断 `API` 抛出取消错误异常，可以无缝的安全处理取消事件；针对每个子任务的实现，都应当考虑事件驱动的取消相应和进行任务开始前的任务取消状态检查；时刻谨记，任务的取消只是任务状态的一个变化，并没有真正停止任务，每个任务对应的事件取消停止和资源释放需要由自己完成。

### 结构化任务的优先级

接下来我们讨论一下结构化任务树如何帮助传播任务优先级，并避免发生优先级倒置。
首先 Swift 并发任务的优先级将告诉操作系统当前任务有多紧急，比如用户点击一个按钮，该任务应该被立即执行，否则 APP 会表现为卡顿或停止响应；又比如需要从后端预加载内容列表，这种任务可以在后台静默进行；
其次是任务优先级倒置，也就是一个高优先级任务在等待一个低优先级任务；一般而言，操作系统优先执行高优先级的任务，发生优先级倒置时，高优先级任务会被低优先级任务而阻塞，从而无法及时释放资源，发生优先级倒置不一定会导致问题（可能出现延迟或死锁或无影响），但在任务调度中时应避免优先级倒置的发生。
默认情况下，一个结构化的任务树中的子任务会从父任务那继承任务优先级，我们的 `makeSoup()`在默认的中等优先级的任务中被调用，所有子任务也会被中等优先级被执行。假设来了一位 VIP 客人，并点了一道汤，为了满足 VIP 顾客的需求，我们需要优先为其烹饪汤，此时我们调度执行一个高优先级的 `makeSoup()`任务，那么其所有关联的切菜、腌制、煮沸的子任务都会被传递为高优先级，因此在高优先级的结构化任务中，Swift 并发确保了不会优先级倒置情况出现。但请注意因为不知道接下来最先完成哪个任务，Swift 在等待任务组的下一个结果会升级该任务组中所有子任务。在实际的 Swift 并发实现中，Swift 并发的运行时会创建高优先级的队列来执行高优先级任务，且高优先级任务会先于低优先级任务被执行，但任务的优先级的父级传递逻辑在任务的生命周期内是不可被改变的。
![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882910895296.jpg)

除了服务好 VIP 顾客，我们还需要考虑厨房的有限并发执行能力，厨房的菜板和人手有限，因此我们需要限制同时执行切菜任务的数量，基于该场景，回到我们的切菜任务的函数实现中，通过限制最多同时执行 3 个切菜任务，并在任务完成后继续添加更多新切菜任务，让切菜在有序并发中执行
![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882921203822.jpg)

如果对上述逻辑进行总结，那就是初始循环创建最大数量的并发任务，避免创建超出资源支持的任务数，然后一旦并行执行任务数达到最大数量，我们让后续任务进度等待状态，任何任务完成后调度新任务进行执行，直至最终所有任务被执行完毕。下面是一段伪代码来描述该逻辑，大家可以参考该逻辑来实现自己的结构化限制数量的并发任务调度。

![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882926485317.jpg)

回到刚才我们提到的厨师交接班而需要取消任务的场景，下面是一个餐厅运转任务的函数实现，主要包括三个函数，厨师开始交接班，下一位新厨师开始工作餐厅持续运转，交接班结束取消当前厨师的在执行的任务。
![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882932790019.jpg)

你会注意到，三个子任务都没有返回值，针对这种任务 Swift5.9 新增了 `DiscardingTaskGroup` API，这种类型的任务不会保留已完成子任务的结果，任务使用的资源在任务完成后会被立即释放，无需手动显示取消其余子任务，并且 `DiscardingTaskGroup` 也具有同级任务自动取消功能，如果任何子任务抛出错误，剩余任务也会被自动取消，基于该新 API 可以简化上述代码逻辑。
通过在餐厅结束时抛出 `TimeToCloseError()` ，该任务组会立即自动结束所有初始的轮班。
![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882935440760.jpg)

综上，新的 `DiscardingTaskGroup` API 能够在任务结束时自动释放所有资源，而无需像以往一样，收集所有任务的异步运行结果，这种自动优化有助于减少内存消耗；我们还在此推荐了一种基于 TaskGroup 结构化并发的，能够限制子任务并行数量的设计模式，并提供了伪代码范式。

### TaskLocal 任务绑定值

接下来我们聊聊 `TaskLocal`，`TaskLocal` 值就是 `Task` 绑定的私有全局值，不同 `Task` 对于该变量的访问将会得到不同结果；`TaskLocal` 值必须被定义为静态存储属性，受限于包装器 `TaskLocal Property wrapper` 的包装器的支持范围，不能定义为顶级属性；`TaskLocal` 对于包装类型限制必须实现 `Sendable` 协议。
以下面的代码为例，`cook` 为 `TaskLocal` 包裹的变量，在两个不同的任务中，相互隔离被赋予了不同的值，最终打印结果页不同，每一个任务都拥有自己独立的 `TaskLocal` 值，离开当前任务的作用域，`TaskLocal` 值也随即被释放了
![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16882991547808.jpg)

在执行任务时，父级任务会把 `TaskLocal` 包裹变量传递给子任务，子任务在访问时可以基于编译器优化，快速访问到对应的 `TaskLocal` 变量（时间复杂度 `O(n)`），下面的例子演示了 `TaskLocal` 的子任务传递和变量遮蔽效果，同时也可以观察到 `Task.detached{}` 类型的任务是六亲不认，不仅不能继承 `actor` 的上下文，对于 `TaskLocal` 变量也不能传递。
![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16883000689632.jpg)

### Swift 并发与全链路性能调优

接下来假设我们把做汤这件事从本地设备执行转移到服务器端来完成，我们的角色变成汤在被系统处理时对其进行观察，确保汤能够及时烹饪完成并监控和处理意外的错误。服务器能够并发处理许多请求，因此我们需要跟踪指定的订单信息。
手动埋点可以解决我们的跟踪诉求，但手动埋点往往需要重复冗长的埋点代码编写工作，这容易导致各种各样的人为错误，或者不小心在只想记录订单 ID 时，记录了不该记录的几百 kb 的完整订单信息。苹果环境中提供原生的 `OSLog API` 来记录埋点，但随着 APP 有更多功能迁移到云端，可以考虑使用苹果官方开源库 [SwiftLog](https://github.com/apple/swift-log)， SwiftLog 是一个拥有多种后端实现的日志库，允许你添加适合自己诉求的日志记录到后端，而无需变更服务器实现。
`MetadataProvider` 是 SwiftLog1.5 中新增的 API，该 API 可以帮助更加便捷的抽象日志记录逻辑，以便简化日志埋点并确保日志的一致性。
`MetadataProvider` 提供了一个数据合并的方法 `multiplex`，可以将多个元数据对象合并。
![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16883017052301.jpg)

结合 `TaskLocal` 包裹值类型，可以将当前任务树的元数据添加至 `SwiftLog MetadataProvider`，如此操作可以清晰的通过任务树结构传播附加的上下文信息至埋点数据库。
可以使用 Instruments 对 Swift 并发进行性能检测和调优，具体可以参照 [Visualize and optimize Swift concurrency](https://developer.apple.com/videos/play/wwdc2022/110350/) / [Swift 并发的可视化和优化](https://xiaozhuanlan.com/topic/0186237549)
![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16883021809884.jpg)

Instruments 还提供 HTTP 行为分析功能，详情请参照 [Analyze HTTP traffic in Instruments](https://developer.apple.com/videos/play/wwdc2021/10212/) / [强大的 Network Instruments - 诊断你的 APP 网络请求及流量控管](https://xiaozhuanlan.com/topic/2936041578)
结合两者的分析功能，可以对现有 HTTP 接口和并发进行性能调优。
在此介绍苹果官方开源库 [Swift Distributed Tracing](https://github.com/apple/swift-distributed-tracing) ，该工具可以透明的与现有服务端逻辑共存，主要设计用途是追踪分布式多线程系统性能。Swift 的并发任务树非常适合管理复杂任务层级，`Swift Distributed Tracing` 允许您利用跨平台的任务树的优势来深入追踪性能和任务之间的关系；其具有 `OpenTelemetry` 协议的实现，因此对于现有的 Zipkin 或 Jaeger 等性能追踪解决方案能做到开箱即用。建议大家使用 `Swift Distributed Tracing` 是为了能够让本地 Instruments 在追踪本地设备多任务性能，HTTP 访问性能，以及服务端程序的「不透明的响应过程」串联起来，发现整个链路中的瓶颈，只有将这些因素放在一起时，才能够清晰的发现并发任务的性能瓶颈所在，以便针对性的调优。

![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16883041861713.jpg)

`Spans` 允许我们在性能追踪系统中针对特定代码块进行记录， `Spans` 不需要完整覆盖整个 `function`，只需要对其中潜在耗时操作进行包裹即可，基于 `withSpan` API，其会使用额外的 `traceID` 和其他元数据来记录我们的代码片段性能，以及任务运行时的性能特征信息，从而允许买点系统将任务树合并到单个有效的追踪条目中，单个追踪条目会清晰的记录部分 Swift 并发任务的失败与耗时，以及任务树的互相影响结果。对于更多服务端和客户端性能一致追踪和信息归因的详细信息，请参照 [swift-distributed-tracing-extras](https://github.com/apple/swift-distributed-tracing-extras)

![](http://wwdc23.oss-cn-hangzhou.aliyuncs.com/2023-07-03-16883041668185.jpg)



综上，我们今天讨论了

- 结构化任务在任务取消上相较于非结构化任务的优势
- 结构化任务在任务优先级传递上的优势
- 结构化任务结合 TaskLocal 包裹值在单个任务中复用任务维度属性的优势
- 结构化任务在全链路性能追踪中的优势

希望大家能在实践中更好的使用现代化的 Swift 并发，取代上线 15+ 年的 `completionHandler`, `GCD`, `锁`的古董设计，实现更加简洁优雅的并发逻辑。
