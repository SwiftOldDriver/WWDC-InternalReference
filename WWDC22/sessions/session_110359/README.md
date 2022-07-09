---
session_ids: [110359]
---

# WWDC22 - Swift Package plugins 初探

## 引言

> 本文基于 WWDC22 [Session 110359](https://developer.apple.com/videos/play/wwdc2022/110359/) [Session 110401](https://developer.apple.com/videos/play/wwdc2022/110401/) 梳理。  

## Swift Package plugins 是什么

在 Xcode 11 引入了一个新的包管理工具 Swift Package Manager（以下简称 SPM）。

SPM 可以将库作为源代码进行分发，方便代码共享，支持管理依赖关系、版本控制，功能类似于 Cocoapods、Carthage。

在研发流程过程中，单纯的 SPM 并不能解决所有流程问题，比如构建之前需要生成一些源文件，构建过程中修改或生成一些代码。

SPM 目前不支持在构建期间执行任何自定义操作的方法，包括源生成以及特殊类型资源的自定义处理等等。

为了让我们研发流程更加自动化，减少手动完成的一些步骤（比如手动生成一些源代码并添加到项目），提高开发效率，Swift Package plugins 被提案并研发出来，Swift Package plugins 本质上是一个 Swfit 脚本，我们可以在 Xcode 14 及以上版本使用。

我们之前可以使用 SPM 来开发库代码、可执行文件等，现在我们可以继续基于 SPM 开发 plugins。也就是说如果想对外提供通用 Swift Package plugins 的话，需要使用 SPM 的方式。区别就是对 plugins 依赖不会将 plugins 代码引入到我们的应用程序中。

截止本文发布前，Github 上很多开源库均已开发 plugins 版本，例如  [DocC](https://github.com/apple/swift-docc-plugin) （Swift-DocC Plugin 支持为 SPM 库和可执行文件构建文档）、[SwiftGen](https://github.com/SwiftGen/SwiftGen/pull/926) （SwiftGen是一种为项目资源（如图像、本地化字符串等）自动生成 Swift 代码的工具）等。

## Swift Package plugins 能做些什么

首先来看一个开发 Case，我们开发需求的时候，都是需要使用图片资源，一般我们会把图片放到 Assets.xcassets 资源目录下，然后通过 UIImage(named: "") 方法根据名称获取到图片，进行布局展示。

如果我们可以直接用图片的名称常量来加载，而不是重复写大量的图片加载方法调用，是不是更方便？

那具体怎么实现呢？

之前你可能会想用各种脚本（shell、python、ruby、swift 等等）来编程实现，功能实现是没什么问题，但是怎么获取到 Assets.xcassets 目录，怎么自动生成代码后加载到项目中？虽然这些也可以实现，但是需要我们大量的开发。

而现在使用构建工具 plugins 很方便就可以实现，并且可以集成在 Xcode 构建过程中，开发方便，使用也很方便。

除了 构建工具 plugins，Xcode 14 还支持命令 plugins。下面分别介绍下。

### 命令 plugins 能做什么

命令 plugins 可以运行一些自定义的操作，例如代码格式化，代码扫描等。

也可以作为开发工作流中的一部分执行其他任务。例如：列举所有项目 Git 提交代码记录的所有人，或其他需要执行的一些脚本。

还可以直接修改项目中的文件，但是这需要请求写入权限。

你可能会说这些工作使用其他脚本语言（cmake、shell、python、ruby 等等）也可以实现啊，是可以实现，命令 plugins 的支持有两大优势：

1. 使用 swift 语言，业务开发代码可以复用，学习成本低
2. Xcode 可以直接开发，调试，运行，并直接集成到现有项目中，开发效率更高

### 构建工具 plugins 能做什么

构建工具 plugins 扩展了构建系统的依赖关系图，可以直接在构建过程中生成源代码或资源。例如：构建过程中自动生成多语言文件，自动替换图片等等。

跟命令 plugins 的区别：
构建工具 plugins 可以作用于单个 target，而命令 plugins 是作用于整个包或项目。

## Swift Package plugins 是如何工作的

![avatar](./images/pic5.jpg)

Package plugins 通过 Xcode 编译、运行，可以使用可执行文件和输入文件来构造命令，并将命令通信给 Xcode，Xcode 可以根据需要执行相关命令。执行完后， plugins 可以将结果返回给 Xcode，Xcode 基于结果发出警告或错误。

Plugins 可以访问包的内容（包括源文件），也可以获取任何包依赖项的信息，可以调用命令行工具，也可以创建目录和文件。需要注意的是 Package plugins 修改包的源文件等写入权限需要请求用户权限。

因为使用的是 Swift 语言，所以我们可以直接使用 Swift 标准库（如 Foundation）执行一些操作。

每个 Package plugins 是作为一个单独的进程运行的。

下面分别介绍下命令 plugins 和构建工具 plugins 。

### 命令 plugins 介绍

命令 plugins 扩展了开发工作流，可以直接运行，不需要等到构建过程。

可以访问文件，但是必须请求权限。

命令 plugins 一般很小，通常需要依赖其他工具来完成工作。

### 构建工具 plugins 介绍

构建工具 plugins 为构建系统提供命令，

不是像命令 plugins 一样直接运行，需要集成在构建期间或构建之前运行，并可以定义运行 plugins 的输入输出。

构建工具 plugins 可以分为两种基本的构建命令：普通构建命令，预构建命令。

#### 普通构建命令

普通构建命令作为构建的一部分进行运行。可以指定输入输出路径，并且仅在输出缺失或输入改变时候运行。

Plugins 返回的类型命令`.buildCommand`被合并到构建系统的依赖关系图中，以便它们在构建期间根据所需声明的输入和输出运行。这要求在运行命令之前就需要指定输出的路径，输出路径可以使用输出目录和输入文件名称的某种组合。

可以使用普通构建命令的 plugins 示例是类似编译器的翻译器工具，例如 Protobuf 和其他一些可以接受一组固定的输入集并生成固定的输出集的工具。

#### 预构建命令

预构建命令在每次构建之前运行。创建预构建命令时， plugins 需要指定命令将写入其输出文件的目录。这就是 prebuild 命令将其输出传达给构建系统的方式。

在调用 prebuild 命令之前，如果需要，构建系统将创建相关的输出目录（但它不会删除任何已经存在的目录内容）。调用该命令后，SwiftPM 将使用该目录的内容作为构建其他构建命令的输入。prebuild 命令应该添加或删除文件，以便目录内容与应该由构建系统处理的源文件匹配。如果自上次运行 prebuild 命令以来目录中的文件集已更改，则将更新构建系统规划，以便将更改的文件集合并到构建中。

每个 plugins 调用都会传递`TargetBuildContext.pluginWorkDirectory`。 plugins 通常会为每个预构建命令创建单独子目录，并且将会把输出文件写入该目录。

因为它们在每个构建上运行，所以预构建命令应该使用缓存来做尽可能少的工作，理想情况下当它们的输入没有变化时没有预构建命令工作。

当被调用的工具可以生成其名称由输入文件的内容（而不是名称）确定的输出时，或者当有其他原因导致在实际运行命令之前无法知道输出的名称时，应使用预构建命令。

例如自动生成资源代码的 SwiftGen 和其他需要查看所有输入文件的工具，其输出文件集由输入文件的内容（而不仅仅是路径）决定。这样的 plugins 通常只生成一个命令，并使用输出目录对其进行配置，所有生成的源都将写入该目录。

## Swift Package plugins 权限限制

上面介绍 Swift Package plugins 可以做很多事情，但是由于苹果会使用一些机制来保证 plugins 的安全使用，会导致一些功能权限是无法直接使用的。

### Plugins 权限使用使用

1. 网络请求无法访问
使用 Network 框架访问 localhost:3000 的一个本地服务，报错：POSIXErrorCode: Operation not permitted，因此无法访问网络。
2. 可以派生子线程
可以使用 Process 运行一些系统命令，比如 git
3. 无法访问系统服务
测试访问系剪切板，使用 NSWorkspace 打开 URL，均失败。
4. 无法启动本地 GUI 应用
测试打开计算器，进程被杀死，也失败。

### 权限限制原因探索

这个限制因为有沙盒机制，我们从沙盒机制入手来分析一下。

#### macOS Sandbox 的机制

与 iOS 类似，macOS 也在内核层面提供了进程沙盒的支持，可以精准控制每个沙盒进程的权限（例如文件访问、Mach IPC 等系统调用）。与 iOS 不同的是，macOS 提供了一个命令行工具 sandbox-exec，来将沙盒的能力暴露给用户。我们可以通过 sandbox-exec 并配合上一个用来描述权限的 profile 文件，就可以在一个自定义的沙盒环境中执行任意进程了。

#### Sandbox Profile

这里我们重点看一下 sandbox-exec 需要的那个 profile 文件。在系统目录 /System/Library/Sandbox/Profiles 下可以看到很多 *.sb 文件，这些都是 Sandbox Profile。我们随便来看一个文件：

```shell
(version 1)

(debug deny)

(import "system.sb")

;; allow processes to traverse symlinks
(allow file-read-metadata)

(allow file-read-data file-write-data
  (regex
    ; Allow files accessed by system dylibs and frameworks
    #"/\.CFUserTextEncoding$"
    #"^/usr/share/nls/"
    #"^/usr/share/zoneinfo /var/db/timezone/zoneinfo/"
  ))

(allow ipc-posix-shm (ipc-posix-name "apple.shm.notification_center")) ; Libnotify

(allow signal (target self))
```

Sandbox Profile 由 SBPL 语言编写，它的语法非常类似 Lisp，也比较容易阅读。

Sandbox Profile 的核心操作就是 allow 和 deny，这是两个方法，参数均为操作和过滤器（可选）。例如 (allow signal (target self)) 这个语句表达的意思就是：对于发送信号且信号的目标是自己的操作，允许执行。对于某些严格的运行环境，我们还可以使用 (deny default) 禁用掉所有操作，然后使用 allow 方法白名单开启需要的操作。

我们也可以使用通配符来对一组操作进行控制，例如 (deny file-write*) 这个语句会禁用以 file-write 为前缀的所有操作。

#### 进程模型

值得注意的是，Sandbox 在进程上具有继承性，即父进程会将自身的 Sandbox 状态传递给所有由它派生的子进程。这个特性也非常好理解，如果一个进程派生的子进程可以逃逸沙盒，那父进程也相当于间接逃逸沙盒了。如果这样，父进程通过管道控制沙盒外的子进程，这个机制的作用就完全失效了。

而 macOS 中，一个沙盒应用却可以通过 open(1) 或者 NSWorkspace.open(_:) 来以非沙盒模式启动另一个应用。这其实是系统故意留的一个“后门”，因为 Apple 理解这种情况是可控的，毕竟 Mac 作为桌面设备在权限上就会比 iPhone 这样的移动设备宽松。那这个现象是不是违背了 Sandbox 的进程模型呢，其实并没有。open(1) 或其他类似的启动应用方式借助的是 Launch Services 这个系统服务，它由 launchd 进程提供，应用通过 Mach IPC 与 launchd 交互，并最终由 launchd 启动应用，即可“逃逸沙盒”（其实在进程关系上，这个“子进程”的父进程是 launchd，与 Sandbox 的进程模型并不冲突）。

#### Swift Package plugins  启动过程分析

我们现在知道 Swift Package Plugin 是运行在沙盒环境中，但是对其具体的 profile 尚不清楚。所以这里我会通过逆向分析 Swift Package Plugin 的启动过程，来提取其运行时的 Sandbox Profile。

启动过程使用静态分析方法很难快递定位启动流程逻辑，这里采用动态分析的方法。首先一个进程要想启动，一般会通过 fork + exec* 或者 posix_spawn 这几个系统调用来实现。所以这里我们先用 dtrace 对这几个 syscall 进行拦截（这里用的是 posix_spawn）。

```shell
sudo dtrace -n 'syscall::posix_spawn:entry/pid == 591/ { ustack(); }'
```

得到堆栈：

```shell
dtrace: description 'syscall::posix_spawn:entry' matched 1 probe
breakpoint set -n "-[NSConcreteTask launchWithDictionary:error:]"
CPU     ID                    FUNCTION:NAME
  0    656                posix_spawn:entry
              libsystem_kernel.dylib`__posix_spawn+0xa
              Foundation`-[NSConcreteTask launchWithDictionary:error:]+0xf2e
              SwiftPM`specialized DefaultPluginScriptRunner.invoke(compiledExec:workingDirectory:writableDirectories:readOnlyDirectories:initialMessage:observabilityScope:callbackQueue:delegate:completion:)+0xb1f
              SwiftPM`closure #1 in DefaultPluginScriptRunner.runPluginScript(sourceFiles:pluginName:initialMessage:toolsVersion:workingDirectory:writableDirectories:readOnlyDirectories:fileSystem:observabilityScope:callbackQueue:delegate:completion:)+0x431
              SwiftPM`partial apply for closure #1 in DefaultPluginScriptRunner.runPluginScript(sourceFiles:pluginName:initialMessage:toolsVersion:workingDirectory:writableDirectories:readOnlyDirectories:fileSystem:observabilityScope:callbackQueue:delegate:completion:)+0x52
              SwiftPM`partial apply for closure #4 in DefaultPluginScriptRunner.compilePluginScript(sourceFiles:pluginName:toolsVersion:observabilityScope:callbackQueue:completion:)+0x59
              SwiftPM`thunk for @escaping @callee_guaranteed () -> ()+0x19
              libdispatch.dylib`_dispatch_call_block_and_release+0xc
              libdispatch.dylib`_dispatch_client_callout+0x8
              libdispatch.dylib`_dispatch_continuation_pop+0x1c5
              libdispatch.dylib`_dispatch_async_redirect_invoke+0x2c0
              libdispatch.dylib`_dispatch_root_queue_drain+0x157
              libdispatch.dylib`_dispatch_worker_thread2+0xa0
              libsystem_pthread.dylib`_pthread_wqthread+0x100
              libsystem_pthread.dylib`start_wqthread+0xf
```

大体流程是线程启动，系统线程相关一些操作，SwiftPM 执行相关方法，最上层 API 调用 NSConcreteTask launchWithDictionary:error: 方法。看来Package plugins通过 NSConcreteTask 来启动调用的。

下面继续看下 launchWithDictionary:error: 的参数，在 LLDB 下断点

```shell
breakpoint set -n "-[NSConcreteTask launchWithDictionary:error:]"
```

断住后检查运行变量：

```shell
* thread #22, queue = 'swift.org.swiftpm.shared.concurrent', stop reason = breakpoint 3.1
    frame #0: 0x00007ff81b68763c Foundation`-[NSConcreteTask launchWithDictionary:error:]
Foundation`-[NSConcreteTask launchWithDictionary:error:]:
->  0x7ff81b68763c <+0>: pushq  %rbp
    0x7ff81b68763d <+1>: movq   %rsp, %rbp
    0x7ff81b687640 <+4>: pushq  %r15
    0x7ff81b687642 <+6>: pushq  %r14
Target 0: (Xcode) stopped.

(lldb) po $arg1
<NSConcreteTask: 0x600027b5e990>

(lldb) po [$arg1 arguments]
<Swift.__SwiftDeferredNSArray 0x600009f8c580>(
-p,
(version 1)
(deny default)
(import "system.sb")
(allow file-read*)
(allow process*)
(allow file-write*
    (subpath "/private/tmp")
    (subpath "/private/var/folders/18/rdgw2vgx4g3g_1qvr7fwfhwh0000gp/T")
)
(deny file-write*
    (subpath "/private/var/tmp/redacted/MyLibrary")
)
(allow file-write*
    (subpath "/Users/redacted/Library/Developer/Xcode/DerivedData/MyLibrary-dmdwxwcobwwasxgztgazmbufnwcy/SourcePackages/plugins/Test.output")
    (subpath "/Users/redacted/Library/Developer/Xcode/DerivedData/MyLibrary-dmdwxwcobwwasxgztgazmbufnwcy/SourcePackages/plugins")
)
,
/Users/redacted/Library/Developer/Xcode/DerivedData/MyLibrary-dmdwxwcobwwasxgztgazmbufnwcy/SourcePackages/plugins/Test
)
```

可以看到 plugins 的运行环境默认禁用了所有权限，而 (import "system.sb") 只会开启几个系统进程必备的权限，其中不包括任意文件读写和任意 namespace 的 Mach IPC。后面紧接着增加了几个有限制的文件读写操作以及进程操作，方便我们在 plugins 中对文件进行修改，或者使用子进程（如 Git 这种某些操作只有文件 I/O 的工具）。

上文中尝试启动计算器之所以失败，并不是因为无法派生进程，而是因为计算器进程无法创建 `NSWindow`，这个过程需要与 `WindowServer` 建立 `CGSConnectionID`，由于插件进程没有 lookup 其 namespace 的权限，因此也无法找到 Mach Port 从而进行通讯。那其他的系统服务无法使用也是同理，大部分系统服务都由名为 `xxxxxxd` 的 daemon 进程提供，clients 与服务通过 Mach Port 通讯来使用其提供的能力，系统的 frameworks 其实也只是将这些通讯封装成 High-Level APIs 提供给开发者。

## Swift Package plugins 怎么用

### Plugins 开发流程

#### 1.创建 plugins 目录及脚本

在包项目目录下，创建 New Folder 命名为 plugins  的顶级文件夹。

新建 Swift 文件，名称可以自定义。
![avatar](./images/pic6.jpg)

#### 2.修改 Package.swift 文件

修改 Package.swift 文件 swift-tools-version，确保版本号大于等于 5.6。因为 5.6 版本以上才支持 plugins  API。

```swift
// swift-tools-version:5.6
```

是不是很好奇 plugins 的 API 是如何设计的？如何在原有 SPM 基础上做的支持？我们应该怎么使用？下面先介绍一下。

API 详细设计说明：

为了允许声明 plugins ，在原有 Target、Product 类基础上进行扩展，新增了一些 plugins 相关 API。在 PackageDescription 中新增 API 如下：

```swift
extension Target {
    public static func plugin(
        name: String,
        capability: PluginCapability,
        dependencies: [Dependency] = [],
        path: String? = nil,
        exclude: [String] = [],
        sources: [String]? = nil
    ) -> Target
}

extension Product {
    public static func plugin(
        name: String,
        targets: [String]
    ) -> Product
}

final class PluginCapability {
    public static func buildTool(        
    ) -> PluginCapability
}
```

这里需要使用 PluginCapability 来构造 plugins 命令类型，命令 plugins 需要使用 .command() 来构造，构建工具类型比较简单，无论是普通构建命令还是预构建命令都直接使用 .buildTool() ，无需参数。

dependencies 表示可以依赖其他三方库（比如 Alamofire、SwiftDate 等）数组，依赖直接写字符串即可，导入库直接使用（但是测试的时候代码引入一直提示 No such module 'xxx'）。

为了允许将 plugins 应用到 Target 上，又新增了如下 API

```swift
extension Target {
    .target(
        . . .
        plugins: [PluginUsage] = []
    ),
    .executableTarget(
        . . .
        plugins: [PluginUsage] = []
    ),
    .testTarget(
        . . .
        plugins: [PluginUsage] = []
    )
}

final class PluginUsage {
    // Specifies the use of a package plugin with a given target or product name.
    // In the case of a plugin target in the same package, no package parameter is
    // provided; in the case of a plugin product in a different package, the name
    // of the package that provides it needs to be specified. This is analogous to
    // product dependencies and target dependencies.
    public static func plugin(
        _ name: String,
        package: String? = nil
    ) -> PluginUsage
}
```

在 Target 上使用的时候，需要使用 PluginUsage 类来构造，name 为 plugins 名称，package 为包名称。

通过以上 API 可以看出，无论是 Targets 还是 Product 下面都可以使用 plugin，甚至是单个 target 也可以使用 PluginUsage 来描述是由 plugin 组成。

下面举例说明：

**命令 plugins 新增 plugin 描述，放到 targets 下，写法如下：**

```swift
targets: [
  .plugin(
    name: "GenerateContributors",
    capability: .command(
      intent: .custom(
        verb: "generate-contributors-list",
        description: "Generate the CONTRIBUTORS.txt file based on Git logs"),
      permissions: [
        .writeToPackageDirectory(reason: "Write CONTRIBUTORS.text to the source root.")
      ]
    )
  )
]
```

简单解释下 API：

- name： plugins 名称，这也是展示在 Xcode 中的菜单项名称
- capability：能力，分为命令 plugins 方法 .command()，跟构建工具 plugins 方法 .buildTool()
- command：命令 plugins 构造方法
  - intent：意图，可以理解为命令行工具的参数信息。
    - verb： 可以定义一个为 Swift PM 命令行定义一个动词（这个用法可以参考【Package plugins 命令行方式说明】部分）
    - description：  plugins 的功能描述
  - permissions： 需要写入权限的描述信息

**构建工具 plugins 新增 plugin 描述，放到 targets 下，写法如下：**

```swift
    targets: [
        .plugin(name: "GenstringsPlugin", capability: .buildTool()),
    ]
```

#### 3.创建主要结构体

```swift
import Foundation
import PackagePlugin

@main
struct MyPlugin: CommandPlugin {
}
```

首先需要导入头文件 PackagePlugin。

其次使用 @main 标记，说明其为 plugins 入口。

自定义结构体，需要继承自 CommandPlugin 或者 BuildToolPlugin。

#### 4.实现协议方法，开发具体逻辑

##### 命令 plugins 开发流程

CommandPlugin 需要实现的方法：

```swift
    /// Invoked by SwiftPM to perform the custom actions of the command.
    func performCommand(context: PackagePlugin.PluginContext, arguments: [String]) async throws

    /// A proxy to the Swift Package Manager or IDE hosting the command plugin,
    /// through which the plugin can ask for specialized information or actions.
    var packageManager: PackagePlugin.PackageManager { get }
```

performCommand  接受用户提供的上下文和任何自定义参数。在这个方法里实现我们的 plugins 逻辑。

参数说明：

- context：上下文，会带入一些 plugins 信息，例如 pluginWorkDirectory： plugins 工作目录、package： plugins 所属包信息
- arguments：参数数组，由外部传入

##### 构建工具 plugins 开发流程

BuildToolPlugin 需要实现的协议方法：

```swift
    /// Invoked by SwiftPM to create build commands for a particular target.
    /// The context parameter contains information about the package and its
    /// dependencies, as well as other environmental inputs.
    ///
    /// This function should create and return build commands or prebuild
    /// commands, configured based on the information in the context. Note
    /// that it does not directly run those commands.
    func createBuildCommands(context: PackagePlugin.PluginContext, target: PackagePlugin.Target) async throws -> [PackagePlugin.Command]
```

createBuildCommands 也可以接受上下文，没有自定义参数，但是可以支持不同的 target，这也是 CommandPlugin 跟 BuildToolPlugin 的区别。

参数说明：

- context：同上
- target：目标，可以集成到不同目标构建系统中运行

返回值说明：

返回值是一个 PackagePlugin.Command 类型的数组，这里的 Command 是一个枚举，支持两种类型构建方法：buildCommand 和 prebuildCommand。并且数组中预构建命令会在普通构建命令之前运行，而无视数组顺序。相同类型的构建命令会根据数组顺序执行。

普通构建命令跟预构建命令方法定义如下：

```swift
    /// - parameters:
    ///   - displayName: An optional string to show in build logs and other
    ///     status areas.
    ///   - executable: The executable to be invoked; should be a tool looked
    ///     up using `tool(named:)`, which may reference either a tool provided
    ///     by a binary target or build from source.
    ///   - arguments: Arguments to be passed to the tool. Any paths should be
    ///     based on the paths provided in the target build context.
    ///   - environment: Any custom environment assignments for the subprocess.
    ///   - inputFiles: Input files to the build command. Any changes to the
    ///     input files cause the command to be rerun.
    ///   - outputFiles: Output files that should be processed further according
    ///     to the rules defined by the build system.
    public static func buildCommand(displayName: String?, executable: PackagePlugin.Path, arguments: [CustomStringConvertible], environment: [String : CustomStringConvertible] = [:], inputFiles: [PackagePlugin.Path] = [], outputFiles: [PackagePlugin.Path] = []) -> PackagePlugin.Command

    /// - parameters:
    ///   - displayName: An optional string to show in build logs and other
    ///     status areas.
    ///   - executable: The executable to be invoked; should be a tool looked
    ///     up using `tool(named:)`, which may reference either a tool provided
    ///     by a binary target or build from source.
    ///   - arguments: Arguments to be passed to the tool. Any paths should be
    ///     based on the paths provided in the target build context.
    ///   - environment: Any custom environment assignments for the subprocess.
    ///   - outputFilesDirectory: A directory into which the command can write
    ///     output files that should be processed further.
    public static func prebuildCommand(displayName: String?, executable: PackagePlugin.Path, arguments: [CustomStringConvertible], environment: [String : CustomStringConvertible] = [:], outputFilesDirectory: PackagePlugin.Path) -> PackagePlugin.Command
```

参数说明：

- displayName：在构建日志中显示的名称，一般写 plugins 名即可
- executable：执行工具的路径，一般使用 .init("/usr/bin/xxx") 创建，字符串是使用工具的路径
- arguments：工具执行所需要的参数数组，多个参数依次按照顺序加入即可。
- environment：可以用来传递一些自定义的环境参数，字典类型。可不写，默认空
- inputFiles：输入文件路径字符串
- outputFiles：输出文件路径字符串
- outputFilesDirectory：输出文件目录

返回值说明：
返回值是 PackagePlugin.Command 类型枚举。如果有多个命令，可以同时构建然后放到 PackagePlugin.Command 类型数组里面即可。

prebuildCommand 跟 buildCommand 构造方法区别：

prebuildCommand 在每次构建开始之前运行。创建预构建命令时， plugins 需要指定命令将写入其输出文件的目录，否则不命令执行不会执行（Xcode 构建日志里面没有看到相关输出），这是个坑，调试了好久。

buildCommand 在构建过程中运行，大概是执行顺序也比较靠前，在执行脚本之后，代码编译之前。

##### 命令 plugins 使用的具体例子

我们需要统计项目中所有提交 Git 的作者信息，并将其输出到 CONTRIBUTORS.txt 文件中，示例代码如下：

```swift
struct GenerateContributors: CommandPlugin {
    func performCommand(context: PackagePlugin.PluginContext, arguments: [String]) async throws {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/git")
        process.arguments = ["log", "--pretty=format:' %an <%ae>%n'"]
        
        let outputPipe = Pipe()
        process.standardOutput = outputPipe
        try process.run()
        process.waitUntilExit()
        
        print("semyon: >>>>>>>>>>>>>>>>>") // test
        
        let outputData = outputPipe.fileHandleForReading.readDataToEndOfFile()
        let output = String(decoding: outputData, as: UTF8.self)
        
        let contributors = Set(output.components(separatedBy: CharacterSet.newlines)).sorted().filter { !$0.isEmpty }
        try contributors.joined(separator: "\n").write(toFile: "CONTRIBUTORS.txt", atomically: true, encoding: .utf8)
    }
}
```

需要说明是：

代码是可以正常开发，但是断点却失效了，那怎么调试呢？好在 print 还可以用，我们可以从编译里面看到打印日志。

![avatar](./images/pic7.jpg)

详细代码参考 [SwiftPMPluginDemo](https://github.com/342261733/SwiftPackagePluginsDemo/tree/master/SwiftPMPluginDemo)。

##### 构建工具 plugins 使用的具体例子

在适配多语言的时候，需要手动在 Localizable.strings 文件补充键值对。我们用构建工具 plugins 将这部分工作自动化。

 plugins 核心代码如下：

```swift
@main
struct GenstringsPlugin: BuildToolPlugin {
    func createBuildCommands(context: PluginContext, target: Target) async throws -> [Command] {
        guard let target = target as? SourceModuleTarget else {
            return []
        }
        
        let resourcesDirectoryPath = context.pluginWorkDirectory
            .appending(subpath: target.name)
            .appending(subpath: "Resources")
        let localizationDirectoryPath = resourcesDirectoryPath.appending(subpath: "Base.lproj")
        
        try FileManager.default.createDirectory(atPath: localizationDirectoryPath.string, withIntermediateDirectories: true)
        
        let swiftSourceFiles = target.sourceFiles(withSuffix: ".swift")
        let inputFiles = swiftSourceFiles.map(\.path)
        
        print("GenstringsPlugin invoke")
        
        return [
            .prebuildCommand(
              displayName: "Generating Iocalized strings from source files",              
              executable: .init("/usr/bin/xcrun"), 
              arguments: ["genstrings", "-SwiftUI", "-o", localizationDirectoryPath] + inputFiles, 
              outputFilesDirectory: localizationDirectoryPath)
        ]
    }
}
```

引入到我们包工程里面的描述如下：

```swift
    dependencies: [
        .package(path: "../GenstringPlugin")
    ],
    targets: [
        .target(
            name: "MyLibrary",
            dependencies: [], 
            plugins: [
              .plugin(name: "GenstringsPlugin", package: "GenstringsPlugin")
            ]
        ),
    ]
```

![avatar](./images/pic8.jpg)
跟命令 plugins 一样，也无法断点调试，我们可以使用 print 打印查看日志。

详细代码参考   [MyLibrary](https://github.com/342261733/SwiftPackagePluginsDemo/tree/master/MyLibrary)  [GenstringPlugin](https://github.com/342261733/SwiftPackagePluginsDemo/tree/master/GenstringPlugin)。

#### 5.  plugins 错误提醒使用

在开发过程中，我们可以通过 Diagnostics 结构体将诊断信息返回给 Xcode，可以在 Xcode 的编译信息里面查看，根据信息类型分为：error、warning、remark。

API 使用说明：

```swift
    /// Emits an error with a specified severity and message, and optional file path and line number.
    public static func emit(_ severity: PackagePlugin.Diagnostics.Severity, _ description: String, file: String? = #file, line: Int? = #line)

    /// Emits an error with the specified message, and optional file path and line number.
    public static func error(_ message: String, file: String? = #file, line: Int? = #line)

    /// Emits a warning with the specified message, and optional file path and line number.
    public static func warning(_ message: String, file: String? = #file, line: Int? = #line)

    /// Emits a remark with the specified message, and optional file path and line number.
    public static func remark(_ message: String, file: String? = #file, line: Int? = #line)
```

emit() 方法可以理解为可以使用特殊的类型，支持自定义。error()、warning()、remark() 分别输出对应级别日志给构建系统。其中参数 message 为展示信息，file 为文件，line 为对应代码行号。但是经测试 file、line 并没有在构建系统中提示，不清楚是有 Bug 还是打开方式不对。

举个例子：

```swift
        Diagnostics.emit(Diagnostics.Severity.error, "Diagnostics: GenerateContributors emit error")
        Diagnostics.error("Diagnostics: GenerateContributors error")
        Diagnostics.warning("Diagnostics: GenerateContributors warning")
        Diagnostics.remark("Diagnostics: GenerateContributors remark")
```

对应构建工具 plugins 在 Xcode 中的提示：
![avatar](./images/pic9.jpg)
对应命令 plugins 在 Xcode 中的提示：
![avatar](./images/pic10.jpg)

### Package plugins 运行方式说明

#### 命令 plugins 运行方式

![avatar](./images/pic2.jpg)
右击我们的包项目，选择要运行的 plugins 。
![avatar](./images/pic3.jpg)
这里选择我们运行的包，下面 Arguments 可以传递参数，选择完后点击 Run 运行。
![avatar](./images/pic4.jpg)
这里点击 Show Command 可以跳转到我们包的源码，点击 Run 直接运行，也可以勾选 Don't ask again 下次将不再提示。

#### 构建工具 plugins 运行方式

因为是集成到构建过程中，所以直接工程构建即可。不需要额外去操作运行。

### Package plugins 命令行方式说明

查看哪些 plugins 可用命令（这些 plugins 跟 Xcode 中展示的一样）。

```shell
> swift package plugin --list
```

运行具体 plugins （例如：generate-contributors-list）命令。

```shell
> swift package generate-contributors-list
```

如果需要给写入权限，可以在命令上添加参数 --allow-writing-to-package-directory。

```shell
> swift package --allow-writing-to-package-directory generate-contributors-list
```

当然，如果想查看命令执行的细节，可以加 --verbose 参数。

```shell
> swift package --allow-writing-to-package-directory generate-contributors-list --verbose
```



## 对比 Cocoapods

目前大部分工程还是基于 Cocoapods 来管理工程。Cocoapods 是中心化的，而 SPM 是去中心化的。两者设计理念不同，不过基于区块链去中心化的验证，SPM 去中心化也一定会有更好的发展。

现在 SPM 可以跟 Cocoapods 一起使用，这样我们可以用 Swift Package plugins 在现有工程开发一些 DevOps 工具简化开发流程。

如果用 Cocoapods 来实现 Swift Package plugins 功能，可能需要 hook podfile 来修改工程配置，再编写很多脚本插入到 Xcode 工程中运行，有些功能也不好实现。

Cocoapods 每次 Xcode 出新功能都需要适配很久，甚至有些功能至今没支持。SPM 就不一样了，是原生的，新功能特性肯定是支持的。

再者 Cocoapods 经过多年的发展，目前更新缓慢，社区活跃度低。随着 SPM 生态的完善，以及苹果的大力支持，相信不久的将来肯定会成为主流工具。

## 总结

Swift Package plugins 算是今年的 SPM 的亮点功能之一。

构建工具 plugins 可以作为构建的一部分执行一些自定义工作 ，也可以用于代码生成，这是想象空间很大的一个功能，如果后续加上注解的话，开发者是可以依托于此实现自己的 Codable。还有依赖注入，运行时的注入逻辑可以放到编译时通过代码生成来处理，性能更高，类似于 Android 的 Dagger2。另外它的优势就是跟编译系统是紧密绑定到一起，只要指定好输入输出，就可以做到增量编译。

命令 plugins 可以让我们开发自动化工具来执行常见的开发任务。统一了脚本的引入方式，并且提供了 module 相关的上下文，基于此我们可以做一些脚手架工具，例如现有的文档生成工具 DocC，格式化工具，代码扫描，XCFramework 生成工具，亦或者是公司内部工具等等。


## 参考

[Package Manager Extensible Build Tools](https://github.com/apple/swift-evolution/blob/main/proposals/0303-swiftpm-extensible-build-tools.md)

[Swift Package Plugin 和 Sandbox 的那些事](https://zhuanlan.zhihu.com/p/536293173?utm_source=wechat_session&utm_medium=social&utm_oi=34621496492032&s_r=0)
