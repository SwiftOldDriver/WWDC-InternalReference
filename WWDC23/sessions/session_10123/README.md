---
session_ids: [10123]
---

# Session 10123 - 把你的游戏移植到 Mac 上，第一部分：制定移植方案

本文基于 [Session 10123] ([Bring your game to Mac, Part 1: Make a game plan](https://developer.apple.com/videos/play/wwdc2023/10123/?time=127))梳理。

这是今年 WWDC 中我认为第二有趣的主题（第一当然是 Apple Vision Pro 😁），其中最令我兴奋的当属 Game Porting Toolkit。这个系列主题将指导游戏开发者 - 如何渐进式地将 Windows 游戏移植到 Mac 上。本主题分为三个部分，其中本文为第一部分，主要带读者体验一遍移植游戏的全流程。

## Game Porting Toolkit

首先介绍一下大杀器 - Game Porting Toolkit。

它是苹果提供的移植套件，旨在让开发者在不改一行代码的情况下，就看到游戏运行在 Mac 上的情况。

在详细介绍它之前，先上三张图，开开胃：

![2077](./images/CyberPunk2077.png)
![FF7](./images/FF7.png)
![EldenRing](./images/EldenRing.png)

如果你是游戏爱好者，我相信你已经开始激动了。没错，这三款近年热门的 3A 大作是跑在我 M1 芯片的 MacBook Air 上的。虽然苹果的本意不是这样，但这意味着 Mac 可以玩游戏了！

![MacForGame](./images/MacForGame.jpg)

它有什么样的游戏表现呢？

![GameList](./images/GameList.jpg)

以上是国外大佬总结的游戏可玩性清单，[传送门](https://docs.google.com/spreadsheets/d/1t_E04Qt411f9mEZJVku_OJsEe6XCqZZsdqtjVaMCcgk/edit#gid=0)（需要梯子）。

心动了吗？想要动手试试，你可以下载 [Game Porting Toolkit](https://developer.apple.com/download/all/?q=game%20porting%20toolkit)，打开里面的 Read Me.rtf 跟着教程试试看。不过，我更推荐神秘的民间力量：

1. 这篇[博客](https://www.outcoldman.com/en/archive/2023/06/07/playing-diablo-4-on-macos/)手把手教你在 Mac 上，把大菠萝 IV 跑起来。
2. 这个叫做 [macgaming](https://www.reddit.com/r/macgaming/) 的 reddit 小组就更厉害了，里面讨论着用 Mac 玩游戏的一切。从名字你就可以看出，里面聚集了一大堆有大病的表叔，用 Mac 玩游戏 :)。

看到这里，好奇心浓厚的你一定想知道，这一切是怎么做到的？别着急，这一切要从 [Wine](https://www.winehq.org/) 这个神奇的软件说起：

> Wine （“Wine Is Not an Emulator” 的首字母缩写）是一个能够在多种 POSIX-compliant 操作系统（诸如 Linux，macOS 及 BSD 等）上运行 Windows 应用的兼容层。Wine 不是像虚拟机或者模拟器一样模仿内部的 Windows 逻辑，而是將 Windows API 调用翻译成为动态的 POSIX 调用，免除了性能和其他一些行为的内存占用，让你能够干净地集合 Windows 应用到你的桌面。

简单来说，Wine 牛逼的地方在于它是翻译而不是模拟，它需要猜测 Windows API 的内部实现，自己实现一套一模一样的。工作量的庞大可想而知，但是性能比虚拟机好了许多。

在苹果之前，Valve 推出的掌机 Steam Deck 就用了这套方案，它能运行 Steam 平台上绝大多数 Windows 游戏，就是基于一个名叫 Proton 的兼容层，而 Proton 就是就是基于 Wine 实现的。得益于 Wine 的强大，Steam Deck 用了挺普通的芯片，也能将各种 3A 游戏玩弄于股掌之间。

> 以下三张图片来自视频：[新款 Mac Studio 硬核体验](https://www.bilibili.com/video/BV1414y1S7WK/?share_source=copy_web&vd_source=f43900ea7c4055afb06e651364f3d6ba) by 虽然但是张黑黑

![WinToMac](./images/WinToMac.jpg)

还有一个问题需要解决，那就是 Direct3D 的问题。

> Direct3D（简称：D3D）是微软公司在 Microsoft Windows 操作系统上所开发的一套 3D 绘图编程接口，是 DirectX 的一部分，目前广为各家显卡所支持。与 OpenGL 同为电脑绘图软件和电脑游戏最常使用的两套绘图编程接口之一。

如果只是为了翻译 D3D，其实已经好几套方案。比如，CrossOver、VirtualBox。但是，这次苹果直接适配了 D3D 12，这是其他厂家想做但是一直没做到的。而大部分新款 3A 大作都是基于 D3D 12 的，所以苹果这次将 D3D 12 翻译成 Metal 才会引发这么多关注。

![D3DToMetal](./images/D3DToMetal.jpg)

总结来看，Game Porting Toolkit 做了两次翻译，首先是将「基于 D3D 的 x86 架构的 Windows 游戏」翻译成「基于 Metal 的 x86 架构的 Mac 游戏」，再将「x86 架构的 Mac 游戏」翻译成「ARM 架构的 Windows 游戏」，于是 M 系列芯片的 Mac 就可以愉快地运行游戏了。

![WhatAppleDone](./images/WhatAppleDone.jpg)

既然是翻译了两次，一定是有性能损耗的，业界估计平均损耗在 50% 上下。

当然，Game Porting Toolkit 的能力不仅仅于此，它还翻译了输入控制、音频等功能。一切都是为了让你一行代码不改，就把游戏运行起来。

![GamePortingToolkit](./images/GamePortingToolkit.png)

## 移植方案

话说回来，Game Porting Toolkit 的初衷还是想让游戏开发者可以更加便利地移植游戏，苹果希望开发者在尽可能低成本的情况下，完成游戏移植，百分百利用苹果提供的软硬件能力。于是，苹果推荐了一个移植方案：

![GamePortingPlan](./images/GamePortingPlan.png)

接下来，我会分别介绍这六步流程。

### 评估游戏

得益于 Game Porting Toolkit 提供的环境模拟器，开发者可以在不修改任何代码的情况，直接运行 Windows 版本的游戏。

![PlayGameWithDebug](./images/PlayGameWithDebug.png)

开发者不仅可以在右上角看到游戏运行中的各种参数，还能在终端里直接看到各种需要优化的信息。

浏览一下 HUD 中的可观测信息：

![HUD](./images/HUD.png)

更进一步，你还可以打开 Instrument 做更深度的性能检测：

![Instrument](./images/Instrument.jpg)

基于以上信息，再结合游戏中的实际体验，开发者可以很容易地评估当前游戏移植到 Mac 上需要优化的点，以及大致的工作量。

### 着色器移植

苹果这次还提供了 Metal Shader Converter，用来将 Windows 游戏中的 DXIL 着色器（HLSL 的编译产物）转换为 Metal 可用的版本。

更多详情，可以观看本主题的第二部分：【第二部分传送门占位】。

### 使用 Metal 渲染

在完成了着色器转换之后，就可以使用 Metal 来做渲染了。

Metal 3 提供了现代高端游戏使用的所有高级图形和计算功能，包括 MetalFX、快速资源加载、离线编译、网格着色器和光线追踪，这使得转换图形代码变得非常简单。

![Metal](./images/Metal.jpg)

更多详情，可以观看本主题的第三部分：【第三部分传送门占位】。

### 输入体验移植

在使用 Game Porting Toolkit 体验过游戏的输入体验之后，开发者就可以进行具体的移植了。

在 Mac 上，游戏控制器框架（ Game Controller framework）为游戏提供了线程安全和低延迟的支持，可以在各种外设上进行游戏输入，例如游戏手柄、键盘、鼠标、赛车方向盘和街机摇杆。开发者还可以访问游戏控制器的附加功能，包括触觉反馈和运动感应。Mac 提供系统级别的用户偏好设置，支持每个应用程序的输入重映射，以及自动支持从任何游戏中的控制器进行屏幕截图、录制视频和获取 15 秒游戏高光时刻。

![InputFramework](./images/InputFramework.png)

在这种全方位的功能支持下，无论你的 Windows 游戏用的是第三方的跨平台输入组件，或是底层的 Windows API，还是游戏外设自定义的 SDK，都能获得足够的移植空间。

更多细节可以观看往期的主题：

- [Tap into virtual and physical game controllers](https://developer.apple.com/videos/play/wwdc2021/10081)
- [Advancements in Game Controllers](https://developer.apple.com/videos/play/wwdc2020/10614)

### 听觉体验移植

如果你的游戏是基于第三方跨平台音频组件的话，比如 Wwise、Unity 和 FMOD。那么恭喜你，你几乎不用做任何移植就可以完美适配了，因为这些组件的跨平台版本已经很好地支持了 Mac。

如果你的游戏没有使用跨平台组件，而是采用了更低级别的音频框架或 API，你也可以正常使用苹果提供的各种音频框架来进行移植。

![AudioFramework](./images/AudioFramework.png)

更多细节可以观看往期的主题：

- [Plug-in and play: Add Apple frameworks to your Unity game projects](https://developer.apple.com/videos/play/wwdc2022/10065)
- [Discover geometry-aware audio with the Physical Audio Spatialization Engine (PHASE)](https://developer.apple.com/videos/play/wwdc2021/10079)

### 视觉体验移植

使用 Game Porting Toolkit，你可以在显示器上看到游戏运行在基础动态范围与帧速率控制的 API 上的情况。

在 Windows 上，你的游戏可能会用到颜色管理和色调映射的 API 来实现高动态范围。比如，AdvancedColorInfo 关于颜色空间的 API。还可能会利用 IDXGISwapChain 中 timing 和 feedback 来控制 SDR 和 HDR 内容的节奏。

在 Mac 上，你可以使用 CAMetalLayer 的扩展动态范围支持，以及 CAMetalDisplayLink 提供的 API 来实现完整的功能移植。

![DisplayFramework](./images/DisplayFramework.png)

更多细节可以观看往期的主题：

- [Explore EDR on iOS](https://developer.apple.com/videos/play/wwdc2022/10113)
- [Explore HDR rendering with EDR](https://developer.apple.com/videos/play/wwdc2021/10161)

## 结束语

至此，我们介绍完了游戏移植的所有步骤。

可以看出苹果今年在游戏上是下了大力气的。不论 Game Porting Toolkit 还是 Metal Shader Converter，都是为了让开发者更有动力来移植游戏，最终让自家的游戏生态更加繁荣。

为什么今年来苹果对游戏生态愈加重视呢？之前我不懂，今年看到 Apple Vision Pro 我终于明白了。Apple Vision Pro 想要快速普及和应用，短时间内可能还是要落地在游戏领域，而今天 Mac 的游戏生态，也是为了未来的 Apple Vision Pro 生态去铺路。核心还是 Metal 的普及和推广上，如果能在近几年吸引一批开发者通过移植游戏熟悉 Metal，并积累一些开源生态，未来等 Apple Vision Pro 真正大量铺货的时候，一切也就水到渠成了。
