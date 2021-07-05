# WWDC21 10180 - Detect and diagnose memory issues 检测和诊断内存问题 

> 本文基于 WWDC21 Session 10180 - [Detect and diagnose memory issues](https://developer.apple.com/videos/play/wwdc2021/10180/) 

### 概览

本 session 讲解了如何使用 Xcode 检测和诊断内存问题。首选需要了解内存占用对 app 的影响，以及一些常见的内存问题，最后学习使用一些工具来分析并解决内存问题。

阅读指导：为了保证文章的完整性，我们会对一些概念进行更加详细的解释，你可以速读已了解的部分，或者直接

跳至下一小节继续阅读。



[TOC]

### 1. 内存占用的组成

在了解内存问题之前，首先让我们先来复习一些内存的基础知识。让我们看看是什么组成了内存占用 (memory profile)。我们用三个类别来对你的 app 的内存占用进行分类。脏内存 (Dirty memory)，压缩内存 (Compressed memory), 干净的内存 (Clean memory)。让我们快速的看一下每一项都包含什么。

![image-20210615001122429](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935418346-ddef5151-cacb-4a28-8400-cae9f86a0e5a.png&sign=bf591d03fd94644b9a86eeadefd46a768489e0f58984dee6de585a3ddec6e596)

##### Dirty memory

Dirty memory 是已经被 app 写入的内存，包含如下：

1. 它包括所有的 heap allocations：当你用 malloc 时，申请的就是堆上的存储空间。
2. 图像解码的 buffer。
3. 以及 frameworks 中的 `__DATA` 和 `__DATA_DIRTY` 部分也同样存储在 Dirty memory。

> Tis: Frameworks you link actually use clean memory and dirty memory

![image-20210615001213304](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935418409-fe5070d7-4439-4925-9c68-64fcd06c7d01.png&sign=810cd889aca897a68c03af00a3d3da0c1118fc0e63ecd92349707c665b38b722)

##### Compressed memory 

苹果最初只是公开了从 OS X Mavericks 开始使用 Compressed memory 技术，但 iOS 系统也从 iOS 7 开始悄悄地使用。从 [OSX_Mavericks_Core_Technology_Overview](https://images.apple.com/media/us/osx/2013/docs/OSX_Mavericks_Core_Technology_Overview.pdf) 文档中可以了解到该技术在内存紧张时能够将最近未使用过的内存占用压缩至原有大小的一半以下，并且能够在需要时解压复用。它在节省内存的同时提高了系统的响应速度，其特点可以归结为：

- Shrinks memory usage 减少了不活跃内存占用
- Improves power efficiency 改善电源效率，通过压缩减少磁盘IO带来的损耗
- Minimizes CPU usage 压缩/解压十分迅速，能够尽可能减少 CPU 的时间开销
- Is multicore aware 支持多核操作

Compressed memory 是将 Dirty memory 中最近没有访问过得内存，使用内存压缩器对 Dirty page 进行压缩。这些 page 会在被访问时解压缩。注意 iOS 是没有交换内存(Disk swap)技术的，交换内存是 MacOS 特有的。

> Disk swap 是指在 macOS 以及一些其他桌面操作系统中，当内存可用资源紧张时，系统将内存中的内容写入磁盘中的backing store (Swapping out)，并且在需要访问时从磁盘中再读入 RAM (Swapping in)。与大多数 UNIX 系统不同的是，macOS 没有预先分配磁盘中的一部分作为 backing store，而是利用引导分区所有可用的磁盘空间。

> iOS 在内存紧张的时候会使用到内存压缩技术，而MacOS在内存紧张的时候会使用到内存压缩技术及磁盘交换技术

![image-20210615001236922](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935418524-8efd5d7b-6eec-4920-af2b-da1616cfc510.png&sign=4b1a797da27ad7c860eefdd994231d128b306a9fb2e7e56bd0519df5e7657b82)

##### Clean Memory 

Clean Memory 是还没有被写入的内存或可以被 page out 的内存。指的是还没有被加载到内存或者能够被系统清理出内存且在需要时能重新加载的数据。包括：

- Memory mapped files (内存映射文件)
- 加载到内存中的磁盘上的图像
- Frameworks 中的 __DATA_CONST 部分
- 应用的二进制可执行文件

![image-20210615001328356](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935418716-d50f9bbc-13fe-4913-a5f4-63a7e07fc0f8.png&sign=5a9021b1a8e893b850dd31748e9b4f4c9dec20958746285b3bd7c45cad42901a)

**因此， memory footprint = dirty size + compressed size ，也就是我们需要尝试去减少的内存占用。**

如果想对内存技术有更深刻的了解，建议观看 [WWDC18 iOS Memory Deep Dive](https://developer.apple.com/videos/play/wwdc2018/416) 。

### 2. 内存占用的影响

那么，为什么我们需要关注应用的内存占用 (Memory footprint)？

**为了更好的用户体验。**

[^Memory footprint]: 这里的 Memory Footprint 指的是：Dirty + Compressed。

> Your app's memory footprint consists of the data that you allocated in RAM, and that must stay in RAM (or the equivalent) at all times.

> [RAM](https://zh.wikipedia.org/wiki/%E9%9A%8F%E6%9C%BA%E5%AD%98%E5%8F%96%E5%AD%98%E5%82%A8%E5%99%A8):随机存取存储器（英语：Random Access Memory）是与 [CPU](https://zh.wikipedia.org/wiki/CPU) 直接交换数据的内部存储器

**合理的利用内存，可以从四个方面来提升用户体验**

![image-20210613150748853](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935414417-ba67d641-0250-4dd8-bf3e-9542c9fb1ac6.png&sign=6b13d7be3ddf28efcd42f4c246b6d03f7a9f454c34fccbe6de7c61da57db3d76)

#### 2.1 Faster application activations(更快的应用程序激活)

系统的内存是有限的，如果你的 app 切换到后台却占用大量的内存空间时，很有可能被系统终止你的 app 的运行来回收内存空间。所以**我们应该在 App 进入后台时释放内存占用较大的资源，进入前台时重新加载**。因为资源加载到内存是需要时间的，所以保持内存占用的紧凑，可以有效提高你的 app 保留在内存的几率，这样你就能够获得更快的应用程序激活。

> Tips：如何在 app 进入后台时释放内存占用较大的资源，进入前台时重新加载。请参考 [WWDC18 iOS Memory Deep Dive](https://developer.apple.com/videos/play/wwdc2018/416) Optimizing when in backgroud 部分。

#### 2.2 Responsive experience(快速响应的经验)

当用户浏览你的新功能时，他们想要更快速的响应。而减少内存占用就可以让你的 app 获得更快的响应。慎重考虑一下 app 加载到内存的内容，可以有效地减少用户在和你的 app 交互时,系统对内存的回收。

#### 2.3 Complex  features(复杂的功能)

对内存使用采取有效策略，这样节省下来的内存可以让你为 app 增加更多复杂的功能，比如加载视频，做动画等等。

#### 2.4 Wider device compatibility(广泛的设备的兼容性)

最后，Apple 的设备会随着时间不断发展，新设备拥有比以前更多的物理内存。通过减少内存占用，你的应用在旧设备上的表现依旧会很好，从而增加欣赏你的应用的用户。

**总结一下：**

通过监控你 app 的内存占用，你的 app 将获得**更快的应用程序激活**，**更快速的响应**，**处理更复杂的功能**，**能在更多的设备上运行**。

### 3. 常见的内存问题

既然内存对 App 的体验如此重要，那么常见的内存问题有哪些呢？

* Leaks
* Heap size issues

#### 3.1 Leaks

内存泄露是常见的内存问题，它还可以被细分成：

- Allocated objects to which there are no active references 对象失去了引用，却还存活着

- Retain cycles 循环引用

为了方便读者理解，我们会对这两种情况进行更加详细的解释，如果你确认你已经十分了解这两种情况，请跳到 3.2 小节继续阅读。

##### 3.1.1 Allocated objects to which there are no active references

![image-20210615105635144](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935419280-8684bff7-9895-45df-b1d2-7004300327cc.png&sign=534f56b57479656649e110d60953356e2ab2b1ac1e67855f5a2d96d9c262c9b6)

当进程创建了对象,在失去了所有指向该对象的指针的时候，并没有回收该对象。我们称这种情况为泄露 (Leak)。我们用灰色的箭头表示对象之间的引用，每个对象都有至少有一个引用。

![image-20210615105830292](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935419606-9a10bec2-9225-4c6f-9983-b8c22fe5f4bc.png&sign=70c45d8c289d07d51e901a1b3341be19145cd938313b19319ccc1a808838edc5)

注意 A 和 B 之间的虚线，这表示此时我们把 A 对 B 的引用置为 nil，并且移除 A 上的 B 对象。

![image-20210615110643754](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935419618-649f0792-8b13-4978-b1f1-0c9336837bc6.png&sign=de59d28f4bcb7d136e202d9e8731723f64c3a25ea0af8670cde0d4f4b3e8f023)

当指针被移除时，B 对象就泄露了。已经没有任何对 B 的引用，但是 B 对象依旧被存储在 Dirty Memory 中。但是进程中已经没有引用指向它了，也就没有办法去释放它。当泄露的对象越多时，他们所占用的 Dirty Memory 就越多，所以我们需要修复泄露。

> 这种情况的泄露，只会发生在 MRC 下，在 ARC 下当移除指针时，我们一般就会认为此对象已经被释放。

##### 3.1.2 Retain cycles

![image-20210615112430981](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935419708-d65f4f68-fff2-425c-8509-6c8027d35404.png&sign=1afca9b96062d810f294cdb24ab4b101d4e379b3d5635ecbbe92f5c30838fa28)

循环引用也会引起泄露。Swift 中的最常见对象泄露就是循环引用引起的。在上图中，对象 A 和 B 就是循环引用。它们相互引用，但没有外部引用。这意味着进程不能访问或者释放他们。所以它们被认定为泄露。

![image-20210615151156529](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935420590-3bd72069-5d73-4b15-89f8-0bde3f9ce553.png&sign=1a6b50a186fa34334e8576002061215d70676d4e72040b4d4fda82e0119227af)

幸运的是，大多数的 swift 对象都被  Swift 的自动引用计数系统 ( Swift's automatic reference counting system)或者 ARC 管理，这样可以阻止大部分的泄露。如果你用 ARC 管理对象，需要注意 unsafe 类型，确保你会在失去所有引用之前去释放它们。即使是 ARC 管理的对象，也容易变成循环引用。所以，避免创建循环强引用，如果这个循环引用是绝对必要的，考虑使用  `weak`  引用代替强引用，因为  `weak`  引用不会阻止对象被回收。

#### 3.2 Heap size issues

堆是进程地址空间的一部分，用来存储动态生成的对象。所以 堆的大小也对内存占用起到了至关重要的影响。为了保证程序的运行，我们无法避免的要在堆上生成对象，那么这些对象该如何有效的治理呢？

那么首先我们需要确定堆上容易出现哪些问题？

* Heap allocation regressions 堆分配回归

* Fragmentation 碎片化

下面我们会分析这些问题的成因，以及对应的治理策略。

##### 3.2.1 Heap allocation regressions 

![image-20210615204512092](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935424485-ddfcac99-ad07-42f1-9fa9-51e861bc33eb.png&sign=ddcc55c65d8c7513f87a6af4fbdb805d4f7eafe3ddf9c8cfd8787be137696b4b)

堆只是进程地址空间的一部分，用来存储动态生成的对象。堆分配回归会增加内存占用，因为进程在堆上比以前生成了更多对象。 为了减少堆的回归，可以删除无用分配并缩小不必要的大内存分配。你也应该关注一下你一次持有多少内存。释放掉你不在使用的内存，并在你需要的时候才去分配内存。这将减少 app 的内存峰值。让它被终止的几率变得更小。

总结一下 Heap allocation regressions  对应的治理策略：

* 移除无用内存分配。

* 减少过大内存的分配。

* 不再使用的内存需要释放。

* 在你需要的时候，才去分配内存。

##### 3.2.2 Fragmentation

碎片带来了碎片化的问题，那么碎片是如何产生的？ 首先让我们快速回顾一下 page 在 iOS 中是怎样工作的。

![image-20210616215204050](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935433711-aa2918d3-7302-4610-a9eb-b7da1eb68647.png&sign=5614bbd620b125a75ddfbd3b544c7fc73e085e6e58953c9a0f2f5684bd298d86)

page 是系统授予进程的固定大小、不可分割的最小内存块。因为 page 是不可分割的，当进程写入 page 的任意部分，整个 page 都会被认为是 dirty 的并且进程将会管理它，即使 page 的大部分没有被使用到。

当进程的 dirty page 没有被 100% 占用时，就会产生碎片化。为了理解为什么出现碎片，我们来看一个例子： ![image-20210616215810552](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935433747-c2e1deee-40e9-4fc6-b0b7-e19f1b791273.png&sign=35dcbb3c6b38c8a35e407ea510ea5b58e69f6c1573ae432d83de946a4fc996b8)

首先有三页 clean page。

![image-20210616215948349](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935434067-7189aabf-d1d7-4de8-b04b-1ee8103be8e3.png&sign=e8b5301d0cd0f15cdeb3ff4d3a1508e4f0954c473a0b074129d392f0137dbf79)

当进程运行的时候，创建的对象会填满这些 page。此时 clean page 就变成了 dirty page。

![image-20210616220217236](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935434246-b0064511-adaa-4a80-8045-74ccc85a69c7.png&sign=0f671607bfe78d6904e7125d1c3d28c5136681b90a76812ee83bd3f4602c8ec2)

当部分对象被释放,它们填充过得地方就会变成空槽,在上图中被标记为 free memory。因为依旧填充着对象，这两个 page 依旧被标记为 dirty。

![image-20210616220624885](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935434551-3bffca82-753b-4240-bdb5-02dbd42cd423.png&sign=14cc2ef1a3ccd9909c30e4586cea53152f3860caadb45d3cdab499eaac161008)

系统想用将要创建的对象填充空槽，右侧蓝色方块是即将要创建的对象，不幸的是，即将创建的对象太大而不能插到空槽里，即使空槽的大小加起来足够大，但是空槽不是连续的。它们不能给一整个对象使用。

![image-20210616222503351](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935434751-54d597a2-9ce2-4a3c-954e-9cc66bebf482.png&sign=f9a19ccaebcb21607d0fbdb1906a428ff62ef599f15640ddd9c87355086e6697)

因为现有的空槽不能使用，系统就会启用一个新的 page 给即将要创建的对象。如上图最右侧的方格就是新的  page，现有的内存空槽依旧没有没填满， 这种情况我们就称之为**碎片化内存**。

**最好解决内存碎片化的方法就是创建内存相邻，生命周期相似的对象**。这能帮助确保所有这些对象会被一起释放，这样进程就会得到一大块连续的空闲内存来为即将要被创建的对象服务。

总结一下解决内存碎片化的方法：

* 创建内存相邻，生命周期相似的对象，这样在这些对象释放之后，我们就会得到一大块连续的空闲内存

### 4. 内存治理的工具

既然内存中会有这么多的问题，我们又不可能在开发代码的阶段就**完全避免**这些问题，苹果为了让我们可以有效的检测和诊断这些内存问题，开发了一系列的工具来帮助开发者，下面让我们来谈谈这些工具。

#### 4.1 已有的内存治理工具

内存问题由来已久，苹果在今年之前就有很多工具可以帮我们来检测和诊断内存问题，我们简单的把已有工具在使用维度上分为：

* 可视化工具

* 命令行工具

下面我们会详细的列举这些工具，并且简单的阐述一下这些工具的优缺点，以及组合使用方案，因为一些工具存在的时间比较长，笔者并不能一定能找到对应工具组合的最优解，如果你知道，请在评论区留言，如果你的方案更好，我们会更新到文章中。

##### 4.1.1 可视化工具

可视化工具又分为：

*  Xcode 集成的工具
*  instruments 相关工具

###### 4.1.1.1 Xcode 集成的工具：

* Memory Report

  ![Memory Report](https://docs-assets.developer.apple.com/published/aa40d4726bfc19940d796f766fb1aceb/10300/gathering-information-about-memory-use-1.png)

  Memory Report 存在 Debug navigator 中，当**程序运行起来**，切换到  Debug navigator 点击 memory 就可以查看 Memory Report , 这个报告只能粗略的查看内存状况，比如：**通过 push 出一个 controller 查看对应的内存增长，pop 掉这个 controller 之后一般会有对应的内存减少**。当然如果这个 controller 存在大量的网络图片展示，就比较特殊了，一般的网络图片下载和缓存框架为了减少磁盘 IO 以及提高多次访问图片的命中率，会对**进行图片缓存**，这时 push 的内存增长和 pop 内存减少就是不对称的状态。比如 `SDWebImage` 会在程序切换到后台的时候，会释放掉一部分缓存。你可以通过切换到后来来验证，当前的不对称是都由网络图片的缓存造成的。所以说 Memory Report 是一个更加整体的内存概况，比较适合查看内存概况，以及没有网络图片缓存的 controller 的释放情况。

  **优势**：快速查看整体内存预览。

  **短板**：内存概况不够详细，即使查看对应 controller 的创建以及释放都有一定的局限性。

* Product->Analyze

​       Product 中的静态分析主要分析以下四种问题：

​			a.) 逻辑错误：访问空指针或未初始化的变量等

​			b.) 内存管理错误：如内存泄漏等

​			c.) 声明错误：从未使用过的变量

​			d.) Api调用错误：未包含使用的库和框架

​		注意使用静态分析是基于编译器的静态检查，而 `Objective-C` 是具有相当强大的动态性，所以静态分析能够检查出一些内存泄露问题，一些动态执行引起的内存泄露需要其他工具来检查。

​	**优势**：静态分析是基于编译器的静态检查，且检查会涵盖多种问题的检查。

​	**短板**：静态检查本事是基于静态的检查，对应 `Objective-C` 这种动态性语言的检查具有一定的局限性。

* Schemes 的诊断工具中的 Memory Management

  * Malloc Scribble

    > 申请内存后在申请的内存上填 `0xAA`，内存释放后在释放的内存上填 `0x55`；再就是说如果内存未被初始化就被访问，或者释放后被访问，就会引发异常，这样就可以使问题尽快暴漏出来。
    >
    > `Scribble` 其实是 `malloc` 库 `libsystem_malloc.dylib` 自身提供的调试方案

  * Malloc Guard Edges

    > 申请大片内存的之前或者之后都会在 page 上加保护

  * Guard Malloc

    > 使用 `libgmalloc` 捕获常见的内存问题，比如越界、释放之后继续使用。
    >
    > 由于 `libgmalloc` 在真机上不存在，因此这个功能只能在模拟器上使用.

    Guard edge 和 Guard Malloc 可以帮助你发现内存溢出，并在通过对申请的大块内存保护和延迟释放来使你的程序在误用内存时产生更明确地崩溃。

  * Zombie Objects

    > `Zombie` 的原理是用生成僵尸对象来替换 `dealloc` 的实现，当对象引用计数为 `0` 的时候，将需要`dealloc` 的对象转化为僵尸对象。如果之后再给这个僵尸对象发消息，则抛出异常，并打印出相应的信息，调试者可以很轻松的找到异常发生位置。

  * Malloc Stack logging

    Malloc Stack logging 可以结合 Debug Memory Graph 进行使用，我们会在 Debug Memory Graph 处更加详细的说明 Malloc Stack logging 的作用。

    **诊断工具 Memory Management 总结**：

    **优势**：诊断工具 Memory Management  更加聚焦于最基础的内存使用，包括涂鸦，page 边界保护，越界以及对已经释放的地址进行访问等。

    **短板**：部分会存在模拟器的限制，因为这块比较聚焦基础的内存，部分功能对开发者的要求也比较高。

    **注意**：Memory Management 的这五个工具是在对应的 scheme 上生效的，如果你不想 dirty 公共的工程配置，一般可以 选择 `Duplicate Scheme` 并且取消 `share` 选项的勾选。而且 Malloc Stack logging 会在你使用 Debug Memory Graph 之后，记录很多日志，增大 app 的沙盒占用，会耗掉手机很多的磁盘空间。建议使用完成之后及时关闭 Malloc Stack logging 。

* Debug Memory Graph

  ![image-20210614231737001](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935415459-076a8265-fd4a-4178-a8d0-dfb63ba85a2f.png&sign=dceba1a77144f8a8b24be32add14caa1bc157ad21f37f6989816b880a6632476)

  **基础使用**：

  Xcode 运行起 app 之后，在调试栏点击 Debug Memory Graph ，这是 Xcode 会捕获当前 app 的内存快照，此时你可以很方便的查看内存中的存活对象，以及从 app 启动到此刻产生的内存泄露（紫色的叹号代表内存泄露），你可以灵活的选择展示当前内存内所有的存活对象，内存泄露的对象，也可以屏蔽系统的存活对象只关注当前工程调用产生的对象，或者是基于上述的选择，筛选指定类型对象。筛选之后，你可以看到当前类型对象有多少个，点击某个对象可以查看它的引用关系，右侧的 inspectors 还会展示当前对象的详细信息，比如占用大小，调用堆栈等。

  **进阶使用**：

  ![malloc stack logging](https://miro.medium.com/max/558/1*JZEYWcEIRXC3J655tCKKwA.png)

  如果你开启 Malloc Stack logging，选择 All Allocation and Free History 选项，你则可以通过调用堆栈直接锚定到具体的代码了。

  如果你需要记录当前内存以备后续分析，你可以在 Xcode 的 File 选项下，导出 **memgraph** 。Xcode 使用 memgraph 的文件格式来储存应用程序的占用信息，导出 memgraph 文件可以结合命令行工具进行分析。

###### 4.1.1.2 instruments 相关工具：

*  leaks

  用于检测程序运行过程中的内存泄露，并记录对象的历史信息。

* Allocations

  追踪程序的虚拟内存占用和堆信息，提供对象的类名、大小以及调用栈等信息。

* Zombies

  用于检测程序运行过程中的僵尸对象，并记录对象的产生过程，调用堆栈及位置。

* VM Tracker

  能够区分程序运行时前文所述的各种内存类型占用情况，Instruments User Guide 中给出了各个参数的具体定义。

  **Tips**: 在使用上述工具时，如果看不到类和方法名称，绝大部分原因是你的打包模式没有开启dSYM或者debug symbols。

  因为 instruments 相关工具的使用解释起来需要很长的篇幅，这里我推荐几篇文章方便大家了解这几个工具的使用：[leaks](https://www.wangquanwei.com/63.html)    [Allocations](https://blog.csdn.net/Hello_Hwc/article/details/83241475?spm=1001.2014.3001.5501)    [Zombies](https://blog.csdn.net/weixin_41963895/article/details/107231347)    [VM Tracker](https://www.jianshu.com/p/f82e2b378455)  想要了解更加详细的信息，请参阅 [WWDC19 Getting Started with Instruments](https://developer.apple.com/videos/play/wwdc2019/411) 。

##### 4.1.2 命令行工具

在上面我们已经了解了 Xcode 内置的可视化工具，**虽然可视化工具已经能够直观的表现我们想要了解的内存占用信息，但是在终端中不仅可以灵活地利用各种命令和 flag 突出我们想要的内容，更可以快速的实现信息查找和文本化交互。**在了解内存问题分类之前我们先简单的了解下**四种常用的命令行工具**。

- vmmp

  > vmmap 能够打印出进程信息，所有分配给该进程的 VMRegions 以及 VMRegion 的种类、内存占用信息等内容。利用 --summary 则能够根据不同的 region type 打印出详细的内存占用类型和信息。这里需要注意的是 SWAPPED SIZE 在 iOS 上指的是 Compressed memory size 且其值表示压缩前的占用大小。

- leaks

  > leaks 追踪堆中的对象，打印出进程中内存泄露情况、调用堆栈以及循环引用信息。利用 --traceTree 和指定对象的地址，leaks 还能以树形结构打印出对象的相关引用。

- heap

  > heap 会打印出所有在堆上的对象信息，默认按类数量排序，也可以通过 -sortBySize 按大小排序，对于追踪堆中较大的对象十分有帮助。找到目标对象后，通过 -address 获得所有/指定类的地址，继而可以利用 malloc_history 寻找其调用堆栈信息。

- malloc_history

  ```
  malloc_history App.memgraph --fuStacks [address]
  ```

  > 使用上述命令能够获得我们知道地址的对象的调用堆栈信息，它能够得到的比 memory inspector 中 Backtrace 更加详细。但是需要开启 Dignostics 中的 Malloc Stack 选项，才能通过 malloc_history 获得 memgraph 记录的调用堆栈信息。

更多拓展信息请参考 [深入解析iOS内存 iOS Memory Deep Dive](https://www.toutiao.com/i6569037697183121934) 。

#### 4.2 新增的内存治理工具

学习使用新工具之前，简单了解一下现在你可以使用到分析内存占用的一些工具。Xcode 提供了一套工具来协助我们监控开发阶段和线上的 app 内存性能。

![image-20210614163556168](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935414443-c43d6435-b9c3-4537-8a83-de5d008b9bde.png&sign=21675125b5e5396228de956e46259e0c4eba8610edc83169b8392454dca6e67e)

XCTest 框架帮助我们直接在项目的单元测试和 UI 测试中监控 app 的内存占用， MetricKit 和 Xcode Organize 帮助我们自定义的监控生产环境上的内存指标。

![image-20210614165019022](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935414427-072b909d-1db4-4b75-a83d-050f502d21f6.png&sign=be55684eac16b7b546b27e9c9c9348e5b19dea1d4cd870d0ea5cac083c84ded3)

我们将使用 XCTests 做性能测试，但是注意这些技术还可以应用在一般内存问题分类和调查中。 使用 XCTests 做性能测试, 你能测量系统资源，比如：内存利用率, CPU 使用率，磁盘写入等等。 

![image-20210614223611948](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935415391-5a176d6f-9e17-4fd6-8586-f646f974c47b.png&sign=1c1cc90d0228a72058e466e44f68423ac51419623e0875cc02d63a5a17d7c5ce)

苹果在Xcode 13 **新增**了使用 **XCTest** 收集诊断数据的新功能，来帮忙分类测试回归。通过执行 **XCTest** 用例来生成 `Ktrace files`  和 `Memory graphs`。

##### 4.2.1 Ktrace file

![image-20210614231308710](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935415393-5d3263af-46ee-4e37-a080-0117aa2ae6b4.png&sign=f3974b4fe1986b1bccddfd5b3cb8d2472586d2c398420715ff9e72546475cffa)

`Ktrace files` 即强大又灵活。它可以用于一般的问题诊断也能聚焦于一些特殊的问题，比如可以深入渲染管线调查 `hitches` 问题，或者查找阻塞主线程并导致挂起的原因。 在日常工作中，这些 `Ktrace files` 可以用  instruments 打开并分析。 

##### 4.2.2 Memory graphs

![image-20210614231737001](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935415459-076a8265-fd4a-4178-a8d0-dfb63ba85a2f.png&sign=dceba1a77144f8a8b24be32add14caa1bc157ad21f37f6989816b880a6632476)

`Memory graphs` 对于特定的问题查询很有用，`Memory graphs` 即可以在 Xcode 的可视化调试工具中使用，也可以作为多个命令行工具使用。其中一些我们将会在后面讨论。 `Memory graphs` 本质上是一份进程地址空间的快照，`Memory graphs` 记录了每一个虚拟内存 region 的地址和大小和每一个分配地址的 block ，以及这些 region 和 blocks 的指向。这些足以支撑你去检查每一个堆上对象，查看与链接框架(Link Framworks)关联的数据区域等等。

XCTest 默认打开 malloc stack 的日志，并捕获新创建对象的堆栈。

![image-20210614232529918](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935415602-156bd825-62ff-41b8-95fd-d0865478e17f.png&sign=2e62101262529387c4a724bd8c17322dea4255d975b3730624fb3a530e4dbcf8)

为了收集诊断可以使用命令行工具把 enablePerformanceTestDianostics 设置为 YES。这个参数可以让 `Ktrace` 收集非内存指标和内存指标的内存图。

### 5. 如何使用新工具



![image-20210614170804690](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935414444-fe61da81-d761-4519-b5ef-c7bb94afee6b.png&sign=63f16630eefef2037c19b546f15d09d57b774edc1029a239c0e9d2ad31a1a223)

苹果提供了一个名为 Meal Planner 的 app 来测量内存的使用情况。当点击保存按钮时，会下载对应的食谱到用户的设备上。case 如下：

```
// Monitor memory performance with XCTests

func testSaveMeal() {
    let app = XCUIApplication()
        
    let options = XCTMeasureOptions()
    options.invocationOptions = [.manuallyStart]
        
    measure(metrics: [XCTMemoryMetric(application: app)],
            options: options) {

        app.launch()

        startMeasuring()

        app.cells.firstMatch.buttons["Save meal"].firstMatch.tap()
            
             let savedButton = app.cells.firstMatch.buttons["Saved"].firstMatch
        XCTAssertTrue(savedButton.waitForExistence(timeout: 30))
    }
}
```

 `measure(metrics:options:block:) ` 需要指定对应的 app，在 `block` 中 启动 app， 调用 `startMeasuring` 开始测量，点击 `Save meal` 按钮， 使用 `waitForExistence` 等待下载食谱完成，并检查 UI 是否更新。执行测试代码之后，点击测试 case 旁边的菱形，弹出测量面板, 选择物理内存选项。

![image-20210614220821604](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935414439-0fd1280f-aa48-4d49-b077-a0e39ce14422.png&sign=9509e07a2600e4f66d20d37dce2ce1bf91cca4f9150f4a9bcb2101e883e09341)

我们可以看到 case 执行了五次，内存均值在 116000 KB, Set Baseline 文字下方可以看到 case 每次运行的的详细数据，一般情况下我们会参考平均值设置我们的 baseline，设置完 baseline 后再次运行，可以在 Result 看到回归。

> case 每次执行的结果与 baseline 的偏差称为回归([regression](https://zh.wikipedia.org/wiki/%E8%BF%B4%E6%AD%B8%E5%88%86%E6%9E%90))

![image-20210614222606040](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935415198-558949a9-1a12-4492-9202-4fd1e7416567.png&sign=829341357bc00b2467d1d4c343278e9dbbecf9b5db46f4c5cbb66dbf8139c840)

如果回归大于 baseline， case 就会执行失败。这时候我们就需要停下来查找问题，并且修复，直到 case 执行成功。

当执行完成之前写的性能测试，我们将看到上面的控制台上的打印。打印的内容非常多，但是可以直接查找几个关键词， 第一个要找到的是我们的执行结果是否通过，这个 case 的执行就没有通过。输出也会指出测试失败是因为回归 ([regression](https://zh.wikipedia.org/wiki/%E8%BF%B4%E6%AD%B8%E5%88%86%E6%9E%90))，新的平均值要比 baseline 糟糕 12%，最后我们能够找到 xcresult bundle 的路径。当我们在 Xcode 打开 xcresult bundle， 我们将看到内存测试在顶部，与测试名称相邻。

![image-20210614235156514](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935416391-be7a9209-9225-4fff-a27f-2a352a19c6e8.png&sign=585a6f8c5e1542d11f565c8f4144384a9dc71992bf9493aa02f7adbf8aacde79)

展开测试日志，可以找到可以获取的内存图。

![image-20210614235423403](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935416889-3a58bf31-9a15-453f-9129-4e5eda59083b.png&sign=c4ceac7f3caa5f5ff1ae930223135e1b8f74351aeaa6e5f5c3e4a7fbaa60cf14)

下载并且解压后，我们会发现如下两个内存图，苹果收集了最初的内存图并在名称前面添加了 pre，收集了最后一次迭代的内存图，并在名称前添加了 post。我们可以通过前后两个内存快照分析期间的内存增长。

![image-20210615000432894](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935417211-38695874-fe79-4a5a-9e72-c34be2171458.png&sign=514c237dd573dda1e223a3a341d8bbc9d149e88dec4f78006004245fd17e7064)

有了`Ktrace files`  和 `Memory graphs` 并且设置了 malloc stack 为 YES，你不仅可以知道回归([regression](https://zh.wikipedia.org/wiki/%E8%BF%B4%E6%AD%B8%E5%88%86%E6%9E%90))出现了问题，还可以知道为什么回归 ([regression](https://zh.wikipedia.org/wiki/%E8%BF%B4%E6%AD%B8%E5%88%86%E6%9E%90))会出现问题。

#### 5.1 检测和诊断内存泄露

![image-20210615151419176](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935420585-9b960e99-6270-4c66-8d5f-5be3dfaa5f71.png&sign=55736b6e63bec656c8f67c85edfa418570bb3ae85acbe2ff798d10f1760b285e)

大家还记得我们之前使用 XCTest 执行 case 失败时生成的两份文件吧，我们将使用这两份文件来检查泄露。

![image-20210615151716402](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935421128-193e345f-0405-4ea0-b833-33891cf05370.png&sign=14bc3e30565f6846f9b46dbf7132d7f6f70956c0939093d10fb8d358801c96c9)

```
leaks App.memgraph
```

leaks 命令可以帮查找已经产生的泄露。

![4leaksfor240bytes](https://cdn.nlark.com/yuque/0/2021/png/21867895/1624071394327-64949ea2-0541-44e1-a860-9ca96ee00030.png)

输出展示了我们有 4 个泄露，一共 240 byte。

![image-20210615152124699](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935420899-723b487d-d231-4996-94d9-7c64b40d5f30.png&sign=f0916e8f113e19c3ce4bf5edc361076194db26489e09dc490057acc36c2984d5)

接下来，输出包含了每一个泄露的详细的情况，这些信息可以给我们一些线索，帮助我们找到是什么引起了泄露。最上面的对象图指出 ROOT CYCLE,这表示我们面对的是循环引用。

![image-20210615152802392](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935421090-82e87892-1622-4cc0-a081-f66e1a15a1f2.png&sign=b23f5ffbe3e66c8a8a1901175baa83085ca6fa749704edade0da64216c4f0ef1)

这里有一些有用的符号，让我们看一下，这个循环引用可能包含 MealPlan 和 MeunItem 对象。因为  malloc stack logging 是对 XCTest 打开的，输出就会包含每一个泄露的创建堆栈。这个对于定位是哪个对象产生了泄露真的很有用。

![image-20210615181249641](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935421778-d71594d2-8c43-4c04-8944-fac15fd79b96.png&sign=297b4766423d0c5e283137abbed93f8244507cb345710259b26827362f65896f)

通常，你会希望从代码中找到具有符号的调用堆栈,这个是我代码中的一部分调用。正在泄露的 MealPlan 对象是在 populateMealData 中创建的。我们打开 Xcode 来看一下我们是否能够修复这个问题。

![image-20210615181611352](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935421750-df7396d8-0eff-4b7c-9275-9518d9b75936.png&sign=e11f99066b480b65ef32cc6099768957c8c9e7b3d3dc651c645c2909cdb9e87a)

这个函数就是我们在 leaks 的输出中看到的，这里我分别创建了 MealPlan 对象和 MealItem 对象，日志里面说这两个对象有循环引用。

![image-20210615183622686](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935422987-004cdbd7-38d0-42be-8b55-73c78e0296a5.png&sign=477d7e9e827b37f234e233c7ff21e2ed693ac4705250e67b9f4d07ef83d31357)

 `addMealToMealPlan` 这个函数看起来就有点可疑，让我们看一下。

![image-20210615183738662](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935423055-aec5cf67-ff92-49ed-85b8-9998218a5bba.png&sign=b507c92764f2b940e3f45fdb4771240787d04ffeb61453fd7053fcb4dc856ae8)

这里我们调用了 addItem 到 mealPlan，也调用了 addPlan 到 menuItem。

![image-20210615184000286](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935423705-fdb53ffb-ea12-46de-a065-77105cd65868.png&sign=e3e2e831c5f72ac2a88085b33d474156b5c5cae9dded636ad6c4cca1cfced060)

果然，这里存在循环引用。MenuItem 持有 MealPlan， MealPlan 也会持有 MenuItem。这两个对象进行了互相的强引用。

当执行完 `addMealToMealPlan`，就没有任何引用指向 MenuItem 和 MealPlan 的对象了，但是他们依旧互相引用着对方，这就导致了泄露。

![image-20210615184444778](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935424047-64ad3846-181b-4fb8-8c81-18c184481b16.png&sign=8801e45bb7b0d5f40e1a87d58c41d4aae51004f5bcfeec77601a035d5eaefb1f)

我们应该寻找一种方案来解决这个问题，这里使用了最快的解决方式，通过改变 MenuItem 对 MealPlan 的引用关系为弱引用来打破了引用循环。因为这里已经不存在强引用回环了。

#### 5.2 检测和诊断堆分配回归

我们使用 `Meal Planner` 执行测试失败生成的 memgraph,检查一下堆内存增长的问题。

![image-20210615211510398](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935424408-060eeb4b-7272-42e8-82b9-a55320a21056.png&sign=4b8aa4441a446a4d8c4517de2b578967f7880d4e64f2dedcc6cb7e21433140d1)

```
vmmap -summary app.memgraph
```

这里我们会对 pre 和 post memegraph 文件使用 vmmap 来获取内存使用的概览。

![image-20210615212406816](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935425337-78935707-0b61-43c2-bf67-8e33fa2b36b9.png&sign=8a2df58e25ee7913ed03cd5acbb0ecbf10de0434fe8d25b6c055996567c829ab)

在 pre memegraph 中物理占用在 112 MB 左右。

![image-20210615212632183](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935425440-8e7beb41-d0e1-416f-9154-afb278e1f81c.png&sign=87627d8a01cedb0ad44bf7067227d90c902cad113a8ee7c97552c7108206f93e)

而 post memegraph 中物理占用在 125 MB 左右。两次结果差值大概有 13 MB 左右。

![image-20210615213215716](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935426361-23eaeab5-3ef9-4a8b-b3ca-dc46b66db970.png&sign=80c3e93e4fd1ed6fcb9023bb3440d75c7ea7fdf8bcb4f78cd1cceabd2f2ff7ff)

向下滚动输出，可以看见进程的内存占用被按 region 进行了划分。

![image-20210615213419470](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935427359-9e62f1b2-8786-4da0-9be3-0f1d1223f601.png&sign=e9cd716752875b0c2e1734c16e73a1fc473bdc8a1e3f2d630b96b4ddab4bfc5b)

因为我怀疑这块是一个堆分配的问题，所以我想从  MALLOC 范围的看看这些 regions。因为这些 regions 包含我所有的堆对象。

![image-20210615214206310](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935427804-edc2b35e-634f-4e16-8636-af290b29948a.png&sign=c156d67c76026fcecde27584b48d83732f522393a56d97f345b4f20ba8661697)

还记得上面说过的 **memory footprint = dirty size + compressed size** 在这个工具中 swapped 代表 compressed, 所以这些列我们只需要关心 **dirty size** 和 **swapped size** 。

![image-20210615214254471](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935428123-8e58c4d0-6676-486a-8b35-839eac242f0a.png&sign=8ec4f668258d98f929e640900225a2703e0ebb7fa806267df083ee00d0af9af5)

图上显示 MALLOC_LARGE 块大概持有 13 MB 的 dirty memory。这大概就等于我们回归的大小。所以我们需要查一下到底是谁贡献了这 13 MB。

![image-20210615214621447](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935428685-1b801337-c9fc-40f3-a05f-4edc40742861.png&sign=c162bca744429a23b3fde7bb86f555aca3b840f615be774818c80991c44628d6)

> 这里可以使用 `heap --diffFrom` 来看一下 pre 和 post 的差别。这个命令可以得到 post 中存在但 pre 中没有的对象。

最下面显示了这些 diff 大概有 13MB (13680384 bytes)。

![image-20210615215202648](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935430402-12c5896b-8572-4f3f-9cda-f74ecee3f634.png&sign=edf13dfa18ad5393252531f0372212e4ab12c33610fffe6da6ba50c3b0d3c245)

高亮部分是按照类名来进行划分的。每一种对象都会有个数和大小的总结。这里我们可以看到我们大概有 13 MB 的 `non-object` 类型，在 Swift 中，这种类型通常是 raw 分配的bytes,这种对象可以用一点小技巧去追查。首要要拿到这些 `non-object` 的地址。

> 注意上图中 AVG 这一列代表的是每个 CLASS_NAME 对应 CLASS 对象的平均大小， `non-object` 类型对象的平均大小在 26777.3 byte，其他对象是没有超过 500 byte 的。

![image-20210615215855078](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935430880-2db0086c-a929-4417-9161-69083a066ea5.png&sign=23350b2af5220341f561a4e82a8da5482eeda0aaf028efc98a532d50f6741f45)

可以使用如上 `heap -addresses` 命令来分析，特别注明只要 `non-object` 类型，并且大小至少 500 kb。如输出所示，`0x11380000` 地址的 `non-object` 大概有13 MB。所以它就是问题的根源。记录下来这个地址，我们需要通过这个地址来查询这些  `non-object`  的创建堆栈。

拿到对象地址后，我们有几个选择。可以根据具体情况来选择使用哪种方式继续追查，每种方法都有其好处,我将简要地逐一介绍。

**选择一**

```
 leaks --trace=address app.memgraph
```

这个命令可以得到这个地址的对象引用树，这个在查找特殊对象更多信息的时候很有用，特别是在 memgraph 没有打开 malloc stack logging 或者没有启用 MSL的时候 。注意 XCTest memgraph 会自动启用 MSL。

![image-20210616110444685](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935431449-f2cd733d-221e-40d7-b3d8-ac8b93ccd442.png&sign=17b6fe3f872365c286c6aab447666303852ead80e8b51684060ea2f1e7ba51f4)

这个高亮的部分可能与我们的要查询的部分有关， 内存中的 MALLOC_LARGE 可能在 MKTCustomMealPlannerCollectionViewCell 中对 mealData 对象做了什么。 

**选择二**

```
leaks --referenceTree app.memgraph
```

这个命令会得到一个进程中所有内存自上而下的引用树，他可以帮我们很好的推断出根节点。根据输出可以看出在 app 中内存聚集的场景，如果存在 large regression， 但是不知道是哪个对象引起的。 用这个工具有奇效。

![image-20210616114028220](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935431590-a879fa42-ad8d-4545-9c41-780436b59782.png&sign=7271a9a7d2d9a92bc5f4c050e988ed6596caf022a388a11a97d81f2939f99ee3)

我们可以传递 `--groupByType` 参数来把相同类型做一个聚类，来让输出更简洁，更容易看懂。large trunk regression 通常会在树中分组到一个节点下, 这让我们可以更容易发现那块内存是什么。注意上图高亮部分，同样是 mealData 大概有 13 MB。

![image-20210616120714875](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935431725-363156da-92eb-4829-a3cd-b7f09ec3b296.png&sign=a7e2b6774df61062f58f340d470742916d8a6d66f14e273063d38933be0451ee)

因为 memgraph 启用了 MSL，所以可以使用 `malloc_hisatory -fullStacks` 来弄清楚这个对象怎么被创建的。

```
malloc_hisatory -fullStacks app.memgraph address
```

address 可以使用我们之前收集的地址，这样我们就可以得到这个地址的对象创建的堆栈了。请看上图第三行，  saveMeal 函数创建了这个对象。

**验证**

所有线索都指向 mealData， 现在让我们打开 Xcode 一探究竟。

![image-20210616164455729](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935432991-e2421161-b229-47d1-ad5c-5108de76f7a1.png&sign=484c6fdce5f3fda9712347ba9b5cebc7248a5c7e16282bf0abb33ad5ad13d97f)

找到罪魁祸首了，函数在一个自定义的 cell 的 view  里，这里创建了 raw buffer 并包装成了 mealData 对象。为了填充数据和保存数据到磁盘，这里创建了这个 buffer。一旦保存到磁盘，我们就不再需要这个 buffer 了。所以不应该一直用 mealData 属性保存着这个数据，因为只要这个 view 实例存在，这个 buffer 就会一直存在。这意味着，当我点击任意 cell 上的 saveMeal 按钮，这个 cell 就会创建并持有一个很大的 buffer，直到这个 cell 被销毁。当我点击多个 cell 上的保存按钮时，内存加起来就会很大。所以我们该如何解决？有两种常用的解决方式，可以根据具体情况进行选择。

**方法一**：我们只把 mealData 定义在函数中，但是我知道这个类的其他地方在使用 mealData，所以我不想这么做。    

![image-20210616170232527](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935433169-9125060a-33fe-44c8-bc97-dccece81b989.png&sign=42759d5d9214e491f9f1a2aeaf31b5f8d615714814cbb10d49abfa2d7aed3d67)

**方法二**：另一个方法就是，当 mealData 保存到磁盘之后，手动置 nil。swift中的数据对象管理很聪明，一旦这个对象没有任何引用的时候，它就会被自动释放。

#### 5.3 检测和诊断碎片化

![image-20210616223523732](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935434787-a002494d-fe12-43cb-b8fc-87f91f9fb1a7.png&sign=c3f1b143614e470fde8e1c1296005b8011b29488b55b62c7d3c88e5ac556cb8f)

我手动创建了一些对象，被标记为 my object，由于我没有太关注我的代码，系统最终交错安插了我的对象和其他对象，

![image-20210616223633731](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935435247-d4a502b0-2cc8-4bf5-9793-cd650950978d.png&sign=6e17ddcc2dbf2911ad357a75357d2c584335b12a2ac6b5a339734fdce4daa3f7)

现在我释放掉了我的对象，出现了四个空闲的空槽，因为 allocated object 的存在，它们都没有连续，这将导致50%的碎片化和四个 dirty page。

![image-20210616224228526](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935435393-256e506f-c84c-4591-9e0d-91cd18a870b4.png&sign=f95966c1d6f4d19eed714fa88dbe1cd8ce677d0c4a3648df52f3f107b046e8eb)

假如我写的代码**一起创建了所有 my object**, 它们最终就会只会占用两个 page。

![image-20210616224248384](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935435423-793cccdc-84d6-49c3-976c-6f714dc0a8e6.png&sign=d44a2e70968a962342921c0bfc1268d113a41886657dd73947421fe6b1f5f0f9)

当我释放掉所有的 my object，进程就会空出两个 clean page 给系统。结果就会得到两个 clean page 两个 dirty page 以及0%的碎片化。

注意碎片化是怎样成为占用空间的倍增器的。50%的碎片化就会让我们的内存占用翻倍。从两个 dirty page 变成 4 个 dirty page。

![image-20210617103651724](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935435807-886c366b-29d9-4ca1-a09b-8351a7b0ad78.png&sign=8b938e8ff1dd262f7aa55afdd9702f4d8d40ca32533072a532565c09ad8e24d2)

在大多数真实的场景中，一些碎片是不可避免的, 所以作为经验法则，把我们需要把**碎片化降低到25%或者更少**。

**使用 autorelease pool 是一种减少碎片的方式**，自动释放池会在执行超出释放池范围时告诉系统释放在它内部分配的所有对象,这有助于确保创建所有在释放池内的对象具有**相似的生命周期。**

尽管碎片化可能是所有进程的问题，**长时间运行的进程尤其容易产生碎片化**。因为他们有许多创建和销毁的对象，分割地址空间的可能性会更大。比如：如果你的 app 使用长时间运行 extensions，一定要看一看这些进程的碎片化。

![image-20210617103956837](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935436059-2a1a3400-31f5-4101-bdb2-509775c91ed5.png&sign=3f513d1fd595ecc575dd320718d4c153ea3c90a48c453d938fdb9325662141f3)

下面来快速的看一下我的进程碎片，我使用 `vmmap -sunmmary`,并且滚动到输出的最下面。

![image-20210617104153630](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935436318-a5fb0b77-f8dc-4b96-9132-f20a68bddeff.png&sign=3999157b5e21f29e89c6a306955771698113dade68aa1c070bc34109ee1611f1)

高亮的部分按照 malloc zone 进行划分，每个 zone 包含不同类型的创建，通常我只需要关心 DefaultMallocZone，因为那是我的堆分配默认结束的地方。然而因为这个 memgraph 启用了 MSL，我真正关心的是 MallocStackLoggingLiteZone,只要启用了 MSL,这个区域就是所有堆分配结束的地方。

![image-20210617105552030](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935436387-1fa85c1a-c50b-4bcd-bc96-62a03e631676.png&sign=c366d1f5763cb95f2809ec9717b2d16eff24727f3b3f08ac3b63abd90fb92449)

`% FRAG` 这一列展示了我的内存在分配的所有 zone 上因为碎片产生浪费的百分比。他们中的一些数值真的比较大。但是我只需关心 `MallocStackLoggingLiteZone`，这个因为 `MallocStackLoggingLiteZone` 有最多的脏内存份额。脏内存总共5 MB，`MallocStackLoggingLiteZone` 占用4.3 MB。所以这种情况下，我可以忽略其他 zone。 `dirty + swap frag size` 这一列精确的展示了因为碎片每一个 `malloc zone` 有多少内存被浪费了 。

![image-20210617170856971](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935436655-97425df8-1848-46a2-a187-88d64d6a4d04.png&sign=82f3ec15f70d2f57dffb501088bc2fd8a7ed67763d172b3106db273abea5e096)

 在这个 `case` 中，我因为碎片浪费了大约 800 KB。这个看起来很多，但是我们之前提过，一些碎片化问题是无法避免的，所以只要我还在 **25%** 碎片化以下，我就认为这个浪费是可以接受的。

![image-20210617171420011](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935437081-c96923df-cb10-4834-8609-4bdcd17b268b.png&sign=41414486dc770a7fa889f25eeb09e1b7f76b486e87c68b01f51267039d2b5635)

目前`MallocStackLoggingLiteZone` 的碎片化还在 19% 左右,这显然低于 25% 的经验法则,所以我还不用担心。

![image-20210617195647203](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935439543-ce3d6215-7eac-4def-a857-e193e30c0bdb.png&sign=38470eb3bc65dd8fb6eba385cf36f24694564abf4dd8bfa66f873ad1423ac1d5)

如果我真的有碎片化问题，我可以使用 `instruments` 的工具 `Allocations`  去追踪这个问题，具体来说，我希望查看分配列表视图，看看在我感兴趣的区域中哪些对象被持久化和销毁了。

![image-20210617195714870](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935440020-9cd61d99-bdc3-4b13-950b-cbfc67149708.png&sign=48f221cfbba3eafafa61738a9a286c5c84f5eae0fbb14793c4ae3b2bd47c8b6e)

在碎片化的背景下，被销毁的对象创建了内存空槽，而持久化对象是剩余的对象负责保持 `dirty page`, 当你研究碎片化的时候，它们都值得研究。想知道怎样使用 `instruments` 工具的更多信息请参阅： [WWDC19 Getting Started with Instruments](https://developer.apple.com/videos/play/wwdc2019/411)

![image-20210617200756322](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935440544-79f5bc61-3ba2-4890-b2c9-37ae979c6849.png&sign=e4b4c9220fd8a228f02eca8082d7f2df5ecdef1e785d820b2411de4dc9e3dbae)

总结一下如何解决碎片化问题：

* 尽量保证连续创建生命周期相似的对象
* 碎片化尽量降低到 25% 或者更少
* 使用 autorelease pool 是一种减少碎片的方式
* 长时间运行的进程尤其容易产生碎片化，多关注一下这些进程的碎片化。
* 也可以使用 instruments 的 allocations 工具来诊断碎片化问题。

#### 5.4 回顾

![image-20210617200949635](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935441101-42b933a6-05a0-4afe-987c-82ed2b73725f.png&sign=c0c38aafd9f8ec1c22b0a4adacde0cc4c45431788f8d63a393ec3a70f782913d)

现在，我已经解决了泄露和堆回归，验证了碎片化不是一个问题。在此运行 `Xcode`。太棒了，现在测试通过了，并且回归问题也被解决。现在你已经学习到了关于 检测和诊断内存问题，让我们来回顾一下在你自己 app 可以使用哪些工作流程。

##### 5.4.1 检测流程

![image-20210617201641291](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935441752-6d12b134-0af6-404c-a34e-82dfa83cb766.png&sign=2acc4d41eb90d872c91f01661ff5d90a0ef2d61118c0adeb3235bc52d7dfdfd2)

任何时候，你添加一个新的功能，用 `XCTest` 写一个性能测试来监测内存,和其他系统指标。为每个测试设置 baseline。然后用测试来捕获回归，并使用收集到的 `ktrace` 和 `memgraph` 文件进行调查。

##### 5.4.2 诊断流程

![image-20210617202711003](https://www.yuque.com/api/filetransfer/images?url=https%3A%2F%2Fcdn.nlark.com%2Fyuque%2F0%2F2021%2Fpng%2F21867895%2F1623935441972-32f3f428-183d-4a41-afd2-5ed812773993.png&sign=6b0cdd60b85c5940acdb2004ee36c88807d583c37dbd052ad1720d6ef7264356)

使用在执行 `XCTest` 失败生成的 memgraph 文件来帮忙诊断你的内存问题，首先你应该检查泄露，使用 `leaks` 工具并且使用 MSL 堆栈来帮忙找到需要修复的泄露。如果回归不包含泄露，再去检查堆。使用 `vmmap -summary` 来确认堆上的内存。如果需要,使用 `heap -diffFrom` 来查看那个对象类型需要对内存的增长负责。如果罪魁祸首看起来很明显, 使用 `heap -addresses` 来获取地址。如果罪魁祸首看起来并不明显，尝试使用 `leaks -referenceTree` 来找到一些线索。最后,搭配使用 `leaks -traceTree`  `malloc_history` 来找到有问题的对象地址。

最后，确保你在开发中将这些最佳实践牢记在心。努力让你的应用程序零泄漏。如果你使用 `unsafe` 类型，**确保你会释放任何你创建的东西**。同时也要注意代码中的循环引用，找到一种方式来减少你的堆分配，你可以缩小它们, 并且尽量把持有它们的时间变的更短。或者完全**取消不必要的分配**。确保把碎片化问题牢记在心，创建的对象要尽量相邻并且具有相似的生命周期，以便稍后创建的大块空闲内存。使用这些最佳实践和 `XCTest` 工作流，您将能够检测、诊断和修复应用程序中的内存问题。

**作者总结**：

本 session 主要介绍使用 XCTest 写性能测试来检测内存问题(泄露和碎片化)，这是一种可重用的，更加系统性的检测内存性能的方式，但是每个 app 都有自己的情况，可能因为种种原因，目前还不能使用 XCTest 来对 app 进行测试，或者开发者目前对内存问题查找及命令工具不熟悉的时候，Xcode  的 `Debug Memory Graph` 就是一个很好的入门工具。它可以很方便的帮我们查找泄露，并且这个工具是可视化的。你只需要运行工程，用手点一遍自己的新功能，然后点击 `Debug Memory Graph` 来捕获内存图，通过筛选来看内存中的泄露，或者查看目前的存活对象及其创建堆栈和引用关系， `Debug Memory Graph` 是一种轻量级的，更方便、更快速、更直观的方式来让你了解自己 app 内存的使用情况。如果需要，你还可以在 `Debug Memory Graph` 时，导出当前捕获的内存图的 memgraph 文件，你可以多次导出然后就可以使用命令行工具 heap 新增的 diffFrom 功能了哦，你可以结合上面学到的命令工具，帮你最大程度的了解内存问题。不知道 `Debug Memory Graph` 使用方式的，建议观看 [WWDC18 iOS Memory Deep Dive](https://developer.apple.com/videos/play/wwdc2018/416) 或者阅读 [深入解析iOS内存 iOS Memory Deep Dive](https://www.toutiao.com/i6569037697183121934) 来获取更多信息。

**拓展阅读**

[WWDC21 Ultimate application performance survival guide](https://developer.apple.com/videos/play/wwdc2021/10181)

[WWDC19 Getting Started with Instruments](https://developer.apple.com/videos/play/wwdc2019/411)

[WWDC21 Understand and eliminate hangs from your app](https://developer.apple.com/videos/play/wwdc2021/10258/)

[WWDC18 iOS Memory Deep Dive](https://developer.apple.com/videos/play/wwdc2018/416)

[深入解析iOS内存 iOS Memory Deep Dive](https://www.toutiao.com/i6569037697183121934)

[Memory Usage Performance Guidelines](https://developer.apple.com/library/archive/documentation/Performance/Conceptual/ManagingMemory/ManagingMemory.html)

[OSX_Mavericks_Core_Technology_Overview](https://images.apple.com/media/us/osx/2013/docs/OSX_Mavericks_Core_Technology_Overview.pdf)

[Understanding iOS Memory](https://zhuanlan.zhihu.com/p/37082579)

[Instruments Help](https://help.apple.com/instruments/mac/current/#//apple_ref/doc/uid/TP40004652)

[Handling low memory conditions in iOS and Mavericks](http://newosxbook.com/articles/MemoryPressure.html)