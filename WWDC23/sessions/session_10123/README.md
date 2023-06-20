---
session_ids: [10123]
---

# Session 10123 - 把你的游戏移植到 Mac 上，第一部分：制定移植计划

本文基于 [Session 10123] ([Bring your game to Mac, Part 1: Make a game plan](https://developer.apple.com/videos/play/wwdc2023/10123/?time=127))梳理。

这是今年 WWDC 中我认为第二有趣的主题（第一当然是 Apple Vision Pro 😁），其中最令我兴奋的当属 Game Porting Toolkit。这个系列主题将指导游戏开发者 - 如何渐进式地将 Windows 游戏移植到 Mac 上。本主题分为三个部分，其中本文为第一部分，主要带读者体验一遍移植游戏的全流程。

## Game Porting Toolkit

首先介绍一下大杀器 - Game Porting Toolkit。
它是苹果提供的移植套件，旨在提升游戏开发者的移植效率。既然是套件，就包含了许多功能，这里先重点介绍一下「环境模拟器」，其他功能下文会陆续介绍。

在说这个模拟器是什么之前，先上三张图，震撼一下：
![2077](./images/CyberPunk2077.png)
![FF7](./images/FF7.png)
![EldenRing](./images/EldenRing.png)

## 移植计划

此处补一个鱼骨图
简单介绍一下移植六部走流程：评估游戏 - 编辑脚本 - 用 Metal 渲染 - 输入 - 音频 - 显示
