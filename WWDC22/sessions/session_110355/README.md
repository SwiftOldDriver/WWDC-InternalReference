---
session_ids: [110355]
---

# WWDC22 110355 - Meet Swift Async Algorithms

## 前言

阅读本文需要一定的基础，包括：

1. Async/Await 对于异步方法的执行和实现。可以观看 WWDC Session [Meet async/await in Swift](https://developer.apple.com/videos/play/wwdc2021/10132)，另外还可以阅读去年内参的两篇翻译文章
  [【WWDC21 10132/10133/10134】认识 Swift 中的异步与并发](https://xiaozhuanlan.com/topic/8627905413)
  [【WWDC21 10132】认识 Swift 的 Async/Await](https://xiaozhuanlan.com/topic/9307851264)
2. 了解 AsyncSequence 协议，理解其实现的原理，可以观看 WWDC Session [Meet AsyncSequence](https://developer.apple.com/videos/play/wwdc2021/10058)。苹果团队在力求 AsyncSequence 在语法和概念上近可能的接近 Sequence，利用 Async/Await 来表示这是异步序列的数据机构之外，包括序列的遍历，序列之间的处理等都保持了一样的语法。另外异步序列有一个标准行为：异步序列对应一个缓冲区（这个缓冲区可调整大小），异步序列一段时间返回多个值时会放到缓冲区中。而且会优先从缓冲区取值，这时候和一般的序列就是一样的表现。

## 正文

本文基于 [Session 110355](https://developer.apple.com/videos/play/wwdc2022/110355/) 梳理，介绍的是苹果又一新开源包 Swift Async Algorithms ([Github 地址](https://github.com/apple/swift-async-algorithms)｜[Doc 地址](https://developer.apple.com/documentation/swift/asyncsequence))，主要用于实现 AsyncSequences 数据结构相关的算法。主要可以分为以下几大类：

1. Combining 多个序列合并
2. Creating 从一种序列生成另一种序列
3. Chunk 根据数据的特点处理，包括分块，去重，筛选
4. Timing 在时间参数下返回数据
5. All Values 获取异步序列所生成的所有值

在本文中会详细解读多序列合并的算法 `Zip` 和时间参数下的去抖动算法 `Debounce`
在开源包提议文件 ([Github 地址](https://github.com/apple/swift-async-algorithms)) 中，对这个开源包出发的动机和未来的发展有更加详细的介绍。

![image](./images/async-algorithms.png)

除此之外，视频内还介绍了一个新的时钟 [Clock](https://developer.apple.com/documentation/swift/time-and-duration?changes=latest_major&language=o_8) 协议，将会在 Swift 5.7 新增，现在还处在 Beta 阶段。协议的内容主要可以分为三个部分：

1. Clock： 时钟类型：ContinuousClock/SuspendingClock
2. Instant： 时钟 Clock 的一个准确的瞬间（时间戳）
3. Duration：两个 Instant 之间做差

在阅读本文之前，我先提出两个问题：

> 1. 如何在异步的场景下实现那些常见的集合算法
> 2. AsyncSequence 是如何基于 Clock 进行实现的

## 如何在异步的场景下实现那些常见的集合算法

在 2021 年的 WWDC 上已经提出了 [Swift Algorithms](https://github.com/apple/swift-algorithms) 和 [Swift Collections](https://github.com/apple/swift-collections) 来支持常见的算法和集合。
同年也提出了 AsyncSequence 数据结构协议，而且在[提案](https://github.com/apple/swift-evolution/blob/main/proposals/0298-asyncsequence.md)里已经明确的表示，在语法上使用会和现有的 Sequence 保持一致。

2022 进一步的提出 Async Algorithms，就是在这样的基础上，实现了一些常见的集合算法（包括 `chain/merge/zip` 等等），同时针对异步场景下实现其他一些常见的算法。

让我们深入阅读 Zip 算法的源码。

### Zip

![image](./images/zip-algorithms.png)

我们在上传一个视频附件的时候，需要同时有对应创建的预览。在增加附件的时候，我们也许会采用多线程的方式处理，同时还需要处理好附件和预览的对应关系，然后将视频和预览成对的是上传。

在这样的处理方式下，代码复杂度和维护难度都有上升。而且考虑到业务需要，我们可能还需要将这些附件和预览以数组的方式存储和展示。而无论是元组类型的数组，还是两个 Sequence 利用 zip 方法处理，都需要我们分别处理好两个数据，然后增加合并逻辑。

而现在我们可以直接遍历两个 AsyncSequence 就可以达到相同的效果。

> 阅读官方代码截图，除了 `try await` 部分，会发现语法上是和一般序列是一样的

我们不妨自己先假设，如果需要实现 zip 方法，得到的结果和在一般 Sequence 数据结构下处理的一致。那需要实现的功能就有

1. 从两个 AsyncSequence 中都取到值
2. 取到的两个值保证顺序一致

得到的流程图就会类似于：

```
AsyncSequence1:   "a-------b----c--------|"
AsyncSequence2:   "-1-----2---------3----|"

AsyncSequenceOut: "-(a,1)--(b,2)----(c,3)|"
```

#### 如何取值

[AsyncSequence 视频](https://developer.apple.com/videos/play/wwdc2021/10058/) 第 4 分钟左右，从编译的角度来简单的阐述了 for-await-in 和一般 for-in 实现的区别。这里贴出部分代码方便阅读：

```Swift
/* 异步迭代 */
for await quake in quakes {
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}

/* 编译器处理异步迭代  */
var iterator = quakes.makeAsyncIterator()
while let quake = await iterator.next() {
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}
```

在 AsyncSequence 的 for-await-in 语法中，通过在其关联的迭代器类型上定义一个异步 next() 函数，获取序列中的下一个元素。
跟我们已经熟悉的 Sequence 基本一致，只是这里的 next 函数变成了 async 版本的。需要注意的是，在之前提到的 AsyncSequence [提案](https://github.com/apple/swift-evolution/blob/main/proposals/0298-asyncsequence.md) 里有指出，这里的 await 并不会等待整个结果，而是每一个元素。

继续查看 [AsyncZip2Sequence](https://github.com/apple/swift-async-algorithms/blob/main/Sources/AsyncAlgorithms/AsyncZip2Sequence.swift) 源码就可以发现， `next()` 方法在 withTaskGroup 闭里初始化了两个 AsyncSequence 的迭代 Task。

```Swift
public mutating func next() async rethrows -> (Base1.Element, Base2.Element)? {
  ···
  //group.addTask 可理解为在异步队列里添加任务
  group.addTask {
    var iterator = base1
    do {
      let value = try await iterator.next()
      return .first(.success(value), iterator)
    } catch {
      return .first(.failure(error), iterator)
    }
  }
  group.addTask {
    var iterator = base2
    do {
      let value = try await iterator.next()
      return .second(.success(value), iterator)
    } catch {
      return .second(.failure(error), iterator)
    }
  }
  ···

  if let result = await iteration(&group, &res1, &res2, &iter1, &iter2) {
    return (result, nil, nil)
  }

  if let result = await iteration(&group, &res1, &res2, &iter1, &iter2) {
    return (result, nil, nil)
  }
  
  guard let res1 = res1, let res2 = res2 else {
  return (.success(nil), nil, nil)
  }

  return (.success((res1, res2)), iter1, iter2)
  ...
```

后两个 return 的返回值比较好理解。对 res 返回值做了空判断并返回。那么这里 iteration 方法连续调用了两次为什么呢？让我们看看 iteration 实现的逻辑：

```Swift
...
guard let partial = await group.next() else {
  return .success(nil)
}
switch partial {
case .first(let res, let iter):
  switch res {
  case .success(let value):
    if let value = value {
      value1 = value
      iterator1 = iter
      return nil
    } else {
      group.cancelAll()
      return .success(nil)
    }
  case .failure(let error):
    group.cancelAll()
    return .failure(error)
  }
  // 和 .first 处理逻辑一致
case .second(let res, let iter):
...
```

查阅 withTaskGroup [文档](https://developer.apple.com/documentation/swift/withtaskgroup(of:returning:body:))，其含义是一定数量的 Task 合集，甚至可以用 for-in 语法来依次获取其中 Task 的返回值。 `group.next()` 更是手动控制版的 for-in 循环。所以连续调用两次 iteration 方法的目的就是手动的 next 两次，也就是分别执行了两个 Task 任务，到这取值功能就实现了。

还有一点需要提醒的是，`group.next()` 的返回值并不是按照 `.addTask` 方法的顺序去返回的。`withTaskGroup` 内部的 TaskGroup 是符合 AsyncSequence 协议的，所以 Task 的任务完成之后会把结果先放到异步序列的缓冲区。而 next 的取值会先从这个缓冲区去取值。如果缓冲区为空，那么就会等待其中一个任务的完成。

在 switch 代码里，只有当 res 是 `.success` 且 value 有值的时候，整个 `iteration` 的返回值才会是 `nil`，其他情况下的 `iteration` 都是有成功或失败的返回值。从结果上来看，除非两次 iteration 方法调用之后的 res 都有值，才会执行 return 两个 res 方法。

那么到这就可以实现从两个 `AsyncSequence` 取值且保证取值顺序一致。两个 `AsyncSequence` 都只调用了一次自己的 `next` 迭代方法。

#### 延伸

在 Swift 的论坛中，继续讨论了 zip 的实现方向。
比如 [withLatestFrom](https://forums.swift.org/t/pitch-withlatestfrom/56487) 方法，对应的 [pull request](https://github.com/apple/swift-async-algorithms/pull/147) 。这个方法处理的就是两个 AsyncSequence 已不同速率更新值的时候，使用的都是最新的值。

比如 [Do we want forEach?](https://forums.swift.org/t/do-we-want-foreach/56929) 讨论了 forEach 是否需要，以及和 for-in 用法的区别。

### Merge

Zip 处理 AsyncSequence 成对的出现，那对应的不需要成对就加入到新 AsyncSequence 中去的方法也有，那就是 Merge

![image](./images/merge-algorithms.png)

[AsyncMerge2Sequence](https://github.com/apple/swift-async-algorithms/blob/main/Sources/AsyncAlgorithms/AsyncMerge2Sequence.swift) 和 zip 方法不一样的是，merge 方法里其中一个 AsyncSequence 返回了 nil 并不会导致方法结束。只有当所有的 AsyncSequence 都结束之后 merge 方法才会结束
Merge 方法中设置了 state 来记录两个 AsyncSequence 的状态

```Swift
var state: (PartialIteration<Base1.AsyncIterator, Partial>, PartialIteration<Base2.AsyncIterator, Partial>)
...

case .first(let result, let iterator):
  do {
    guard let value = try state.0.resolve(result, iterator) else {
      if iter1TerminatesOnNil {
        state.1.cancel()
        return nil
      }
      return try await next()
    }
    return .first(value)
  } catch {
    state.1.cancel()
    throw error
  }
```

内部的代码可以发现，其实是对其中一个异步序列返回 nil 的情况下选择停止方法。只是 init 方法里 iterTerminatesOnNil 默认给的都是 false。
观察这里的 next 方法会发现 zip 方法忽视掉的一个代码逻辑 `next -> iterator -> task` ：

```Swift
switch state {
    case (.idle(let iterator1), .idle(let iterator2)):
        let task1 = first(iterator1)
        let task2 = second(iterator2)
        state = (.pending(task1), .pending(task2))
    ...
    case (.idle(var iterator1), .terminal):
        do {
        if let value = try await iterator1.next() {
          state = (.idle(iterator1), .terminal)
          return .first(value)
        } else {
          state = (.terminal, .terminal)
          return nil
        }
        } catch {
            state = (.terminal, .terminal)
            throw error
        }
    ...
```

### 补充

对于多 AsyncSequence 的处理还有很多细节可以学习:

1. 比如 zip/merge 方法内部的 next 方法里对于有值和无值使用了枚举的方式来处理
2. 内部使用 Task 来完成异步调用，包括 Task 相关的优先级参数，返回值，等等

### 注意

并不是所有异步生成的多个数据源处理都需要用到 Async Algorithms。一般的异步处理就足够满足的场景，就不需要滥用算法。

在上面提到的两个方法里，都是多个数据源合并成了一个输出结果。而且在 zip 方法里也详细的提到的了我们需要的是，等异步返回结果之后进行对应组合，然后继续下一步的处理代码。从数据处理上来说，如果出现其一个异步序列还有值的情况下，这个代码会一直处于等待状态。

## 时钟 Clock

文档里对 Clock 协议是这么描述的：

> A mechanism in which to measure time, and delay work until a given point in time.

视频里解释 Clock 想要解决的是一定时间之后唤醒任务。查看 [Clock 协议](https://developer.apple.com/documentation/swift/clock) 文档，现在内部定义了两种类型的时钟：[SuspendingClock](https://github.com/apple/swift/blob/2d2b6f26b597d20b58efc26165626c8d095cb07a/stdlib/public/Concurrency/SuspendingClock.swift) 和 [ContinuousClock](https://github.com/apple/swift/blob/2d2b6f26b5/stdlib/public/Concurrency/ContinuousClock.swift)。

这两者的区别就在于，后者 incrementing while the system is asleep，而且前者 not。官方建议与机器相关的比如动画使用 SuspendingClock。而与人相关的任务，则更适合 ContinuousClock。

![image](./images/clock-protocol.png)

另外在 Clock 的[提案](https://github.com/apple/swift-evolution/blob/main/proposals/0329-clock-instant-duration.md)里会找到一些相关的信息。
比如 GCD 里的也有 `DispatchWallTime/DispatchTime` 类型对应着 Clock 的 `SuspendingClock/ContinuousClock` 时钟类型。而 Clock 不仅是为 Swift Concurrency 功能提供这些时间的概念，同样也是作为一个 `uniform accessor` 统一入口。

![image](./images/clock-evolution.png)

如果了解过 Combine/Rx 的 `Scheduler`，会发现它对“时间”有一层额外的抽象，要求 `Scheduler` 去实现这一层抽象，例如：
[OperationQueue.SchedulerTimeType](https://developer.apple.com/documentation/foundation/operationqueue/schedulertimetype)
[DispatchQueue.SchedulerTimeType](https://developer.apple.com/documentation/dispatch/dispatchqueue/schedulertimetype)
[RunLoop.SchedulerTimeType](https://developer.apple.com/documentation/foundation/runloop/schedulertimetype)

### Debounce

去抖动，以一定的间隔来响应任务。对应的算法，是在 Clock 的基础上实现

![image](./images/debounce-algorithms.png)

查看 [Debounce](https://github.com/apple/swift-async-algorithms/blob/434591a571a8c4fe073500926414356d3b40f460/Sources/AsyncAlgorithms/AsyncDebounceSequence.swift) 算法源码，内部实现了一个 AsyncDebounceSequence 结构体。

看了之前的代码可以知道 AsyncSequence 的取值是通过实现 next 方法，让迭代器调用实现的。所以我们直接看 next 部分的核心代码：

```Swift
let sleep: Task<Partial, Never> =  ...
let produce: Task<Partial, Never> = ...

switch await Task.select(sleep, produce).value {
case .sleep:
  ...
case .produce(let result, let iter):
  ...
```

这里抽取出 next 方法里核心的几行，大概也能理解 debounce 的实现逻辑：建立了 sleep 和 produce 两个 Task。

```Swift
let deadline = (last ?? clock.now).advanced(by: interval)
let sleep: Task<Partial, Never> = Task { [tolerance, clock] in
  try? await clock.sleep(until: deadline, tolerance: tolerance)
  return .sleep
}
```

在 sleep 任务先在执行，直到 clock 到了指定的 deadline 之后才会有返回值 `.sleep`，再返回的就是 produce 任务。
通过 Task.select 方法保证了 sleep 任务完成之后，然后接着执行 produce。另外根据代码实现可以发现，debounce 算法的第一个有效返回值会在等待 300ms 之后返回。

[TaskSelect](https://github.com/apple/swift-async-algorithms/blob/main/Sources/AsyncAlgorithms/TaskSelect.swift) 内部实现就是等到第一个任务有返回值的之后，并将这个任务返回。然后继续等待第二个任务有返回值

```Swift
public static func select<Tasks: Sequence & Sendable>(
  _ tasks: Tasks
) async -> Task<Success, Failure>
where Tasks.Element == Task<Success, Failure> {
  let state = ManagedCriticalState(TaskSelectState<Success, Failure>())
  return await withTaskCancellationHandler {
    let tasks = state.withCriticalRegion { state -> [Task<Success, Failure>] in
      defer { state.tasks = nil }
      return state.tasks ?? []
    }
    for task in tasks {
      task.cancel()
    }
  } operation: {
    await withUnsafeContinuation { continuation in
      for task in tasks {
        Task<Void, Never> {
          _ = await task.result
          let winner = state.withCriticalRegion { state -> Bool in
            defer { state.complete = true }
            return !state.complete
          }
          if winner {
            continuation.resume(returning: task)
          }
        }
        state.withCriticalRegion { state in
          state.add(task)
        }?.cancel()
      }
    }
  }
}
```

1. withTaskCancellationHandler 闭包会在 Task.Select 的调用方取消任务之后，将 state.tasks 里的任务依次取消
2. withUnsafeContinuation 用在处理原有闭包方式处理的方法，通过 resume 方法实现 async/await 的方式传递值。相同作用机制的还有 withCheckedContinuation 闭包，前者性能更好，而后者有运行时检查。另外这俩闭包里的 resume 方法有且仅有一次
3. [ManagedCriticalState](https://github.com/apple/swift-async-algorithms/blob/db847ef41037d9b279cb51c6e167e5cb3f4abfdc/Sources/AsyncAlgorithms/Locking.swift) 用来处理临界变量的类，内部实现里用锁来保证状态的唯一
4. 关于 withCriticalRegion 资料比较少。可以猜测的是在遍历 tasks 的时候会将其他任务挂起，保留第一个任务执行。任务执行完成之后，通过 resume 方法返回

作者在 Swift 社区上关于 Task.Select 的 [讨论](https://forums.swift.org/t/pitch-promotion-of-task-select-from-swift-async-algorithms-to-swift-concurrency/56581)
在 Github [Guide](https://github.com/apple/swift-async-algorithms/blob/main/Sources/AsyncAlgorithms/AsyncAlgorithms.docc/Guides/Select.md) 文档上发现作者将 `withTaskGroup` 和 `Task.select` 两个方法做了比较

1. withTaskGroup 创建高效的子任务。 Task.select 只能是已存在的任务
2. withTaskGroup 在所有子任务完成之后返回。 Task.select 在第一个任务完成后返回
3. withTaskGroup 在等待返回时可以取消所有未完成的子任务。 Task.select 未选择的任务会继续运行
4. withTaskGroup 可以支持有 0 个子任务。 Task.select 至少需要 1 个任务

### ContinuousClock

在 debounce 算法里，我们可以发现默认使用的就是

```Swift
public func debounce(for interval: Duration, tolerance: Duration? = nil) -> AsyncDebounceSequence<Self, ContinuousClock> {
    debounce(for: interval, tolerance: tolerance, clock: .continuous)
}
```

查阅 [ContinuousClock](https://github.com/apple/swift/blob/2d2b6f26b5/stdlib/public/Concurrency/ContinuousClock.swift) 源码会发现 clock.sleep 内部其实就是个 Task.sleep，也就是会阻塞当前代码的继续执行。另外关于 now 的实现也贴到此：

```Swift
public static var now: ContinuousClock.Instant {
    var seconds = Int64(0)
    var nanoseconds = Int64(0)
    _getTime(
      seconds: &seconds,
      nanoseconds: &nanoseconds,
      clock: _ClockID.continuous.rawValue)
    return ContinuousClock.Instant(_value:
      .seconds(seconds) + .nanoseconds(nanoseconds))
}
```

嗯，代码里让我感兴趣的是这个 `_ClockID` 这属性

```Swift
enum _ClockID: Int32 {
  case continuous = 1
  case suspending = 2
}
```

从 [Clock](https://github.com/apple/swift/blob/ff387aeebcbb416d2b87c769d200675ca59d9672/stdlib/public/Concurrency/Clock.swift) 源码里发现定这是一个枚举？！所以这个 ID 不是真的时钟 ID。

提一句视频中使用到的 [AsyncChannel](https://github.com/apple/swift-async-algorithms/blob/a973b06d06f2be355c562ec3ce031373514b03f5/Sources/AsyncAlgorithms/AsyncChannel.swift) 结构体。
对于 AsyncChannel 在 rx 和 combine 就是对应的 `Subjects` 和 `Subject`，作为中间者接受信息并传递信息

### chunked(by:)

根据一定时间分块的数据进行处理，同样是实现了 [AsyncChunksOfCountOrSignalSequence](https://github.com/apple/swift-async-algorithms/blob/434591a571/Sources/AsyncAlgorithms/AsyncChunksOfCountOrSignalSequence.swift) 结构

通过对应的测试代码 [TestChunk](https://github.com/apple/swift-async-algorithms/blob/434591a571/Tests/AsyncAlgorithmsTests/TestChunk.swift) 可以看到可以实现的算法结果。

### Clock 一些用法

这里列举一些例子，来说明 Clock 可以做到的事和实现的效果

```Swift
// Task 会被挂起，直到时间结束继续被执行
try await Task.sleep(nanoseconds: 1 * 1_000_000_000) //nanoseconds 纳秒
try await Task.sleep(until: .now + .seconds(3), clock: .continuous)

// sleep 时长至少 1 秒，至多 1.5 秒。参数里的 lerance 代表着一定容差，容差在官方的解释就是利用这 0.5 秒更好更合理的分配 CPU 资源
try await Task.sleep(until: .now + .seconds(1), tolerance: .seconds(0.5), clock: .continuous)

// elapsed 可以得到 someLongRunningWork 方法执行花费的时间
let clock = SuspendingClock()
let elapsed = await clock.measure {
  await someLongRunningWork()
}
```

### other

贴出几乎所有方法的截图

![image](./images/algorithms-list.png)

在 [Github README](https://github.com/apple/swift-async-algorithms) 里可以看到关于这些方法的对应的系列和分类。

## 比较

在部分章节里中延伸了一些框架的提案，引用了论坛中比较精彩的讨论。在这些延伸内容，会发现不仅仅在讨论功能的实现的同时，也在和其他语言或者框架在做比对

仔细观察 Async Algorithms 这些方法，包括在文章中提到的，会发现这和面向过程框架里的 Rx 和 Combine 有很多相近的地方

以 zip 方法举例：

[ReactiveX Zip](https://reactivex.io/documentation/operators/zip.html) 地址

[Combine Zip](https://developer.apple.com/documentation/combine/publisher/zip(_:)) 地址

从结果上来看，zip 方法的得到的结果是一致的，都是以相同速度来处理两个序列新增的值。

不一样的是

1. zip 方法在 Swift 和 ReactiveX 里都是作为 top level function，而 Combine 里是作为 Publisher 的 instance method
2. Rx 和 Combine 在语法上是面向过程的风格了，但是在 AsyncSequence 上是保持面向对象的风格

从网上找了一些简单的代码做对比

``` Swift
//rx
let ob1 = PublishSubject<String>()
let ob2 = PublishSubject<String>()
Observable.zip(ob1,ob2).subscribe { (event) in
    print(event)
}

// combine
let numbersPub = PassthroughSubject<Int, Never>()
let lettersPub = PassthroughSubject<String, Never>()

 cancellable = numbersPub
     .zip(lettersPub)
     .sink { print("\($0)") }

// asyncSequence
for try await (vid, preview) in zip(videos, previews) {
  try await upload(vid, preview)
}
```

包括 merge/combineLatest/debounce 方法等等，这些都能够在这俩框架里找到相近的方法。

### Async Algorithms 替换 Rx

如果是在一些简单的数据源处理和同步，或者调用了几个上面提到的相近算法，那么我们只要自定义需要的 AsyncSequence 数据结构，就能够实现替换一些原本 Rx 实现的逻辑。

但是除了这种简单使用的情况下，在较为复杂的场景甚至是使用 Rx 实现的架构场景下，就不一定适合。

首先要清楚的是，Async Algorithms 是官方支持 AsyncSequence 数据的算法合集，是作为一种补充。AsyncSequence 其中的结果可以是异步生成连续的数据，也可以是一个数据的连续部分，比如下面的代码里返回的就是每一行的数据，并不会等到完整 `lines` 数据就开始执行循环内的代码：

```Swift
let url = URL(fileURLWithPath: "/tmp/somefile.txt")
for try await line in url.lines {
    ...
}
```

到这能看出官方对于 AsyncSequence 的定位的重点还是 Sequence。而 Rx 是一种面向过程开发的框架，面向过程的代码逻辑是，拿到一个数据之后进行再次处理得到新结果，或者根据结果通知状态刷新。不仅仅包含那些数据结构和方法，更重要的是编写代码的思维方式。

所以我们在这里讨论的是，主要是在某些场景下既可以使用这个官方的算法合集实现，也可以使用 Rx 框架实现。

## 总结

文章的主要内容介绍了新增的部分算法和 Clock 协议，并且深入阅读其实现的源码。在一步步探索的过程中，逐渐理解方法的实现和学习官方的示例代码，顺便查阅到一些类似方法之间的区别，甚至还能看到跨平台源码的实现。

Async Algorithms 开源包在 Swift Concurrency 方向上提供了更多更全的算法和支持，包括通用算法，时间概念相关的算法。从现在已有的能力来看，已经覆盖了比较常见的部分。而且苹果继续保持了 Swift 概念和语法的一致性，这也为我们更容易的使用提供了帮助。

在阅读相关提案和讨论的时候，大家的讨论也能帮助我们更好的理解框架和其用途。这些内容里包括了方法实现的方案和目的，以及和其他框架实现相比较。

所以我们可以跳出 Swift Concurrency 这个框架来看这个 Session 的内容：

1. 在面向过程开发的框架里，视频里提到的这些方法几乎都已经有了，包括以时间为参数的算法
2. AsyncSequence 更像是面向过程中的发送事件的角色（AsyncStream，AsyncChannel）。而异步体现在了 async/await 的使用上
3. 实现了面向过程的结构和常见算法，然后新增 Clock 来支持基于时间上的面向过程处理
4. 以面向对象的方式来实现了其他框架面向过程的开发
