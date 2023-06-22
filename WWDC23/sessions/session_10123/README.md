---
session_ids: [10123]
---

# Session 10123 - 把你的游戏移植到 Mac 上，第一部分：制定移植计划

本文基于 [Session 10123] ([Bring your game to Mac, Part 1: Make a game plan](https://developer.apple.com/videos/play/wwdc2023/10123/?time=127))梳理。

这是今年 WWDC 中我认为第二有趣的主题（第一当然是 Apple Vision Pro 😁），其中最令我兴奋的当属 Game Porting Toolkit。这个系列主题将指导游戏开发者 - 如何渐进式地将 Windows 游戏移植到 Mac 上。本主题分为三个部分，其中本文为第一部分，主要带读者体验一遍移植游戏的全流程。

## Game Porting Toolkit

首先介绍一下大杀器 - Game Porting Toolkit。
它是苹果提供的移植套件，旨在提升游戏开发者的移植效率。既然是套件，就包含了许多功能，这里先重点介绍一下「环境模拟器」，其他功能下文会陆续介绍。

在说这个模拟器是什么之前，先上三张图，开开胃：
![2077](./images/CyberPunk2077.png)
![FF7](./images/FF7.png)
![EldenRing](./images/EldenRing.png)
如果你是游戏爱好者，我相信你已经开始激动了。没错，这三款近年热门的 3A 大作是跑在我 M1 芯片的 MacBook Air 上的。虽然苹果的本意不是这样，但这意味着 Mac 可以玩游戏了！

![MacForGame](./images/MacForGame.jpg)

它有什么样的游戏表现呢？
![GameList](./images/GameList.jpg)
👆🏻 以上是国外大佬总结的游戏可玩性清单，[传送门](https://docs.google.com/spreadsheets/d/1t_E04Qt411f9mEZJVku_OJsEe6XCqZZsdqtjVaMCcgk/edit#gid=0)（需要梯子）
心动了吗？想要动手试试，你可以下载 [Game Porting Toolkit](https://developer.apple.com/download/all/?q=game%20porting%20toolkit)，打开里面的 Read Me.rtf 跟着步骤试试看。不过，我更推荐神秘的民间力量：

1. 这篇[博客](https://www.outcoldman.com/en/archive/2023/06/07/playing-diablo-4-on-macos/)手把手教你在 Mac 上，把大菠萝 IV 跑起来。
2. 这个叫做 [macgaming](https://www.reddit.com/r/macgaming/) 的 reddit 小组就更厉害了，里面讨论着用 Mac 玩游戏的一切。从名字你就可以看出，里面聚集了一大堆有大病的表叔，用 Mac 玩游戏 :)。

看到这里，好奇心浓厚的你一定想知道，这一切是怎么做到的？别着急，这一切要从 [Wine](https://www.winehq.org/) 这个神奇的软件说起：

> Wine （“Wine Is Not an Emulator” 的首字母缩写）是一个能够在多种 POSIX-compliant 操作系统（诸如 Linux，macOS 及 BSD 等）上运行 Windows 应用的兼容层。Wine 不是像虚拟机或者模拟器一样模仿内部的 Windows 逻辑，而是將 Windows API 调用翻译成为动态的 POSIX 调用，免除了性能和其他一些行为的内存占用，让你能够干净地集合 Windows 应用到你的桌面。

简单来说，Wine 牛逼的地方在于它翻译而不是模拟，它需要猜测 Windows API 的实现，自己实现一套一模一样的。工作量的庞大可想而知，但是性能比虚拟机好了许多。

在苹果之前，Valve 推出的掌机 Steam Deck 就用了这套方案，它能运行 Steam 平台上绝大多数 Windows 游戏，就是基于一个名叫 Proton 的兼容层，而 Proton 就是就是基于 Wine 实现的。得益于 Wine 的强大，Steam Deck 用了挺普通的芯片，也能将各种 3A 游戏玩弄于股掌之间。

> 以下三张图片来自视频：[新款 Mac Studio 硬核体验](https://www.bilibili.com/video/BV1414y1S7WK/?share_source=copy_web&vd_source=f43900ea7c4055afb06e651364f3d6ba) by 虽然但是张黑黑

![WinToMac](./images/WinToMac.jpg)

还有一个问题需要解决，那就是 Direct3D 的问题。

> Direct3D（简称：D3D）是微软公司在 Microsoft Windows 操作系统上所开发的一套 3D 绘图编程接口，是 DirectX 的一部分，目前广为各家显卡所支持。与 OpenGL 同为电脑绘图软件和电脑游戏最常使用的两套绘图编程接口之一。

如果只是为了翻译 D3D，其实已经好几套方案。比如，CrossOver、virtualbox。但是，这次苹果直接适配了 D3D 12，这是其他厂家想做但是一直没做到的。而大部分新款 3A 大作都是基于 D3D 12 的，所以苹果这次将 D3D 12 翻译成 Metal 才会引发这么多关注。

![D3DToMetal](./images/D3DToMetal.jpg)

总结来看，环境模拟器做了两次翻译，首先是将「基于 D3D 的 x86 架构的 Windows 游戏」翻译成「基于 Metal 的 x86 架构的 Mac 游戏」，再将「x86 架构的 Mac 游戏」翻译成「ARM 架构的 Windows 游戏」，主要 M 系列芯片的 Mac 就可以愉快地运行游戏了。

![WhatAppleDone](./images/WhatAppleDone.jpg)

既然是翻译了两次，一定是有性能损耗的，业界估计平均损耗在 50% 上下。

## 移植计划

此处补一个鱼骨图
简单介绍一下移植六部走流程：评估游戏 - 编辑脚本 - 用 Metal 渲染 - 输入 - 音频 - 显示
