---
session_ids: [110355]
---

# WWDC22 110355 - Meet Swift Async Algorithms

> 作者：Rec ，极客时间 App 开发人员
> 
> 审核：Kem

> （注：备注？）

## 前言

阅读本文需要一定的基础，包括：
1. Async/Awit 对于异步方法的执行和实现，参考视频链接 [Meet async/await in Swift](https://developer.apple.com/videos/play/wwdc2021/10132) 
2. 了解 AsyncSequence 协议，理解其实现的原理，参考视频链接 [Meet AsyncSequence](https://developer.apple.com/videos/play/wwdc2021/10058)

不了解但有时间的同学可以先观看上面的视频。本文会对使用到的相关语法和结构做一些简单的解释，以保证不影响阅读。

## 正文

本文基于 [Session 110355](https://developer.apple.com/videos/play/wwdc2022/110355/)梳理，介绍的是苹果又一新开源包 Swift Async Algorithms ([Github 地址](https://github.com/apple/swift-async-algorithms)｜[Doc 地址](https://developer.apple.com/documentation/swift/asyncsequence))，主要用于实现 AsyncSequences 数据结构相关的算法。

async-algorithms.png

除此之外，视频内还介绍了一个新的时钟 [Clock](https://developer.apple.com/documentation/swift/time-and-duration?changes=latest_major&language=o_8) 协议，将会在 Swift 5.7 新增，现在还处在 Beta 阶段。协议的内容主要可以分为三个部分：
1. Clock： 时钟类型：ContinuousClock/SuspendingClock
2. Instant： 时钟 Clock 的一个准确的瞬间（时间戳）
3. Duration：两个 Instant 之间做差

开源包提议文件地址[Github](https://github.com/apple/swift-evolution/blob/main/proposals/0298-asyncsequence.md)

本文介绍的顺序并不完全按照视频内讲述的方法的顺序。相对原视频更多的是补充和扩展，感兴趣的同学最多只要花花 `13 分 01 秒` 就能观看完视频。

在阅读本文之前，我剧透的先提出几个问题：

第一个问题，在视频的一开始就提到了：
>  In short, if you know how to use Sequence, you already know how to use AsyncSequence.
也就是说 AsyncSequence 在使用上和 Sequence 保持了几乎一致的语法。为什么要这么去实现？


第二个问题，在 2021 年的 WWDC 上已经提出了 Swift Algorithms 和 Swift Collections。2022 进一步的提出 Async Algorithms ，配合上 2021 年的 AsyncSequence，在异步下的那些组合算法又是如何实现的。


第三个问题，简介中是这么描述此 Session 的：
> We'll also share best practices for combining multiple AsyncSequences and using the Swift Clock type to work with values over time.
> ----
> The Swift Async Algorithms package is a set of algorithms specifically focused on processing values over time using AsyncSequence.
两句话的关键词分别有： Swift Clock ，over time。视频中提到的 Clock 类型能够支持 AsyncSequence 在时间上实现一些算法。那具体的实现逻辑是怎么样的呢？


> 其实如果了解 Rx 和 Combine 的话，可以近乎的理解 AsyncSequence 分别对应的是 Operators 和 Publisher。虽然在 Swift 中协议的名字里还是 Sequence ，其实更像是 Stream 的概念（正如官方自定义的结构体 AsyncStream）。这样更应该是为了和 Sequence 使用方式的统一，包括协议里的方法。

## 多输入 AsyncSequence
对应的在 [Swift Algorithms](https://github.com/apple/swift-algorithms) 有一系列的，针对多输入 Sequence 的算法。
支持多输入 AsyncSequence 的 [Swift Async Algorithms](https://github.com/apple/swift-async-algorithms) 算法好像有着一些相同的方法：
（注：需要修改）
Combining 类型的 `zip/chain/join`。但是由于底层数据格式的不同，大部分算法都是没有重合的

### Zip

zip-algorithms.png

在一般的 Zip 使用场景，我们是将两个需要匹配的序列，根据其中个数较少的，依次遍历然后进行处理。
在视频的例子中，videos 和 previews 都是 AsyncSequence。如果要实现像一般 Zip 算法效果，我们需要实现
1. 从两个 AsyncSequence 中取到值，并将取到的两个值组合成元组一起上传
2. 取到的两个值保证顺序一致
3. 错误处理

```Swift
for try await (vid, preview) in zip(videos, previews) {
  try await upload(vid, preview)
}
```

#### 如何取值
[AsyncSequence 视频](https://developer.apple.com/videos/play/wwdc2021/10058/) 第 4 分钟左右，从编译的角度来简单的阐述了 for-await-in 和一般 for-in 实现的区别。这里贴出代码方便阅读：

Sequence for-in
```Swift
/* Iterating a Sequence */
for quake in quakes {
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}

/* How the compiler handles iteration */
var iterator = quakes.makeIterator()
while let quake = iterator.next() {
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}
```

AsyncSequence for-await-in
```Swift
/* Iterating an AsyncSequence */
for await quake in quakes {
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}

/* How the compiler handles asynchronous iteration */
var iterator = quakes.makeAsyncIterator()
while let quake = await iterator.next() {
    if quake.magnitude > 3 {
        displaySignificantEarthquake(quake)
    }
}
```

可以发现的是，两种类型的 Sequence 都有对应的生成迭代器的方法，同样的都是迭代器调用 `next()` 方法获取下一个值。

继续查看 [AsyncZip2Sequence](https://github.com/apple/swift-async-algorithms/blob/main/Sources/AsyncAlgorithms/AsyncZip2Sequence.swift) 源码就可以发现，zip 中也是每次都调用两个 AsyncSequence 的对应的 `next()` 方法。

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
}

```

到这第一个问题就解决了。next 方法里会拿到两个序列返回的值。

这里需要解释一下 iteration 方法：iter1 和 iter2 对应着两个迭代器，res1 和 res2 对应着两个迭代器返回的结果。当两个迭代器都返回结果之后，group.next() 方法才算结束。group 这里是要保证 add 的 task 都返回值之后才算完成一次 next 调用，所以第二个问题也解决了。

> 保证的前提就是通过 TaskGroup 和 withTaskGroup

得到的流程图就会类似于：
```
AsyncSequence1:   "a-------b----c--------|"
AsyncSequence2:   "-1-----2---------3----|"

AsyncSequenceOut: "-(a,1)--(b,2)----(c,3)|"
```
#### 错误处理
在前面的关于方法实现的代码里，可以发现调用的几个方法里都有返回错误的情况，比如 next 方法有 rethrows 关键词。
从对应代码的逻辑可以看出，是只要当其中一个 AsyncSequence 报错了，也就是返回了 nil，zip 方法就会停止。

那么自定义实现的 AsyncSequence 要怎么处理错误的情况呢？关键词：[AsyncThrowingStream](https://github.com/apple/swift/blob/4b0824ce23c2576f15d85d2ddbb8ab14660b0d32/stdlib/public/Concurrency/AsyncThrowingStream.swift)

这里贴出官方的代码举例：
```Swift
class QuakeMonitor {
   var quakeHandler: ((Quake) -> Void)?
   var errorHandler: ((Error) -> Void)?

   func startMonitoring() {…}
   func stopMonitoring() {…}
}
```

Continuation 就是 AsyncStream 里用来处理值相关的结构体，
1. 传递值的方法： yield 方法
2. 结束并抛出错误的方法： finish(throwing: )
3. 当然也有直接结束的方法：finish()

```Swift
extension QuakeMonitor {
  static var throwingQuakes: AsyncThrowingStream<Quake, Error> {
      AsyncThrowingStream { continuation in
           let monitor = QuakeMonitor()
           monitor.quakeHandler = { quake in
               continuation.yield(quake)
           }
           monitor.errorHandler = { error in
               continuation.finish(throwing: error)
           }
           continuation.onTermination = { @Sendable _ in
               monitor.stopMonitoring()
           }
           monitor.startMonitoring()
       }
  }
}
```

这里就可以拿到 finish(throwing:) 抛出的错误。
```Swift
do {
     for try await quake in throwingQuakes {
         print ("Quake: \(quake.date)")
     }
     print ("Stream done.")
 } catch {
     print ("Error: \(error)")
 }
```    

#### 延伸
在 Swift 的论坛中，继续讨论了 zip 的实现方向。
比如 [withLatestFrom](https://forums.swift.org/t/pitch-withlatestfrom/56487) 方法,对应的 [pull request](https://github.com/apple/swift-async-algorithms/pull/147) 。这个方法处理的就是两个 AsyncSequence 已不同速率更新值的时候，使用的都是最新的值。

比如 [Do we want `forEach`?](https://forums.swift.org/t/do-we-want-foreach/56929) 讨论了 forEach 是否需要，以及和 for-in 用法的区别。

### Merge 
Zip 处理 AsyncSequence 成对的出现，那对应的不需要成对就加入到新 AsyncSequence 中去的方法也有，那就是 Merge

merge-algorithms.png

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

## 时钟 Clock

文档里对 Clock 协议是这么描述的：
```
A mechanism in which to measure time, and delay work until a given point in time.
```

字面意思的理解，就是将需要执行的任务延迟一定的时间执行了。仅仅如此的话，GCD 里的延迟函数也能实现，为什么还需要特意写了一个协议出来呢？

clock-protocol.png

视频里解释 Clock 想要解决的是一定时间之后唤醒任务。查看 [Clock 协议](https://developer.apple.com/documentation/swift/clock) 文档，现在内部定义了两种类型的时钟：[SuspendingClock](https://github.com/apple/swift/blob/2d2b6f26b597d20b58efc26165626c8d095cb07a/stdlib/public/Concurrency/SuspendingClock.swift) 和 [ContinuousClock](https://github.com/apple/swift/blob/2d2b6f26b5/stdlib/public/Concurrency/ContinuousClock.swift)。
这两者的区别就在于，后者 incrementing while the system is asleep，而且前者 not。与机器相关的比如动画使用 SuspendingClock。而与人相关的任务，则更适合 ContinuousClock。
（注：需要补充）

### Debounce
（注：需要补充）
去抖动，以一定的间隔来响应任务。对应的算法，是在 Clock 的基础上实现

debounce-algorithms.png

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
通过 Task.select 方法保证了 sleep 任务完成之后，然后接着执行 produce。

[TaskSelect](https://github.com/apple/swift-async-algorithms/blob/main/Sources/AsyncAlgorithms/TaskSelect.swift) 不展开解释源码，内部实现就是等到第一个任务有返回值的之后，并将这个任务返回。然后继续等待第二个任务有返回值

作者在 Swift 社区上关于 Task.Select 的 [讨论](https://forums.swift.org/t/pitch-promotion-of-task-select-from-swift-async-algorithms-to-swift-concurrency/56581)
以及对应 Github 上的文档 [Guide](https://github.com/apple/swift-async-algorithms/blob/main/Sources/AsyncAlgorithms/AsyncAlgorithms.docc/Guides/Select.md)

另外根据代码实现可以发现，debounce 算法的第一个有效返回值会在等待 300ms 之后返回。

（注： debounce 里的 task.select 和 withTaskGroup 比较）

### ContinuousClock

在 debounce 算法里，我们可以发现默认使用的就是 
```Swift
public func debounce(for interval: Duration, tolerance: Duration? = nil) -> AsyncDebounceSequence<Self, ContinuousClock> {
    debounce(for: interval, tolerance: tolerance, clock: .continuous)
  }
```

查阅 [ContinuousClock](https://github.com/apple/swift/blob/2d2b6f26b5/stdlib/public/Concurrency/ContinuousClock.swift) 源码：
会发现 clock.sleep 内部其实就是个 Task.sleep，也就是会阻塞当前代码的继续执行。另外关于 now 的实现也贴到此：
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

（注：对于 AsyncChannel 在 rx 和 combine 应该都有。可以接受信息并传递信息）


### chunked(by:)
根据一定时间分块的数据进行处理，同样是实现了 [AsyncChunksOfCountOrSignalSequence](https://github.com/apple/swift-async-algorithms/blob/434591a571/Sources/AsyncAlgorithms/AsyncChunksOfCountOrSignalSequence.swift) 结构

通过对应的测试代码 [TestChunk](https://github.com/apple/swift-async-algorithms/blob/434591a571/Tests/AsyncAlgorithmsTests/TestChunk.swift) 可以看到可以实现的算法结果。

algorithms-list.png


用法截图.png

### Clock 一些用法

```Swift
// 可以阻塞当前线程，延迟执行下一步
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
## 比较

文章的前面部分，主要阅读了一些算法和新增协议的源码。重点在于算法的实现，一些新东西的用法

仔细观察 AsyncSequence 这些方法，包括方法名，会发现这和面向过程框架里的 Rx 和 Combine 非常的相似

以 zip 方法举例：
[ReactiveX Zip](https://reactivex.io/documentation/operators/zip.html) 
[Combine Zip](https://developer.apple.com/documentation/combine/publisher/zip(_:)) 

从结果上来看，zip 方法的得到的结果是一致的，都是以相同速度来处理两个序列新增的值。

不一样的是
1. zip 方法在 Swift 和 ReactiveX 里都是作为 top level function，而 Combine 里是作为 Publisher 的 instance method
2. Rx 和 Combine 在语法上是面向过程的风格了，但是在 AsyncSequence 上是保持面向对象的风格
从网上找了一些简单的代码做对比
```
//rx
let ob1 = PublishSubject<String>()
let ob2 = PublishSubject<String>()
Observable.zip(ob1,ob2).subscribe { (event) in
    print(event)
}

// combine
let numbersPub = PassthroughSubject<Int, Never>()
 et lettersPub = PassthroughSubject<String, Never>()

 cancellable = numbersPub
     .zip(lettersPub)
     .sink { print("\($0)") }

// asyncSequence
for try await (vid, preview) in zip(videos, previews) {
  try await upload(vid, preview)
}
```

包括 merge/combineLatest/debounce 方法等等，这些都能够在这俩框架里找到相近的方法。

所以可以从另外一个角度来看这个 Session 的内容：
1. 在面向过程开发的框架里，视频里提到的这些方法几乎都已经有了，包括以时间为参数的算法
2. AsyncSequence 更像是面向过程中的发送事件的角色（AsyncStream，AsyncChannel）。而异步体现在了 async/await 的使用上
3. 实现了面向过程的结构和常见算法，然后新增 Clock 来支持基于时间上的面向过程处理。
4. 以面向对象的方式来实现了其他框架面向过程的开发。




