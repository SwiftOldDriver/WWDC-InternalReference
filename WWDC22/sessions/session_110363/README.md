---
session_ids: [110363]
---

# WWDC22 110363 - App 包大小优化和 Runtime 上的性能提升

> 本文基于 [WWDC22 - Improve app size and runtime performance](https://developer.apple.com/videos/play/wwdc2022/110363/) 进行创作

<!--待插入思维导图-->



## 前言

作为 `iOS` 开发者，我们每天都会与 `Swift` 或 `Objective-C` 打交道。在编写完代码之后，我们需要通过 `Xcode` 进行编译，然后运行在真机或者模拟器上面。这一看似习以为常的操作依赖于编译器和 `Swift` 或 `Objective-C` 的运行时。

今年 `Apple` 在 `Swfit` 和 `Objective-C` 的编译器和运行时上面做了许多优化和调整，使得基于 `Xcode 14` 开发或者以 `iOS 16,tvOS 16,watchOS 9` 为最低支持版本的 `App` 可以获得包大小的优化和 `Runtime` 性能的提升。值得一提的是，本文不会有新的 `API`，也不会涉及语法变动和新的 `Xcode Build Setting`。 

> 注：对于 Runtime 感兴趣的读者可以查阅下方的文档。
> 
> [Objective-C Runtime 官方文档](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Introduction/Introduction.html?language=objc#//apple_ref/doc/uid/TP40008048)
> 
> [Swift Runtime 官方文档](https://github.com/apple/swift/blob/main/docs/Runtime.md)

今年在编译器和运行时带来的优化包括以下四个方面

* `Swift` 协议检查
* `Objective-C` 消息发送
* `Retain` 和 `Release` 调用
* `Autorelease` 自动省略

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

协议检查的「元数据」一部分是在编译时产生的，但是相当大的一部分只能在 `App` 启动时得到，特别是使用**泛型**的时候。


### Swift 协议检查存在的问题

### Swift 协议检查优化方案

## Objective-C 消息发送

### Objective-C 消息发送的前世今生

### Selector Stub 优化方案

### 选择合适的优化策略

## Retain & Release 调用

### objc_retain 和 objc_release

### 自定义调用约定

## Autorelease 自动省略

### 什么是 Autorelease 自动省略

### Autorelease 自动省略存在的问题

### Autorelease 自动省略优化方案

## 总结

