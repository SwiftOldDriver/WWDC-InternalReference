---
session_ids: [110355]
---

# Session 110355 - Meet Swift Async Algorithms

> 作者：Rec ，极客时间 App 开发人员
> 
> 审核：Kem

> 注：（TODO 需要的话加上）

## 前言

阅读本文需要一定的基础，包括：
1. Async/Awit 对于异步方法的执行和实现，参考链接 [Meet async/await in Swift](https://developer.apple.com/videos/play/wwdc2021/10132) 
2. 了解 AsyncSequence 协议，理解其实现的原理，参考链接 [Meet AsyncSequence](https://developer.apple.com/videos/play/wwdc2021/10058)

不了解但有时间的同学可以先观看上面的视频。本文会对使用到的相关语法和结构做一些简单的解释，以保证不影响阅读。



## 正文

本文介绍的是苹果又一新开源包 Swift Async Algorithms ([Github 地址](https://github.com/apple/swift-async-algorithms)｜[Doc 地址](https://developer.apple.com/documentation/swift/asyncsequence))，主要用于实现 AsyncSequences 数据结构相关的算法。（TODO）除此之外，视频内还介绍了一个新的时间 Clock 协议。

开源包提议文件地址[GITHUB](https://github.com/apple/swift-evolution/blob/main/proposals/0298-asyncsequence.md)

文章介绍的顺序并不完全按照视频内讲述的方法的顺序。相对原视频更多的是补充和扩展，感兴趣的同学最多只要花花 13 分 01 秒就能观看完视频。

在阅读本文之前，我剧透的先提出几个问题：

第一个问题，在视频的一开始就提到了：
>  In short, if you know how to use Sequence, you already know how to use AsyncSequence.
也就是说 AsyncSequence 在使用上应该和 Sequence 保持了几乎一致的语法。这里是如何去实现的呢？


第二个问题，在 2021 年的 WWDC 上已经提出了 Meet the Swift Algorithms and Collections packages。在 2022 进一步的提出 Async Algorithms ，配合上 2021 年的 Meet AsyncSequence，让我好奇在异步条件下的那些组合算法又是如何实现的。


第三个问题，简介中是这么描述此 Session 的：
> We'll also share best practices for combining multiple AsyncSequences and using the Swift Clock type to work with values over time.
> 
> The Swift Async Algorithms package is a set of algorithms specifically focused on processing values over time using AsyncSequence.
上面两句话的关键词分别有：Swift Clock type，over time。通过描述可以了解到的一点是这个 package 和时间这个参数（类型）有比较大的关系。如果只是一个 Sequences 的话好像不应该和时间有关系，所以这里的时间指的是什么？


> 其实如果了解 Rx 和 Combine 的话，可以近乎的理解 AsyncSequence 分别对应的是 Operators 和 Publisher。虽然在 Swift 中协议的名字里还是 Sequence ，其实更像是 Stream 的概念（正如官方自定义的结构体 AsyncStream），这样更应该是为了使用方式的统一，包括协议里的方法。



## 多输入 AsyncSequence
对应的在 [Swift Algorithms](https://github.com/apple/swift-algorithms) 也有一系列的，针对多输入 Sequence 的算法。那么增加了异步这个特性，苹果的工程师们又是如何处理的呢？


### Zip

110355-Zip.png

在一般的 Zip 使用场景，我们是将两个需要匹配的序列，根据其中个数较少的，依次遍历然后进行处理。
在视频的例子中，videos 和 previews 都是 AsyncSequence。如果要实现像一般 Zip 算法效果，我们需要实现
1. 从两个 stream 中取到值，并将取到的两个值组合成元组一起上传
3. 取到的两个值保证顺序一致
4. 错误处理

```Swift
for try await (vid, preview) in zip(videos, previews) {
  try await upload(vid, preview)
}
```


视频中对此进行解释
1. await 语法能保证当 `vid` 和 `preview` 都取到值之后，才会继续执行 `upload`
2. 这里有兴趣的同学可以查阅 [AsyncSequence 视频](https://developer.apple.com/videos/play/wwdc2021/10058/)。视频第 4 分钟左右，从编译的角度来阐述了 for-await-in 和一般 for-in 实现的区别。
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

查看代码可以发现的是，两种类型的 Sequence 都有对应的生成迭代器的方法。同样的都是通过 next 方法获取下一个值。

查看 [AsyncZip2Sequence](https://github.com/apple/swift-async-algorithms/blob/main/Sources/AsyncAlgorithms/AsyncZip2Sequence.swift) 源码就可以发现，zip 中也是每次都调用两个 AsyncSequence 的对应的 next 方法。

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

而得到的流程图就会类似于：
```
AsyncSequence1:   "a-------b----c--------|"

AsyncSequence2:   "-1-----2---------3----|"
AsyncSequenceOut: "-(a,1)--(b,2)----(c,3)|"
```

3. 在 2 中关于方法实现的代码里，可以发现 iterator 里有返回错误的情况，next 方法有 rethrows 关键词。从代码的逻辑可以看出，是只要当其中一个 AsyncSequence 报错了，就会 zip 方法就会停止。

#### 延伸 1
自定义的 AsyncSequence 要怎么处理错误的情况呢？关键词：AsyncThrowingStream 


```Swift
class QuakeMonitor {
   var quakeHandler: ((Quake) -> Void)?
   var errorHandler: ((Error) -> Void)?

   func startMonitoring() {…}
   func stopMonitoring() {…}
}
```
Continuation 就是 AsyncStream 里持续传递值的结构体，同时也包含 stream 的结束 finish。
yield 方法就是传递值。
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
这里就可以拿到 finish(throwing:) 抛出的错误
```Swift
do {
     for try await quake in quakeStream {
         print ("Quake: \(quake.date)")
     }
     print ("Stream done.")
 } catch {
     print ("Error: \(error)")
 }
```    

#### 延伸 2
其他类似框架里的 zip 方法
[ReactiveX Zip](https://reactivex.io/documentation/operators/zip.html) 
[Combine Zip](https://developer.apple.com/documentation/combine/publisher/zip(_:)) 
需要处理的是，zip 方法在 Swift 和 ReactiveX 里都是作为 top level function，而 Combine 里是作为 Publisher 的实例方法

#### 延伸 3
在 Swift 的论坛中，继续讨论了 zip 的实现方向。
比如 [withLatestFrom](https://forums.swift.org/t/pitch-withlatestfrom/56487) 方法。对应的 [pull request](https://github.com/apple/swift-async-algorithms/pull/147) 还没有 merge 到主分支。

比如 [Do we want `forEach`?](https://forums.swift.org/t/do-we-want-foreach/56929) 讨论了 forEach 是否需要，以及和 for-in 用法的区别。

### Merge 
Zip 处理 AsyncSequence 成对的出现，那对应的不需要成堆就加入到新 AsyncSequence 中去的方法也有 Merge
[AsyncMerge2Sequence](https://github.com/apple/swift-async-algorithms/blob/main/Sources/AsyncAlgorithms/AsyncMerge2Sequence.swift) 和 zip 方法不一样的是，merge 方法里其中一个 AsyncSequence 返回了 nil 并不会导致方法结束。只有当所有的 AsyncSequence 都结束之后 merge 方法才会结束

### 补充
对于 AsyncSequence 的处理还有很多细节可以学习。
比如 zip/merge 方法内部的 next 方法里对于有值和无值使用了枚举的方式来处理。Merge 方法中设置的 state 来记录两个 AsyncSequence 的状态。
内部使用 Task 来完成异步调用，包括 Task 相关的优先级参数，返回值，等等

## 时钟 Clock
在 Swift 5.7 将会新增一组关于时间的 API ，现在还处在 Beta 阶段。[Clock 协议](https://developer.apple.com/documentation/swift/clock) 里现在定义了两种类型的时钟：[SuspendingClock](https://github.com/apple/swift/blob/2d2b6f26b597d20b58efc26165626c8d095cb07a/stdlib/public/Concurrency/SuspendingClock.swift) 和 [ContinuousClock](https://github.com/apple/swift/blob/2d2b6f26b5/stdlib/public/Concurrency/ContinuousClock.swift)。
这两者的区别就在于，后者 incrementing while the system is asleep。而且前者 not

苹果技术开发人员在视频里提到，与机器相关的比如动画使用 SuspendingClock。而与人相关的任务，则更适合 ContinuousClock。

用法截图.png

### 一些用法

```Swift
try await Task.sleep(until: .now + .seconds(3), clock: .continuous)

//let clock = ContinuousClock()
let clock = SuspendingClock()
var deadline = clock.now + .seconds(3)
//try await clock.sleep(until: deadline)
let elapsed = await clock.measure {
  await someLongRunningWork()
}
```

### Debounce
去抖动算法，在 Clock 的基础上实现

截图 9.17 。png

[AsyncChannel](https://github.com/apple/swift-async-algorithms/blob/a973b06d06f2be355c562ec3ce031373514b03f5/Sources/AsyncAlgorithms/AsyncChannel.swift)

查看 [Debounce](https://github.com/apple/swift-async-algorithms/blob/434591a571a8c4fe073500926414356d3b40f460/Sources/AsyncAlgorithms/AsyncDebounceSequence.swift) 源码会发现内部竟然是实现了一个 AsyncDebounceSequence 结构。


```Swift
let sleep: Task<Partial, Never> =  ...
let produce: Task<Partial, Never> = ...

switch await Task.select(sleep, produce).value {
case .sleep:
  ...
case .produce(let result, let iter):
  ...
```

这里抽取出 next 方法里核心的几行，大概也能理解 debounce 的实现逻辑：
分别建立了 sleep 和 produce 两个 Task，通过 Task.select 方法保证了执行完 sleep 之后才会执行 produce。
[TaskSelect](https://github.com/apple/swift-async-algorithms/blob/main/Sources/AsyncAlgorithms/TaskSelect.swift) 源码不展开解释，其实现的结果就是保证第一个 Task 完成。
作者在 Swift 社区上的 [讨论](https://forums.swift.org/t/pitch-promotion-of-task-select-from-swift-async-algorithms-to-swift-concurrency/56581)
[Github Guide](https://github.com/apple/swift-async-algorithms/blob/main/Sources/AsyncAlgorithms/AsyncAlgorithms.docc/Guides/Select.md)
300ms 内连续的响应，怎么确保这个 sleep 不会被叠加？




### chunked(by:)
根据一定时间分块的数据进行处理，同样利用了 [AsyncChunksOfCountOrSignalSequence](https://github.com/apple/swift-async-algorithms/blob/434591a571/Sources/AsyncAlgorithms/AsyncChunksOfCountOrSignalSequence.swift)

通过对应的测试代码 [TestChunk](https://github.com/apple/swift-async-algorithms/blob/434591a571/Tests/AsyncAlgorithmsTests/TestChunk.swift) 可以发现时间分块和计数分块是能够同时作为条件生效的。

11:50 截图

## Sendable
在查看源代码的时候会发现，会经常看到 Sendable 这个协议。
