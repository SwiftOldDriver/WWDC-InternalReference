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
对于文档类的修改其实在WWDC23中的[What's new in UIKit](https://developer.apple.com/videos/play/wwdc2023/10055/)也有提及到，在iPadOS 17中，Apple改进了对文档应用程序的支持，UIKit提供了一个新的`UIDocumentViewController`作为内容视图控制器的基类，具体可以回看下[WWDC23 Build better document-based apps](https://developer.apple.com/videos/play/wwdc2023/10056)。

在WWDC24中Apple将基于`UIDocumentmentViewController`的文档启动页进行了新的设计，将文档类启动页进行了结构化的设计。
![Document lanunch experience_1](./images/Document%20lanunch%20experience_1.png)
> 页面样式的头部分可以添加前景资源与后景资源

![Document lanunch experience_6](./images/Document%20lanunch%20experience_6.png)
> 同时页面样式的头部分可以添加背景色，设置包括背景色、渐变色、图片等

![Document lanunch experience_2](./images/Document%20lanunch%20experience_2.png)
> 页面样式的中间部分为标题部分

![Document lanunch experience_3](./images/Document%20lanunch%20experience_3.png)
> 页面样式标题下面的部分为主Button，标示着文档应用想要表达的首要行为

![Document lanunch experience_4](./images/Document%20lanunch%20experience_4.png)
> 页面样式主Button下面的部分为次Button，标示着文档应用想要表达的次要行为

![Document lanunch experience_5](./images/Document%20lanunch%20experience_5.png)
> 页面样式最下面的部分为文档浏览区域

想要使用新的启动页样式，则需要将`UIDocumentViewController`设置为根视图，将原本设置为根视图的`UIDocumentBrowserViewController`替换掉。
![Document lanunch experience_7](./images/Document%20lanunch%20experience_7.png)

当然也可以通过iOS 18更新的API来完成更多自定义的样式，具体的细节可以阅读以下两个Session
[WWDC23 Build better document-based apps](https://developer.apple.com/videos/play/wwdc2023/10056)。
[Evolve your document launch experience](https://developer.apple.com/videos/play/wwdc2024/10132/)

### 标签栏和侧边栏的视觉更新 - Tab and sidebar refresh
标签栏和侧边栏的应用更多是在iPadOS上，在[WWDC23 What's new in UIKit](https://developer.apple.com/videos/play/wwdc2023/10055/)中也有对于侧边栏的更新，在WWDC23 iOS17中为侧边栏提供了新的行为，侧边栏可以自动，当页面宽度减小时，会根据需要隐藏侧边栏，如果在点击侧边栏按钮时没有足够的空间进行平铺，会以覆盖或者位移方式显示次要列与侧边栏，开发者可以使用`preferedDisplayMode`和`preferredSplitBehavior`在应用程序中覆盖此行为。
![WWDC23 New sidebar behavior](./images/WWDC23%20New%20sidebar%20behavior.gif)

在WWDC24中，Apple不但针对于侧边栏进行了优化增加了新的自定义能力同时对于标签栏的UI样式进行了优化。新的标签栏采用了更紧凑的外观，减少了垂直和水平的空白空间，并将其整体浮于应用上。
![tab_sidebar_1](./images/tab_sidebar_1.png)

对于侧边栏来说，现有的侧边栏应用可以采用新的`UITabBarController`API来获取组合标签栏和侧边栏的新体验。这种组合标签栏与侧边栏在开发中是常见的需求，具体来说是在最小化侧边栏的时候侧边栏会以动画的形式变成选项卡栏展示，从功能上通过侧边栏可以访问应用的更多功能，标签栏可以对应用主要的功能进行快速切换，从体验上在侧边栏变为标签栏展示时可以让应用的主体内容更加突出。
![tab_sidebar_2](./images/tab_sidebar_2.gif)


使用新的侧边栏API还提供了自定义的能力，可以通过拖拽的方式来自定义的展示侧边栏和标签栏具体功能项的位置。
![tab_sidebar_3](./images/tab_sidebar_3.png)

要使用上述功能需要使用新的`UITab`和`UITabGroup` API，通过这些API可以将应用中标签栏与侧边栏进行结构化的描述。此外这些API还兼容了多平台，包括了Mac Catalyst和VisionOS，想要了解更多内容可以阅读[Elevate your tab and sidebar experience in iPadOS](https://developer.apple.com/videos/play/wwdc2024/10147/)。
![tab_sidebar_4](./images/tab_sidebar_4.png)

> 在这篇Session中以iPad中的时钟应用介绍了标签栏的新样式，以iPadOS上的Apple TV介绍了侧边栏与标签栏的结合，同时在这篇Session也给出了关于使用Tab bar 与 sidebar 的一些实践推荐
![tab_sidebar_5](./images/tab_sidebar_5.png)

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

## 总结


## Ref


