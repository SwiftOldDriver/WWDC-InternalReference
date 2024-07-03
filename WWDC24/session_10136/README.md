摘要：

文章简要回顾 Swift 过去十年的历史，介绍社区通过工作组、扩展包生态和增加平台支持来促进 Swift 发展。还介绍一种默认实现数据竞争安全的新语言模式，以及一个允许在高度受限系统上运行的 Swift 语言子集。最后将探索一些语言更新，包括不可复制类型、类型化抛出和改进的 C++ 互操作性。

本文基于 [Session 10136](https://developer.apple.com/videos/play/wwdc2024/10136/) 梳理。

作者：

bq，野生 iOS 开发者，就职于字节剪映团队，喜欢音视频和图像处理，热爱摇滚与爵士，写完这句话就得要去洗菜做饭洗奶瓶了。

审核：

WWDC24 带来了 Swift 6，除了新版本的语言能力外还带来了工具链和社区的更新，本文从里程碑、Swift 项目升级、工具链和语言新特性几个方便展开介绍。

## 里程碑

Swift 项目今年是个重要里程碑，因为这已经是 Swift 从 WWDC2014 发布以来走过的第 10 年了。让我们回顾这 10 年 Swift 的演进过程。

![](images/20240703232903174)

- 2014 年：WWDC14 发布 Swift 1.0。
- 2015 年：发布 Swift 2.0，并正式开源；支持平台扩展到 Linux；为语言和标准库引入社区驱动的演进过程（evolution process）。
- 2016 年：发布 Swift 3.0，并推出 Swift Package Manager（SPM）。这也是第一个使用演进过程的语言版本，囊括了 80 多个社区提案。许多开发者也便获得了一次 Swift 从入门到重学的人生阅历。
- 2017 年：发布 Swift 4.0，吸取了之前“重学”的经验，同一个编译器可以支持多版本的语言了，让语言渐进式升级迁移成为可能。
- 2018 年：泛型系统改进，如条件一致性（conditional conformances）。也是为后面的 ABI 稳定奠定基础。
- 2019 年：发布 Swift 5.0，引入 ABI 稳定。同时 Swift 标准库被集成到操作系统，在所有 Swift 程序和框架之间共享，意味着 Swift 编写的 App 再也不用捆绑一个 Swift 标准库了（也不一定是个好事，例如所有的新特性从语言版本相关变成了系统版本相关）。同时该版本也引入 SwiftUI，让 UI 构建变成更加轻松（当真？）。
- 2020 年：Swift 覆盖更多平台，支持 Windows。
- 2021 年：引入了带有 Async/Await、Actor 和结构化并发的并发模型。
- 2022 年：引入了分布式 Actor，并继续完善并发模型，让构建网络服务更加轻松。同年，社区发布了 Swift 的 VSCode 扩展，为 Swift 开发提供了跨平台的编辑体验。
- 2023 年：引入了与 C++ 的双向互操作性，即双向调用，从此 Swift 混编 C++ 可以摒弃 Objective-C 或 C 胶水桥接层了，旨在用 Swift 的安全性和表现力补充 C++ 的不足。同时还引入了宏和 SwiftData。
- 2024 年：Swift 6.0。旨在提高可移植性、性能和整体开发体验。还引入 Swift 6 语言模式，提供数据竞争安全保证，帮助编写正确的并发程序。

## Swift 项目升级

### 新增社区小组

![](images/20240703232902856)

Swift 语言是一个更大的生态系统的一部分，其中包含工具、库（packages）以及一个充满活力的社区，也包含我们每个开发者。一开始，社区中，Swift Core 团队是唯一的指导小组，负责语言发展过程等等。随着社区的发展壮大，在过去几年中扩展了指导小组和工作组的规模。今年还引入了几个新的指导小组：

- Platform：平台小组，专注于扩展 Swift 的使用平台。
- Ecosystem：生态小组，专注于开发体验和更广泛的生态系统。
- Embedded：嵌入式小组，专注于继续下潜的低层嵌入式环境。

更多社区信息可关注 [swift.org/community](http://swift.org/community)。

### 官网升级

![](images/20240703232902364)

![](images/20240703232903147)

Swift 项目主页 Swift.org 做了升级，增加了入门指南和包管理栏目。

入门指南包含跨平台库和 Web 服务的入门教程。包管理（swift.org/packages）集成了 swiftPackageIndex.com，Swift Package Index 为所有库提供了多个 Swift 版本和各平台的包，便于开发者使用和选择。并在每个月更新展示提名的库，大家可以在 forums.swift.org 进行投稿。

![](images/20240703232902612)

![](images/20240703232903146)

![](images/20240703232902929)

[swift.org](http://swift.org) 博客参与发布些令整个 Swift 社区振奋人心的进展，例如 The Browser Company 发布 [Arc](https://arc.net/?issue=030&utm_source=Newsletter&utm_medium=email&utm_campaign=FatbobmansSwiftWeekly) 浏览器的 Windows 版本，其利用 Swift 的互操作性使用原生 UI 构建 Windows 程序。博客发布的《[Writing GNOME Apps with Swift](https://www.swift.org/blog/adwaita-swift/)》文章，描述了 result builder 为 GNOME 原生 UI 库带来了声明式语法。文章介绍了 Swift 6 的新功能，包迭代（Pack iteration）。包迭代简化了与值参数包交互的过程。例如，包迭代可以轻松为任意长度的元组实现等号操作符。

### Repo 迁移

![](images/20240703232902869)

![](images/20240703232903024)

在过去的 10 年里，Swift 成长了许多，结交了许多新朋友，度过了一些独特的经历，现在是时候进入自己的新篇章了。Swift 将从 github.com/apple/swift 下迁移到 github.com/swiftlang，并由  Swift 项目管理，包含 Swift 编译器、Foundation 和更多 Swift 生态库。迁移很快就开始进行，具体详细信息将发布到 swift.org。

## 工具链

### 平台支持

![](images/20240703232903331)

Swift 一直致力于发展为跨平台语言。如今 Apple、LInux 和 Windows 平台已正式支持 Swift。此外，社区正提出支持更多平台，如 WebAssembly。今年，Swift 继续扩展支持的 Linux 平台，包括 Fedora 和 Debian。

![](images/20240703232903180)

一开始，Xcode 是 Swift 的主要 IDE，为了适配不同的开发环境，推出了 SourceKit LSP，这是针对 Swift 的语言服务器实现，让 IDE 和编辑器能够集成对 Swift 支持。社区在 VSCode、Neovim、Emacs 等编辑器中均采用了 SourceKit LSP，让开发者编辑器和平台选择上有更大的自由。

VSCode 的 Swift 插件也随着 Swift 6 的到来迎来更新，具体可见 [Improvements to Swift in Visual Studio Code coming with Swift 6](https://forums.swift.org/t/improvements-to-swift-in-visual-studio-code-coming-with-swift-6/72708)。

### 交叉编译

![](images/20240703232903365)

交叉编译是我们常用的开发手段，如果你是位 iOS 开发者，可能每天都在使用交叉编译了。通过交叉编译，可以在一个环境中生成一个可执行文件，然后在不同的环境中运行。例如，可以在 macOS 构建 app，在 iPad 运行。现在，这个能力将要带到 Linux 上。这意味着，你可以在熟悉的 macOS 环境上开发构建，然后把编译好的程序部署到 Linux 服务器或容器上。

Swift 推出完全静态的 Linux SDK，帮助我们从 macOS 交叉编译到 Linux 。通过静态链接库，我们将不再需要在其他环境安装额外的包来运行编译的 Swift 程序。

我们来详细了解整个工作流程。我们使用一个 Swift 包，实现了一个简单的 REST API，可以随机返回一个猫猫 emoji。了解更多可查看《[Meet Swift OpenAPI Generator](https://wwdcnotes.com/documentation/wwdcnotes/wwdc23-10171-meet-swift-openapi-generator)》。

![](images/20240703232903367)

这里打开 3 个终端。左边是构建 Swift 包的地方。该终端登录到本地 macOS 机器上。右上角的终端也登录到本地 macOS 机器上。下面是一个与 Linux 主机 SSH 连接的终端。

首先我们先不使用交叉编译，在 macOS 本地编译、运行并完成测试。

![](images/20240703232903425)

1. 左 macOS 终端：在 macOS 通过 `swift build` 构建服务程序。通过 `file .build/debug/CatService` 可以查看生成的二进制文件是专为 macOS 构建的。
2. 右上 macOS 终端：`.build/debug/CatService`，在 macOS 执行该程序运行服务。
3. 左 macOS 终端：`curl ``localhost:8080/api/emoji`，向 localhost server 发出请求，并看到本地 server 的请求日志。

现在，我们交叉编译这个服务，实现在 macOS 编译，在 Linux 服务器上部署，直接运行。

![](images/20240703232903510)

1. 左 macOS 终端：`swift sdk install ~/preview-static-swift-linux-0.0.1.tar.gz`，在 macOS 安装完全静态的 Linux SDK。
2. 左 macOS 终端：`swift build --swift-sdk aarch64-swift-linux-musl`，为 Linux 构建二进制文件。
   1. `--swift-sdk aarch64-swift-linux-musl`：`swift-sdk` 指定针对哪个 SDK 进行构建，这里指定为 ARM64 Linux 环境编译并链接到 musl，生成一个静态链接的二进制文件，其可以在任何 Linux 机器上运行，甚至不需要安装 Swift runtime。
3. 左 macOS 终端：`file .build/debug/CatService`，检查构建产物，是 Linux 的可执行程序。
4. 左 macOS 终端：`scp .build/debug/CatService demo-linux-host:~/CatService`，将其复制部署到 Linux。
5. 右下 Linux 终端：`./CatService`，运行服务。
6. 左 macOS 终端：`curl demo-linux-host:8080/api/emoji`，从 Mac 向 Linux 发起请求。

这个过程通过使用 Swift 的完全静态 Linux SDK 从 macOS 交叉编译到 Linux 平台。可以在任意 Linux 机器上运行，甚至无需安装额外的运行时。

![](images/20240703232903342)

### Foundation

![](images/20240703232904687)

Foundation 是许多应用的重要组成部分，提供着基础且重要的 API 能力，包含 JSON 编解码、日期时间格式化、文件系统操作等。也是寿命最长的 Apple 框架之一，历史可追溯到 macOS X 的最初阶段。Foundation 框架是 Apple 平台的闭源框架，随着 Swift 开源，便启动了  swift-corelibs-foundation 项目供其他平台使用。2023 年引入了 [swift-foundation](https://github.com/apple/swift-foundation)，将 Foundation 框架从传统 C 和 Objective-C 重写为更现代、可移植的 Swift 版本，旨在所有平台使用一致、质量更高、性能更好的实现。

![](images/20240703232903817)

有了 swift-foundation，新功能和改进可以同时带到所有支持的平台，就像 Swift 本身一样。这个 Swift 实现于去年秋天首次在 iOS 和 macOS 中发布。甚至 Objective-C app 也能从这些改进中受益。而且，swift-foundation 是开源的，通过开放的演进过程来新增 API，甚至你也可以参与其中。例如 Predicate API 通过 swift-foundation 带到了 Swift 6 的所有平台。今年，它还获得了正则表达式的支持。

### Swift Testing

![](images/20240703232904462)

Swift Testing 是新推出的框架，易读、富有表现力、灵活可扩展。它利用了宏等现代 Swift 功能，并与并发框架无缝集成。Swift Testing 考虑了跨平台而开源开发的。它旨在无缝集成到多个平台 IDE 中，例如 Xcode 和 VSCode。Swift Testing 的愿景是成为 Swift 生态的官方默认测试解决方案。可以在 [Swift 演进愿景文档](https://github.com/swiftlang/swift-evolution/blob/main/visions/swift-testing.md)中阅读完整的 API 方向。

![](images/20240703232906133)

#### 简单使用

```Swift
// Swift Testing 

import Testing

@Test("Recognized rating")
func rating() {
    let video = Video(id: 2, name: "Mystery Creek")
    #expect(video.rating == "⭐️⭐️⭐️⭐️")
}
```

要声明测试，可以在函数中添加一个测试属性。可以提供一个自定义展示名称，作为测试属性的参数。这有助于理解测试的内容。可以通过使用期望（expect）来验证结果是否满足。这是一个宏，因此可以编写简单或复杂的 Swift 表达式。

```Swift
// Swift Testing 

import Testing

@Test("Recognized rating",
       .tags(.critical))
func rating() {
    let video = Video(id: 2, name: "Mystery Creek")
    #expect(video.rating == "⭐️⭐️⭐️⭐️")
}
```

Swift Testing 允许使用标签（tag）来组织和筛选测试项。

```Swift
// Swift Testing 

import Testing

@Test("Recognized rating",
       .tags(.critical),
       arguments: [
           (1, "A Beach",       "⭐️⭐️⭐️⭐️⭐️"),
           (2, "Mystery Creek", "⭐️⭐️⭐️⭐️"),
       ])
func rating(videoId: Int, videoName: String, expectedRating: String) {
    let video = Video(id: videoId, name: videoName)
    #expect(video.rating == expectedRating)
}
```

另外，还可以使用参数避免对多个输入重复相同的测试。

这些只是突出展示 Swift Testing 的一些功能，更多信息可以查看《[Meet Swift Testing](https://wwdcnotes.com/documentation/wwdcnotes/wwdc24-10179-meet-swift-testing/)》和《[Go further with Swift Testing](https://wwdcnotes.com/documentation/wwdcnotes/wwdc24-10195-go-further-with-swift-testing)》。

![](images/20240703232904115)

### 构建系统

除了 Swift 语言本身，Xcode 对构建系统也做了改进。

![](images/20240703232904282)

在理解构建系统时，先理解模块（Module）：模块是用于描述静态库或 Framework 的对外接口。模块分为 Swift 模块和 Clang 模块，后者是指 C/C++/Objective-C/Objective-C++ 的库。当代码使用 `import`、`#include` 语句时，则意味着对模块的使用和依赖。

以往，当编译构建 Swift 代码时，当代码依赖其他模块时，只能使用依赖模块的二进制产物，所以编译器依次递归编译依赖的模块。这一切都是隐式进行的，用户感知得到的可能是首次编译会带来比较长的耗时。虽然每个模块编译都可以并行，但依赖关系决定了模块之间存在固定的顺序，意味着构建过程失去了些并行性。此外，编译器完事后，调试器还必须要构建所有这些模块文件的调试器版本。这就导致了在调试器中首次打印变量时出现长时间的等待。

Swift 编译久、断点慢可能是大型 Swift 项目的必经之痛。早在两年前字节也推出的自己的解决方案 DanceCC，从 LLDB 角度优化了调试链路的性能与效率，详情可见 [字节跳动 DanceCC 工具链系列之Swift 调试性能的优化方案 - 掘金](https://juejin.cn/post/7095940115532349454)。而编译优化方面的实践则有 [bazel](https://bazel.build/) 为核心重建编译构建系统，如[抖音的 JoJo 构建系统](https://blog.csdn.net/ByteDanceTech/article/details/122749665)，通过分布式缓存和构建集群来提速构建，目标是构建缓存的极致利用。但还是始终无法绕过前面提到的模块依赖限制的串行构建流程。

#### 显式构建

![](images/20240703232903849)

如今，引入了显式构建。显式构建模块把这些隐式构建步骤转换为显式构建步骤，这意味着模块构建可以并行执行，并清楚地展示在构建日志中。这使得构建过程更加可预测和可靠。并且，调试器现在可以与编译构建共享二进制模块，从而加快调试速度。可以在 Xcode 构建设置中启用显式模块构建。了解更多信息，可查看《[Demystify explicitly built modules](https://wwdcnotes.com/documentation/wwdcnotes/wwdc24-10171-demystify-explicitly-built-modules)》。

![](images/20240703232904805)

## 语言新特性

Swift 6 引入了一种新的语言模式，实现了数据竞争安全，将 Swift 的安全保证带到了并发程序。此外，还有一个 Embedded Swift 的新语言子集，可以在高度受限的系统上运行。

Swift 6 实现了 [23 个演进过程提案](https://www.swift.org/swift-evolution/#?version=6.0)。下面按使用领域分了类，大家可以按需浏览。

工具链：

| SE-0435 | [Swift Language Version Per Target](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0435-swiftpm-per-target-swift-language-version-setting.md) |
| ------- | ------------------------------------------------------------ |
| SE-0301 | [Package Editor Commands](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0301-package-editing-commands.md) |

并发框架：

| SE-0431 | `@isolated(any) Function Types`                              |
| ------- | ------------------------------------------------------------ |
| SE-0434 | [Usability of global-actor-isolated types](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0434-global-actor-isolated-types-usability.md) |
| SE-0428 | [Resolve DistributedActor protocols](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0428-resolve-distributed-actor-protocols.md) |
| SE-0424 | [Custom isolation checking for SerialExecutor](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0424-custom-isolation-checking-for-serialexecutor.md) |
| SE-0423 | [Dynamic actor isolation enforcement from non-strict-concurrency contexts](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0423-dynamic-actor-isolation.md) |
| SE-0421 | [Generalize effect polymorphism for AsyncSequence and AsyncIteratorProtocol](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0421-generalize-async-sequence.md) |
| SE-0420 | [Inheritance of actor isolation](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0420-inheritance-of-actor-isolation.md) |
| SE-0418 | [Inferring Sendable for methods and key path literals](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0418-inferring-sendable-for-methods.md) |
| SE-0417 | [Task Executor Preference](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0417-task-executor-preference.md) |
| SE-0414 | [Region based Isolation](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0414-region-based-isolation.md) |

通用：

| SE-0432 | [Borrowing and consuming pattern matching for noncopyable types](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0432-noncopyable-switch.md) |
| ------- | ------------------------------------------------------------ |
| SE-0426 | [BitwiseCopyable](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0426-bitwise-copyable.md) |
| SE-0422 | [Expression macro as caller-side default argument](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0422-caller-side-default-argument-macro-expression.md) |
| SE-0416 | [Subtyping for keypath literals as functions](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0416-keypath-function-subtyping.md) |
| SE-0415 | [Function Body Macros](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0415-function-body-macros.md) |
| SE-0410 | [Low-Level Atomic Operations ⚛︎](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0410-atomics.md) |
| SE-0409 | [Access-level modifiers on import declarations](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0409-access-level-on-imports.md) |
| SE-0408 | [Pack Iteration](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0408-pack-iteration.md) |
| SE-0405 | [String Initializers with Encoding Validation](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0405-string-validating-initializers.md) |
| SE-0270 | [Add Collection Operations on Noncontiguous Elements](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0270-rangeset-and-collection-operations.md) |
| SE-0220 | `count(where:)`                                              |

### 不可复制类型

所有 Swift 类型，无论是值类型还是引用类型，默认情况下都是可复制的。不可复制类型（noncopyable types）抑制了这种默认的复制行为，常用于表达唯一所有权的场景。

```Swift
struct File: ~Copyable {
  private let fd: CInt
  
  init?(name: String) {
    guard let fd = open(name) else {
      return nil
    }
    self.fd = fd
  }

  func write(buffer: [UInt8]) {
    // ...
  }

  deinit {
    close(fd)
  }
}
```

例如，某个文件的读写，作为系统资源，可以写成一个不可复制的结构体。即使是结构体，定义成不可复制类型后，实例赋值时就不会发生拷贝。File 结构体构造时 open 文件，生成文件描述符，析构时 close 文件描述符。注意这里没有把文件描述符放到构造参数传入，而是把 open 和 close 都放在配套放到构造器和析构器中，这样可以防止外部文件 open 后，不小心插入了些 guard 语句终止了逻辑，导致 File 析构器没有执行而导致资源泄漏。

Swift 5.10 对不可复制类型的支持仅限于具体类型。Swift 6 则在泛型上下文以及标准库的关键泛型类型（如 Optional）引入了对不可复制类型的支持。这样就可以编写不可复制类型的的可失败构造器。

对泛型支持不可复制类型扩展了其使用场景，了解更多信息，可查看《[Consume noncopyable types in Swift](https://wwdcnotes.com/documentation/wwdcnotes/wwdc24-10170-consume-noncopyable-types-in-swift)》。不可复制类型除了用于表达唯一所有权，也可以用在对性能进行更细粒度的控制。例如在资源严重受限的低层系统中，拷贝副本可能带来过高的成本，不可复制类型可以用于解决这类问题。

![](images/20240703232904346)

### 嵌入式 Swift

低层系统在内存、存储和运行时能力方面会处处受限。由于占用空间小，C 和 C++ 一直是此类系统的主要编程语言，现在，Swift 也可以是一种选择了（为什么我不用 Rust🤔）。

嵌入式 Swift 是 Swift 的一个新的语言子集和编译模型，可以生成非常小的独立二进制文件，适用于高度受限的系统。它关闭了某些需要运行时支持的语言特性，如反射和 Any 类型，并使用编译器技术，例如使用完全泛型实例（full generics specialization）和静态链接来生成合适的二进制文件。

尽管关闭了一些语言功能，但嵌入式 Swift 子集已经非常接近“满血”Swift，并且可以轻松地继续编写惯用、易于阅读的 Swift 代码。

![](images/20240703232904530)

![](images/20240703232904553)

使用嵌入式 Swift，用 Swift 编写的游戏甚至可以在 Playdate 这样紧凑型游戏机上运行了，详见 [Swift.org - Byte-sized Swift: Building Tiny Games for the Playdate](https://www.swift.org/blog/byte-sized-swift-tiny-games-playdate/)。生成的二进制大小仅有几十 KB。除了游戏，嵌入式 Swift 还可以用于各种 ARM 和 RISC-V 微控制器，详见 [Swift.org - Get Started with Embedded Swift on ARM and RISC-V Microcontrollers](https://www.swift.org/blog/embedded-swift-examples/)。早在 2017 年，乐高的 EV3 已经可以用 Swift 了（详见 [Swift Playgrounds expands coding education to new devices - Apple](https://www.apple.com/newsroom/2017/06/swift-playgrounds-expands-coding-education-to-robots-drones-and-musical-instruments/)），那时还只是玩具状态，如今俨然发展成生产力了，可见 Swift 在嵌入式的野心不小。

![](images/20240703232904635)

Apple Secure Enclave 处理器也使用了嵌入式 Swift。Secure Enclave 是一个独立于主处理器的隔离子系统。致力于保护敏感数据的安全。嵌入式 Swift 为其带来了 Swift 语言的安全保证。结合 Swift 与 C/C++ 的互操作性，可以在嵌入式项目中逐步采用 Swift 编程。了解更多信息，可查看《[Go small with Embedded Swift](https://wwdcnotes.com/documentation/wwdcnotes/wwdc24-10197-go-small-with-embedded-swift)》。

![](images/20240703232904702)

### C++ 互操作性

去年，Swift 引入了与 C++ 的双向互操作性。Swift 可以直接与 C++ 相互调用，提供无缝的开发体验和零桥接成本。

![](images/20240703232904778)

Swift 6 继续扩展可互操作性，如今可以把 C++ 的虚方法、默认参数、仅移动类型和关键 C++ 标准库类型直接导入 Swift。C++ 的虚方法和默认参数映射到它们的等效 Swift 版本。

```C++
// C++
struct Person {
  Person(const Person&) = delete;
  Person(Person &&) = default;
  // ...
};
// Swift
struct Developer: ~Copyable {
    let person: Person
    init(person: consuming Person) {
      self.person = person
    }
}

let person = Person()
let developer = Developer(person: person) // Calls C++ move contructor
person.printInfo() // ❌ 'person' used after consume
```

C++ 仅移动类型映射到 Swift 中的不可复制类型。Swift 编译器在需要时插入对 C++ 移动构造器的调用。如果无意中试图复制不可复制的值，Swift 将编译报错。C++ 虽然使用广泛，但器缺乏安全保证使其容易受到安全攻击，可以在 C++ 项目中逐步采用 Swift，来提高安全性和生产效率。

了解更多关于 C++ 互操作性的信息，可观看去年的《[Mix Swift and C++](https://wwdcnotes.com/documentation/wwdcnotes/wwdc23-10172-mix-swift-and-c++)》。

![](images/20240703232904783)

### 类型抛出

Swift 具有一流的错误处理支持，用于在代码遇到特殊情况时抛出、传播和捕获错误。错误遵循 `Error` 协议，可以用于编写使用 `throws` 关键字抛出的函数。

```Swift
enum IntegerParseError: Error {
  case nonDigitCharacter(String, index: String.Index)
}

func parse(string: String) throws -> Int {
  for index in string.indices {
    // ...
    throw IntegerParseError.nonDigitCharacter(string, index: index)
  }
}

do {
  let value = try parse(string: "1+234")
}
catch let error as IntegerParseError {
  // ...
}
catch {
   // error is 'any Error'
}
```

以往，抛出的错误会被类型擦除，在 `catch` 闭包中识别为 `any Error` 类型。由于类型擦除会丢失错误的具体类型信息，因此常常需要插入动态类型检查。类型擦除还涉及装箱和拆箱，在没有运行时分配功能的高度受限系统中，也是种负担。

```Swift
enum IntegerParseError: Error {
  case nonDigitCharacter(String, index: String.Index)
}

func parse(string: String) throws(IntegerParseError) -> Int {
  for index in string.indices {
    // ...
    throw IntegerParseError.nonDigitCharacter(string, index: index)
  }
}

do {
  let value = try parse(string: "1+234")
}
catch {
   // error is 'IntegerParseError'
}
```

Swift 6 引入了类型抛出来解决该问题。类型抛出在函数中用 `throws` 指定具体的错误类型，指定后不会被类型擦除，`catch` 闭包中以抛出的具体错误类型出现。

```Swift
func parse(string: String) throws -> Int {
  //...
}

func parse(string: String) throws(any Error) -> Int {
  //...
}



func parse(string: String) -> Int {
  //...
}

func parse(string: String) throws(Never) -> Int {
  //...
}
```

类型抛出是错误处理系统的泛化。不指定错误类型的 throws，等效于 `throws(any Error)` 的类型抛出。非抛出函数等效于 `throws(Never)`。

类型抛出的等价转换让我们可以用统一的方式处理错误类型。例如，`map` 函数接受一个可以抛出错误的闭包，并将闭包映射到其元素上。使用类型抛出，可以在抛出和非抛出的情况下通用地编写 `map` 函数，避免了代码重复。

另一方面，类型抛出指定了 API 的错误类型，因此限制了 API 的演进，若希望保持错误类型的灵活性，则继续使用无类型抛出。

### 数据竞争安全

Swift 6 编译器带来了新的 Swift 6 语言模式，默认情况下实现数据竞争安全。

数据竞争是编写并发程序时常见的编程错误。当多个线程共享数据并且其中一个线程试图改变数据时，它们就会发生。数据竞争会导致意外的运行时行为、程序崩溃和难以复现的问题。自成立以来，数据竞争安全一直是 Swift 并发的主要目标，Swift 一直在朝着这个目标取得渐进的进展。

![](images/20240703232904897)

Swift 并发是围绕实现数据隔离的机制，用于保护可变状态的 Actor 和用于安全数据共享的 Sendable 设计的。Swift 5.10 在完整的并发检查标志下实现了数据竞争安全。

新推出的 Swift 6 语言模式默认实现数据竞争安全。将程序中的所有数据竞争问题转化为编译时错误。大幅提高程序的安全性并减少关键时刻（crunch-time）的调试难度。

使用新的语言模式可能会引入代码调整，但可以以模块为单位渐进式改造迁移。只有限定为 Swift 6 的模块才会开启数据竞争安全的编译检查。

另外，Swift 6 还对数据竞争检查做了调整。以往，为了确保安全，Swift 5.10 的完全并发检查禁止跨 Actor 隔离边界传递所有非 Sendable 的值。Swift 6 可以识别在无法再从原始隔离边界引用非 Sendable 值的情况下，传递非 Sendable 值这样的行为是安全的。

```Swift
class Client {
  init(name: String, balance: Double) {}
}

actor ClientStore {
  static let shared = ClientStore()
  private var clients: [Client] = []
  func addClient(_ client: Client) {
    clients.append(client)
  }
}

@MainActor
func openAccount(name: String, balance: Double) async {
  let client = Client(name: name, balance: balance)
  await ClientStore.shared.addClient(client) // Swift 5.10 ⚠️ Passing argument of non-sendable type 'Client' into actor-isolated context may introduce data-races
  // Swift 6 compiles successfully
}
```

例如，将不可发送的 Client 引用从 MainActor 传递给 ClientStore Actor，Swift5.10 的完全并发检查会引发编译器警告。

但是，Client 引用在发送到 ClientStore Actor 后不再在 MainActor 上引用。由于 MainActor 和 ClientStore Actor 之间没有共享 Client 的状态，因此不可能有数据竞争。随着 Swift 6 中对数据竞争检查的改进，此处的代码可以成功编译，不会触发警告。

```Swift
@MainActor
func openAccount(name: String, balance: Double) async {
  let client = Client(name: name, balance: balance)
  await ClientStore.shared.addClient(client) // ❌ Sending 'client' risks causing data-races
  logger.log("Opened account for \(client.name)")
}
```

而且，如果在将 Client 引用传递给 ClientStore Actor 后引入 Client 引用，编译器将引发错误，表示出现数据竞争。

除了 Actor 提供的高级同步模型之外，Swift 6 还带来一些新的低层原语。

```Swift
import Dispatch
import Synchronization 

let counter = Atomic<Int>(0)

DispatchQueue.concurrentPerform(iterations: 10) { _ in
  for _ in 0 ..< 1_000_000 {
    counter.wrappingAdd(1, ordering: .relaxed)
  }
}

print(counter.load(ordering: .relaxed))
```

Synchronization 模块引入了原子类型（Atomic）。它们对任何在平台上提供高效无锁实现的类型都是通用的。原子值应始终存储在 let 属性中，以确保安全的并发访问。

原子类型上的所有操作都是显式的，内存排序参数类似于 C/C++ 内存模型。

```Swift
import Synchronization

final class LockingResourceManager: Sendable {
  let cache = Mutex<[String: Resource]>([:])
  
  func save(_ resource: Resource, as key: String) {
    cache.withLock {
      $0[key] = resource
    }
  }
}
```

Synchronization 模块还引入了互斥锁（Mutex）。像原子类型一样，互斥锁应也该存储在 let 属性中，并且可以安全地同时并发访问。

对受互斥锁保护的存储的所有访问都是通过传递给 `withLock` 方法的闭包进行的，该方法确保互斥访问。

借助用于增量迁移的基础架构、改进的数据竞争检查和用于同步的低层原语，Swift 6 为编写安全的异步代码提供了必要的工具。有关迁移的最佳实践，请遵循《[Migrate your app to Swift 6](https://wwdcnotes.com/documentation/wwdcnotes/wwdc24-10169-migrate-your-app-to-swift-6)》中的实践教程。

![](images/20240703232904906)

## 结语

Swift 6 是 Swift 诞生十年后开启的新征程，期待 Swift 的下一个十年给我们带来精彩的开发体验。