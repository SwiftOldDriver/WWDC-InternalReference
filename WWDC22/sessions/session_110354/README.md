---
session_ids: [110354]
---

# WWDC22 110354 - Swift 新特性介绍

>作者：汤圆，iOS 开发。
>
>审核：Kem
>
>本文基于 [Session 110354](https://developer.apple.com/videos/play/wwdc2022/110354/) 梳理。

本文将对 Swift 5.7 的新特性进行介绍，主要分为以下五个部分：

    1.社区最新动态

    2.Swift Package

    3.Swift 底层性能优化

    4.Swift 并发模型

    5.Swift 语言优化

## 社区最新动态
随着 [DocC](https://juejin.cn/post/7083677416119336974) 的发布和 Swift.org 网站的开源，越来越多的 Swift 项目对社区开放。苹果此前组织了两个工作组，一个针对 Swift 服务端应用(SSWG)，一个针对 Swift 多样性。今年又开启了两个新的工作组，一个针对 Swift.org 网站迭代，一个针对 C++ 互用性。如果开发者对上述领域感兴趣，可以申请加入以上工作组。此外，为了更好地帮助新入门及想要在特定领域深入学习的开发者，Swift 多样性工作组在去年引入了导师计划，并且由于反响较好，导师计划今年仍将持续。如果想要了解更多细节可以访问 [Swift.org](https://www.swift.org/)。

同时，苹果简化了 Linux 平台的 Swift 工具链安装流程，现在可以在 [Swift.org](https://www.swift.org/) 下载对应的 RPM 包。为了鼓励 Swift 在不同场景的应用，苹果还缩减了 Swift 标准库的大小，本地实现了 Unicode 支持，移除了外部依赖。

## Swift Package

### TOFU

SwiftPM 引入了 TOFU(Trust On First Use) 安全机制，会在首次下载时记录包的指纹，并在后续下载时进行校验。

### Command Plugin & Build Plugin

命令插件可以帮助开发者优化工作流，比如用于注释自动生成、源代码格式调整和测试报告自动生成等。通常我们会使用 shell 来编写命令插件，现在 Swift 也支持了。开发者可以使用 Command Plugin 将开源插件集成到 Xcode 或 SwiftPM 中。开发者也可以使用构建插件在构建时注入额外步骤，比如源代码生成或特定资源处理。如果想要了解 Swift 插件的工作原理和如何编写 Swift 插件，可以参考 [Meet Swift Package plugins](https://developer.apple.com/videos/play/wwdc2022/110359/) 和 [Create Swift Package plugins](https://developer.apple.com/videos/play/wwdc2022/110401/)。

### 命名冲突

当两个独立的包具有同名模块时，会产生命名冲突。Swift 5.7 允许开发者在包外对同名模块进行重命名，以此来解决命名冲突问题。

## Swift 底层性能优化

### 构建性能

苹果重写了 Swift Driver(Swift 编译器驱动程序)，之前 Swift Driver 是作为一个独立的可执行文件，现在 Xcode 构建系统已经将 Swift Driver 集成到内部，提高了构建速度。如果想要了解更多可以参考 [Demystify parallelization in Xcode builds](https://developer.apple.com/videos/play/wwdc2022/110364/)。

### 类型检查性能

苹果重构了泛型系统中根据 Protocol 和 where 分句推导方法签名的部分。重构前，随着涉及 Protocol 数量的增加，编译期类型检查的时间会呈现指数级增长；重构后编译期类型检查时间大幅减少。

Swift 5.7 之前，iOS App 启动时进行类型检查大概需要 4s 左右。每次 App 启动都要重新进行类型检查计算，这导致协议越多，耗时就越久。Swift 5.7 会对计算结果进行缓存，可以提高运行时类型检查的性能，缩短 App 启动时长。如果想要了解更多可以参考 [Improve app size and runtime performance](https://developer.apple.com/videos/play/wwdc2022/110363/)。

## Swift 并发模型

Swift 5.5 引入了新的并发模型，Swift 5.7 主要针对数据竞争安全对并发模型进行了完善。Swift 并发模型支持 macOS 10.15、iOS 13、tvOS 13 和 watchOS 6以上系统。

Swift 强调内存安全，如果开发者在修改某个值的过程中读取它，会出现报错。而Swift 6的目标是实现线程安全，如果开发者在两个线程中都修改了同一个值，并且没有使用 actor，应该出现报错。为了实现线程安全目标，不但需要有强健的并发模型，还要有可选的安全检查来识别潜在的数据竞争。开发者现在可以通过在 Build Settings 中设置 Strict Concurrency Checking 来进行尝试。如果想要了解更多可以参考 [Eliminate data races using Swift Concurrency](https://developer.apple.com/videos/play/wwdc2022/110351/)。

关键字 distributed 可以用来修饰 actor 和 actor 的方法，表明 actor 可能部署在远端机器上。分布式的 actor 方法执行可能会由于网络原因失败，所以在外部调用 actor 方法时需要在 await 前面加上关键字 try。如果想要了解更多可以参考 [Meet distributed actors in Swift](https://developer.apple.com/videos/play/wwdc2022/110356/)。

苹果还把和 Swift 5.5 一起发布的用于处理 AsyncSequence 的开源算法打成包提供给开发者，使得跨平台部署更加灵活。如果想要了解更多可以参考 [Meet Swift Async Algorithms](https://developer.apple.com/videos/play/wwdc2022/110355/)。

为了提高并发性能，苹果也对 actor 进行了优化，actor 首先会执行优先级最高的任务。同时并发模型内置了防止优先级反转的机制，来确保低优先级任务不会阻塞高优先级任务。

苹果在 Instruments 工具里新增了 Swift Concurrency，可以帮助开发者排查性能问题。Swift Tasks 和 Swift Actors 提供了一系列可视化工具，帮助开发者优化并发代码。如果想要了解更多可以参考 [Visualize and optimize Swift concurrency](https://developer.apple.com/videos/play/wwdc2022/110350/)。

## Swift 语言

### if let

当我们使用 if let 或者 guard let 来展开可选值时，我们通常会使用相同的命名。例如:

```Swift
if let workingDirectoryMailmapURL = workingDirectoryMailmapURL {

}
```
在这种情况下，Swift 5.7 支持简写，可以直接省略等号及右边部分。例如:

```Swift
if let workingDirectoryMailmapURL {
    
}
```

### 返回类型推断

之前当分句只有一行返回代码时，返回类型推断才可以成功；而现在即使分句有多行代码或者控制流，返回类型推断也可以成功，不用再手动声明返回类型。

### 允许指针转换

Swift 很注重类型和内存安全，不会自动将不同类型的指针进行转换，这和 C 语言十分不同，这导致在 Swift 代码中调用 C 语言 API 时，可能会产生一些问题。所以针对引入的方法和函数，Swift 允许在 C 语言中合法的指针转换。

### Swift Regex

Swift 5.7 支持正则表达式。但是正则表达式的语法太过精简，导致经验丰富的开发者也可能需要一定时间才能理解一个复杂的正则表达式。所以 Swift 提供了 RegexBuilder 库，来支持编写可读性更强的正则表达式。Swift Regex支持在 macOS 13、iOS 16、tvOS 16 和 watchOS 9以上系统使用。如果想要了解更多可以参考 [Meet Swift Regex](https://developer.apple.com/videos/play/wwdc2022/110357/) 和 [Swift Regex: Beyond the basics](https://developer.apple.com/videos/play/wwdc2022/110358/)。

### 泛型声明

