---
session_ids: [10076]
---

# Session 10076 - 将你的 iOS 应用搬到 Mac 上

> 作者：JPlay，iOS 开发者，Base 厦门，曾就职于美图，现就职于稿定科技
> 审核：待审核同学填充
> 引申：本文基于 [WWDC2022 Session 10076](https://developer.apple.com/videos/play/wwdc2022/10076/%20) 梳理。

## iPad 与 Mac 的融合之路

![Virtualization-mind](./images/MAndMacCatalyst.png)

*苹果嘴上说不要，身体却很诚实。*
虽然 Tim Cook 和苹果高级副总裁 Craig Federighi 都曾经明确否认 iOS 与 macOS 并不会走向融合，还强调 Mac 设备不可能推出触屏版，但是其实苹果在 2019 年开始，就在推动开发者将 iOS 应用带到 macOS 中。

在 M 系列芯片的支持上，两者已经在硬件上实现了打通：

- 相同的芯片架构，带来了指令集的统一
- 相同的大尺寸屏幕，带来了可展示内容的统一
- iPad 支持鼠标键盘之后，两者甚至可以用一模一样的交互方式

唯一不同的，可能就是一些历史问题：

- UIKit vs AppKit
- 触控 vs 键鼠
- iPad 专属传感器、前后摄像头在 Mac 上的缺失

在这样的大背景下，iPad 与 Mac 的融合已经开启。苹果逐步减少更新 AppKit，转而推动 Mac Catalyst，可见一斑。
