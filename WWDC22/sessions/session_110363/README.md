---
session_ids: [110363]
---

# WWDC22 110363 - App 包大小优化和 Runtime 上的性能提升

> 本文基于 [WWDC22 - Improve app size and runtime performance](https://developer.apple.com/videos/play/wwdc2022/110363/) 进行创作

## 前言

作为 `iOS` 开发者，我们每天都会与 `Swift` 或 `Objective-C` 打交道。在编写完代码之后，我们需要通过 `Xcode` 进行编译，然后运行在真机或者模拟器上面。这一看似习以为常的操作依赖于编译器和 `Swift` 或 `Objective-C` 的运行时。

今年 `Apple` 在 `Swfit` 和 `Objective-C` 的编译器和运行时上面做了许多优化和调整，使得基于 `Xcode 14` 开发或者以 `iOS 16,tvOS 16,watchOS 9` 为最低支持版本的 `App` 可以获得包大小的优化和 `Runtime` 性能的提升。值得一提的是，本文不会有新的 `API`，也不会涉及语法变动和新的 `Xcode Build Setting`。

> 对于 Runtime 感兴趣的读者可以查阅下方的文档。
>
> [Objective-C Runtime 官方文档](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Introduction/Introduction.html?language=objc#//apple_ref/doc/uid/TP40008048)
>
> [Swift Runtime 官方文档](https://github.com/apple/swift/blob/main/docs/Runtime.md)

今年在编译器和运行时带来的优化包括以下四个方面

- `Swift` 协议检查
- `Objective-C` 消息发送
- `Retain` 和 `Release` 调用
- `Autorelease` 自动省略

这些优化不需要修改你的代码，因为 `Apple` 做出的改动对于开发者来说是不可见的，你几乎不需要付出任何成本就可以获得这些优化。

## Swift 协议检查

### 什么是协议检查

`Protocol` 概念不论是在 `Objective-C` 中还是 `Swift` 中都是十分基础却又不可忽视的一大特性。自 `Swift` 诞生以来，`iOS` 生态圈内对于面向协议编程（POP）的追捧和热度持续攀升。因为随着软件复杂度的提高，如何保持各个模块之间高内聚、低耦合就成为了每个软件工程师值得思考的问题。在 `Swift` 的世界里面，`Protocol` 可以说是无处不在，整个 `Swfit` 最核心的编程理念中就包括了面向协议编程。

`Swift` 中关于 `Protocol` 的语法想必读者应该都已经熟练掌握了，下面我们从实际的代码中来理解什么是「协议检查」。

```swift
protocol CustomLoggable {
    var customLogString: String { get }
}
```

上面的代码定义了一个叫做 `CustomLoggable` 的协议，见名知意，这个协议的目的是实现自定义的输出，遵循该协议的类型具有 `customLogString` 这个只读计算属性。

```swift
func log(value: Any) {
    if let value = value as? CustomLoggable {
        ...
    } else {
        ...
    }
}
```

我们定义了一个 `log` 方法，这个方法中针对遵循 `CustomLoggable` 协议的对象进行了经典的 `if let` 操作。

```swift
struct Event: CustomLoggable {
    var name: String
    var date: Date

    var customLogString: String {
        return "\(self.name), on \(self.date)"
    }
}
```

接着我们定义了一个遵循 `CustomLoggable` 的 `Event` 结构体，这个结构体有 `name` 和 `date` 两个属性，同时为了遵循 `CustomLoggable` 协议，定义了 `customLogString` 属性的 `getter` 方法。

```swift
let event = ...
log(value: event)
```

然后我们将 `Event` 结构体的实例传给 `log` 方法，当我们执行这段代码的时候，`log` 方法通过使用 `as` 运算符来检查我们传入的 `value` 是否遵循了 `CustomLoggable` 方法。

> 关于 `is`、`as` 的区别，感兴趣的读者可以参考 [Type casting in swift : difference between is, as, as?, as!](https://abhimuralidharan.medium.com/typecastinginswift-1bafacd39c99)

上面代码中对于 `CustomLoggable` 协议的检查，编译器会尽可能在编译时优化掉。但编译器并不总是有足够的上下文信息来完成这项优化。因此，借助于在编译时计算出的协议检查「元数据」，协议的遵循性检查常常发生在运行时。有了「元数据」之后，运行时就知道特定对象是否真正遵循了 `CustomLoggable` 协议。

![MetaData in Runtime](./images/pic1.png)

协议检查的「元数据」一部分是在编译时产生的，但是相当大的一部分只能在 `App` 启动时得到，特别是使用**泛型**的时候。

### Swift 协议检查存在的问题

由于需要在 `App` 启动时去产出协议检查所需的 「元数据」，当代码中大量使用了协议之后，对启动时间的影响将不再是微乎其微，而是客观的数百毫秒。在真实世界的 `App` 中，产出「元数据」的耗时甚至会占到启动时间的一半。

### Swift 协议检查优化方案

那么问题来了，我们能不能提前计算好这些「元数据」呢？

答案是可以的，基于 `Swift` 新的运行时，协议检查所需的「元数据」会在启动时用到的所有动态库加载之前，作为 `dyld` 启动闭包的一部分去提前计算出来。

> 关于 `dyld` 和启动闭包，感兴趣的读者可以参考 [Staic linking vs dyld3](https://blog.allegro.tech/2018/05/Static-linking-vs-dyld3.html)
>
> 同时，`Apple` 也有关于启动优化的专题 `Session` - [WWDC17 - App Startup Time: Past, Present and Future](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwj3ro6fgsn4AhWESGwGHfQEBMEQtwJ6BAgGEAI&url=https%3A%2F%2Fdeveloper.apple.com%2Fvideos%2Fplay%2Fwwdc2017%2F413&usg=AOvVaw0Kw9oW-BQQbgrxhPswQhrJ) (如果链接失效，可以下载 [WWDC App for macOS](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwiw-NmHg8n4AhWrS2wGHXS2DCsQFnoECAcQAQ&url=https%3A%2F%2Fgithub.com%2Finsidegui%2FWWDC&usg=AOvVaw0BMsc4CmRW7ZlIdreuaFRA) 后搜索关键字观看)

最重要的是，这项优化不需要升级工程的最低部署版本，只需要 `App` 运行在 `iOS 16`、`tvOS 16` 或者是 `watchOS 9` 上就可以享受到 `Swift` 协议检查的优化，进而提升你的 `App` 启动速度。

> 相比于类型更加安全、语法更加现代的 `Swift` ，`Objective-C` 近些年来基本上是处于停滞的发展状态。但是今年 `Apple` 带来了 `Objective-C` 生态中可以说是近些年来最为令人振奋的改进和提升。包括消息发送的优化、`Retain & Release` 调用优化和 `AutoRelease` 自动省略优化。

## Objective-C 消息发送

对于 `iOS` 老司机来说，`Objective-C` 的消息发送是一个老生常谈的话题。对于初学者来说，要理解一个简单的方法调用背后的底层实现细节，就必须对整个消息发送流程有着足够清晰和深入的认知。推荐感兴趣的读者阅读 [Objective-C 消息发送与转发机制原理](http://yulingtianxia.com/blog/2016/06/15/Objective-C-Message-Sending-and-Forwarding/) 一文。

### objc_msgSend

> `Objective-C` 的消息发送和转发流程可以概括为：消息发送（Messaging）是 Runtime 通过 selector 快速查找 IMP 的过程，有了函数指针就可以执行对应的方法实现；消息转发（Message Forwarding）是在查找 IMP 失败后执行一系列转发流程的慢速通道，如果不作转发处理，则会打日志和抛出异常。

提到消息发送，就不得不提 `objc_msgSend` 函数。在 `Objective-C` 的世界里面，基本上所有的方法调用都会转化为消息发送，而消息发送的必经之路就是 `objc_msgSend` 。 相信有经验的开发者都知道 `objc_msgSend` 是基于汇编实现的，在 `M1/M2` 系列芯片统治 `ARM` 架构的当下，我们重点关注 `objc_msgSend` 在 `arm64` 上的实现。

```assembly
/********************************************************************
 *
 * id objc_msgSend(id self, SEL _cmd, ...);
 * IMP objc_msgLookup(id self, SEL _cmd, ...);
 *
 * objc_msgLookup ABI:
 * IMP returned in x17
 * x16 reserved for our use but not used
 *
 ********************************************************************/

```

上面的注释来自于最新的 [objc4-818.2](https://opensource.apple.com/tarballs/objc4/objc4-818.2.tar.gz) 中的 `objc-msg-arm64.s` 汇编源文件。

众所周知，每个 `Objective-C` 对象都有自己所属的类，而每个 `Objective-C` 的类都有一系列的方法。而每个方法都会有一个 `selector` 、一个指向方法实现的函数指针以及一些元数据。而 `objc_msgSend` 的任务就是接收一个对象和 `selector` ，查找对应方法的函数指针，然后跳转过去进而调用方法的具体实现。

下面我们以一个实际的例子来窥探 `objc_msgSend` 现阶段存在的问题。

```objective-c
// Method calls using objc_msgSend

NSCalendar *cal = [self makeCalendar];

NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
dateComponents.year = 2022;
dateComponents.month = 6;
dateComponents.day = 6;

NSDate *theDate = [cal dateFromComponents:dateComponents];

return theDate;

```

上面的代码首先创建了一个 `NSCalendar` 对象 `cal` ，然后创建了一个 `NSDateComponents` 对象，并声明了 `2022-6-6` 作为日期值。最后通过调用 `cal` 对象的实例方法 `dateFromComponents` 得到一个 `NSDate` 对象并返回。

![Assembly Code - Part 1](./images/pic2.png)

我们将目光放到编译器生成的汇编代码部分上。我们可以看到，左侧每一行方法的执行几乎都会对应到右侧汇编代码中对 `_objc_msgSend` 的调用，即使像我们通过点语法去设置 `dateComponents` 对象的属性这样的场景。这是因为 `Objective-C` 是一门动态语言，在代码编译时我们并不知道需要调用哪个方法，所以只能在运行时通过 `objc_msgSend` 来做这件事情。

> 对于 `ARM 64` 汇编感兴趣的读者可以参考 [iOS 开发同学的 arm64 汇编入门](https://blog.cnbluebox.com/blog/2017/07/24/arm64-start/)

![Assembly Code - Part 2](./images/pic3.png)

对于 `objc_msgSend` 来说，我们需要告诉它 `selector` 是什么，以及是在什么对象身上去调用 `selector`，所以如上图所示，在真正执行 `bl _objc_msgSend` 之前，还需要做一些准备工作。

```assembly
adrp x1, [selector "dateFromComponents"]
ldr x1, [x1, selector "dateFromComponents"]
bl _objc_msgSend
```

上面的三条汇编指令体现在应用程序最终生成的二进制中，会占用一定的空间。在 `ARM64` 架构上，每条指令占用 `4` 个字节。因此，每一条 `objc_msgSend` 的调用都会有 `12` 个字节的空间开销。从单条指令来看这不是什么大问题，但是从更宏观的角度来分析，每一个方法调用，每一个属性的设置背后都伴随了一个 `12` 字节的 `objc_msgSend` 的指令调用，对于整个 `App` 的包大小是有着不不小的影响的。

![Assembly Code - Part 3](./images/pic4.png)

### Selector Stub 优化方案

我们在上一小节中可以看到，在真正执行每条 `_objc_msgSend` 汇编指令之前，都需要两条汇编指令共计 `8` 个字节来专门为 `selector` 做准备工作。有趣的是，对于任何的 `selector` 来说，这两条汇编指令是一模一样的。所以基于这一点，`Apple` 带来了 `Selector Stub` 优化方案。

![Assembly Code - Part 4](./images/pic5.png)

因为 \_`objc_msgSend` 指令前两条的准备指令对于不同的 `selector` 都是一样的操作，我们可以对于每个 `selector` 只执行一条指令，从而达到优化 `objc_msgSend` 指令调用的大小开销。

![Assembly Code - Part 5](./images/pic6.png)

如上图所示，我们将

`adrp x1, [selector "dateFromComponents"] `

`ldr x1, [x1, selector "dateFromComponents"]`

这两条指令提取后重构到 `_objc_msgSend$dateFromComponents` 指令中，然后原来的对 `bl _objc_msgSend` 的调用变成了对 `_objc_msgSend$dateFromComponents` 指令的调用。这个新的 `_objc_msgSend$dateFromComponents` 就是 `selector stub` 。但在 `selector stub` 内部，我们仍然需要调用 `_objc_msgSend` 指令，而在 `_objc_msgSend` 内部，又需要额外的几个字节来执行命令，这就是 `Call stub` 。

### 选择合适的优化策略

上一小节中的优化方案是尽可能的共享最多的代码，使得这些方法尽可能达到一个比较小的规模。但这会带来另外一个问题，那就是原本的一次 `objc_msgSend` 调用会变成了两次背靠背调用，这反过来又会对程序整体的性能造成影响。因此，我们基于上面的方案迭代出另一个版本来改进这一点。

![Assembly Code - Part 5](./images/pic7.png)

如上图右侧汇编伪代码所示，我们将我们之前创建两个 `stub` 方法合并为一个，通过这样的重构，我们的代码更加紧凑，同时也避免了过多的指令跳转。

`Apple` 为我们提供了两个优化策略：

* 专注于针对 `App` 包大小进行优化，需要通过设置 `-objc_stubs_small` 链接器 `lag` 获得最极致的包大小优化效果。
* 兼顾包大小优化的同时保证最佳的性能，这是默认的策略，无需手动开启。

>  `Apple` 给我们的建议是除非受到了非常严重的 `App` 包大小限制问题，尽量使用策略二来保证性能不受影响，所以这也就是为什么默认是包大小和性能的平衡策略。

通过 `Objective-C` 消息发送上的优化，在 `ARM64` 上之前 `12` 个字节的开销被压缩到了 `8` 个字节。这可以带来最高 `2%` 的包大小优化效果。即使你的 `App` 的最低支持版本低于 `iOS 16` ，只要是基于 `Xcode 14` 进行编译的话，就可以自动享受到 `Apple` 给我们带来的优化。

## Retain & Release 调用

### objc_retain 和 objc_release

### 自定义调用约定

## Autorelease 自动省略

### 什么是 Autorelease 自动省略

### Autorelease 自动省略存在的问题

### Autorelease 自动省略优化方案

## 总结
