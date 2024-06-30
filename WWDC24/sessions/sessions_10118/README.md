---
session_ids: [10118]
---

# WWDC24 10118 - UIKit 新功能

> 摘要: 本文主要介绍了iOS18中UIKit的一些更新，包括选项卡和文档启动体验、流畅的转场、文本和输入体验改进，同时还介绍了 UIKit 和 SwiftUI 动画和手势之间前所未有的互操作性，以及整个 UIKit 的一般性改进。

本文基于[Session 10118](https://developer.apple.com/videos/play/wwdc2024/10118/?time=163)进行梳理，感谢@Vong Sorry @ChengzhiHuang 两位老师的Review，感谢@SwiftOldDriver社区提供的机会。

> 作者:
>
> Sharker，一年iOS开发经验，目前在北京某国企负责支付SDK相关研发，对于UI展现与编译较为感兴趣，[Github](https://github.com/AkaShark)
>
> 审核:
>

UIKit 作为老牌的UI框架在很多应用场景中依然有着不可替代的作用，在 iOS 18 中UIKit 也迎来了一些新的改变，在观看完[Session 10118](https://developer.apple.com/videos/play/wwdc2024/10118/)后对我印象最大的新特性包括了新的缩放转场效果，UIKit与SwiftUI在动画与手势中的交互以及`UITextView`富文本的支持，从Apple iOS 18 的更新中看出来，UIKit除了常规的更新外越来越注重其与SwiftUI的交互。本文将按照[Session 10118](https://developer.apple.com/videos/play/wwdc2024/10118/)视频介绍新特性的顺序逐一的进行介绍，当然读者也可按照兴趣程度选择性阅读，每年的What's new in UIKit 其实更像是一个"Index"文件，其中会大概介绍涉及UIKit的新更新，然后引出一篇新的 Session ，在文章中我将尽可能的去补充引入的Session，但是因为篇幅和时间的原因可能介绍的并不是很完善，感兴趣的读者可以选择继续阅读对应 Session 的文章。

本文主要围绕以下三个部分展开介绍
![table_of_content](./images/table_of_content.png)

1. UIKit 核心功能更新
2. UIKit 与 SwiftUI 交互
3. 常规功能增强


## UIKit 核心功能更新 - key features

### 重设计的文档启动体验 - Document lanunch experience

### 标签栏和侧边栏的视觉更新 - Tab and sidebar refresh

### 全新的转场效果: 缩放转场 - Fluid transitions

## UIKit 与 SwiftUI 交互 - UIKit and SwiftUI interoperability

### 动画 - Animations

### 手势 - Gesture recognizers

## 常规功能增强 
### 自动特征跟踪 - Automatic trait tracking
### 列表视图改进 - List improvements
### 定期UI更新刷新 - Update link
### SF Symbol 动画 - Symbol animations
### 感官反馈 - Sensory feedback
### 文本格式化拓展 - Text improvements
### 菜单操作 - Menu actions
### Apple 触控笔 Apple Pencil

