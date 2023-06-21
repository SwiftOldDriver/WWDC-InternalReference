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

看到这里，好奇心浓厚的你一定想知道，这一切是怎么做到的？别着急，这一切要从 wine 这个神奇的软件说起。

## 移植计划

此处补一个鱼骨图
简单介绍一下移植六部走流程：评估游戏 - 编辑脚本 - 用 Metal 渲染 - 输入 - 音频 - 显示
