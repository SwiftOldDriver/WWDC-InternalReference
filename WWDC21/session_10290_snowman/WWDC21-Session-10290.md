#What's new in AVKit


>本篇来源为WWDC2021 中 [What’s new in AVKit](https://developer.apple.com/videos/play/wwdc2021/10290/) 

我们将会介绍Apple对画中画（或简称PiP）以及 macOS 上的全屏体验所做的一些改进。

# Picture in picture (PiP)

通过画中画，用户可以在使用设备进行多任务处理的同时继续欣赏他们的视频内容

*例如，如果我们正在全屏观看视频并收到一条消息，可以在保持继续观看的同时回复该消息；视频会自动进入画中画，回复完毕后即可快速恢复全屏播放。*

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/71aed66878239173515a80d0edf0db03.png" width=600 />



在观看视频时用户可以通过这个特性享受到无缝体验

>关于将 PiP 集成到应用程序中的介绍，大家可以看看 WWDC2019 关于AVKit的Session：[Delivering Intuitive Media Playback with AVKit](https://developer.apple.com/videos/play/wwdc2019/503/)


今年又新增了内联播放的能力，可以让用户滑动回主屏幕时自动进入画中画：

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/81eb76b69826ec2d8dcc55b023bca781.png" width=600 />

可以通过设置属性canStartPictureInPictureAutomaticallyFromInline  = true来实现：

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/946cb28507807021073129a673dc5666.png" width=600 />

*AVPlayerViewController和AVPictureInPictureController都拥有此属性，分别适用于默认控件和自定义UI；但开发者需要确保只有在当前播放内容是用户的主要焦点时才将此标志设置为 true。*


- 使用 AVPlayerViewController 来呈现视频内容，那么PiP请求会自动处理
- 如果不使用 AVPlayerViewController，我们仍然可以使用 AVPictureInPictureController 为应用程序带来原生画中画体验

首先，要能够播放，我们需要先配置应用程序AudioSession的对应Category——再启用画中画后台模式；然后创建一个pictureInPictureController，并传入一个playerLayer 的引用：

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/9f4e55a79e8d51b79757b6390bc2c737.png" width=600 />

当用户尝试通过交互切换画中画时，我们需要在控制器对象上调用启动或停止画中画

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/f8c48bf23ec3302cdf3c760c3e362d44.png" />

上面介绍的画中画体验是使用 AVPlayer 来构建的，但自定义UI应该怎么办？

**答案是，iOS 15对 AVSampleBufferDisplayLayer 提供相同级别的支持！**

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/cd25c7cb24b63caeb9e0a738c5324c77.png" width=600 />

首先要创建 ContentSource——可以使用 AVPlayerLayer 或上面代码的AVSampleBufferDisplayLayer 来设置，而对于用户来说，画中画体验将是相同的！

在使用AVSampleBufferDisplayLayer时，需要关注相关播放委托：

我们需要依赖新的 AVPictureInPictureSampleBufferPlaybackDelegate 接收播放状态信息，进行UI更新（因为媒体播放不是 AVPlayer 自动管理的）

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/da10a40b9111862c6921d989d9ab88ec.png" width=600 />


当用户尝试从画中画界面上控制媒体时，系统会将这些命令转发给委托进行处理，我们看看这五个回调：
- 当用户按下画中画窗口中的播放/暂停按钮时，将调用 setPlaying 函数
- 当用户按下跳过按钮之一时，会调用 skipByInterval 函数

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/61f89ed59f6816e125279f079ad82ba3.png" width=600 />


使用这些回调来控制媒体播放：

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/b6fe62219ec62b01415f12b98dab0b86.png" width=600 />

- timeRangeForPlayback 函数允许您指定当前可播放的时间范围。
  - 允许我们渲染时间线并显示播放头当前的位置
  - 用有限持续时间的范围来表示当前媒体的总时间
  - 用无限持续时间表示实时内容

- didTransitionToRenderSize 函数在画中画窗口更改大小时调用（例如在双指缩放时）

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/28318bb07a54a016103ab8552618135e.png" width=600 />

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/aace82c5cda86b4ec0da9526721d4b38.png" width=600 />




> 对开发者而言，在选择媒体时应考虑渲染大小，以避免不必要的解码开销

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/aa95ecc8d249745bac0135ed35071bd6.png" />

- 当播放状态被暂停或恢复时isPlaybackPaused 函数会被回调
  - 在概念上等同于 AVPlayer 上的 timeControlStatus


下面让我们再介绍一下Apple对 macOS 上的全屏体验做的一些改进。

# Mac全屏播放体验
在 Big Sur 中，当用户在 Mac Catalyst 应用程序中全屏拍摄视频时，视频会填满整个窗口，但不会填满整个屏幕。

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/30455684fa0b628e1d89c41aa810aaec.png" width=600 />


而在 macOS Monterey 中，视频将占据整个屏幕（如动画所示）：

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/74c64f8b7ca703f28c2034661b34dde7.gif" width=600 />

- 原生 macOS 和 Mac Catalyst 应用程序都会获得真正的全屏体验。
- 两者的播放控件外观相同，所有 Mac Catalyst 应用程序都会自动获得这种新行为。
- 和在之前原生 macOS 全屏体验一样，用户可以滑动回应用程序窗口
- 系统会自动在原有视频的位置上显示占位符———与在画中画中播放视频显示的占位符类似

>在 macOS Monterey 中，用户在任何时候都可以通过按下窗口左上角的绿色全屏按钮来获得真正的全屏播放体验

*比如，在用户先操作了一些内容后又将操作窗口全屏显示，视图控制器也将继续保持全屏显示*

开发者可以根据体验的需要，设计全屏生命周期以提供更好的用户体验。

我们看个例子：
1. 正如刚刚展示的那样，用户能够先全屏拍摄视频，然后在需要回放时滑回应用程序
2. 用户可以自由地在app内导航，即使播放器的viewController从视图层次结构中删除也不要紧
  - 需要时，用户能够直接滑动或使用 Mission Control 导航回全屏视频

我们看看具体实现：
开负责要确保 playerViewController 保持存活——即使它不在视图栈中

**否则，当用户离开带有视频的页面时，全屏播放将随着 playerViewController 的释放而结束**

要做的就是在收到 willBeginFullScreenPresentation 回调时保持好对 playerViewController 的强引用，如图所示：

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/55c80aa1a5ecb0b269fc3903545f6062.png" width=600 />


一旦用户退出全屏，app将收到 willEndFullScreenPresentation 回调：
用户有可能已从对应的导航栈离开，此处要释放保活状态中 playerViewController，否则就发生了内存泄露（而且会比较严重）

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/1ad31929944a0deaeed1c56dda3f0406.png" width=600 />


>上述机制同样适用于原生 macOS

可以使用新的 playerViewDelegate 使 playerView 保持活动状态，直到app收到 playerViewWillExitFullScreen 回调：

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/fb094111b5d49960c60a893626979a28.png" width=600 />

当用户退出全屏时，app还将收到此 restoreUserInterface 回调：

<br /><img src="https://images.xiaozhuanlan.com/photo/2021/579ed0698083b3ee8b2b40a3adfefb9a.png" width=600 />

*这对app来说是导航回包含视频页面的机会，与用户停止画中画时收到的回调类似*

需要尽快从这个 completionHandler 返回，否则会block从全屏到App内嵌视频播放的转换（或者至少让用户看起来不够流畅）

**返回 false 表示恢复失败或不可能，此时内容会在没有动画的情况下直接从全屏退出**

# 总结

本Session的主要内容有：
- 通过新的API，使用 AVPlayerLayer或AVSampleBufferDisplayLayer， 来给app添加画中画
- 介绍了macOS 和 Mac Catalyst中增强的全屏体验，以及具体的代码实现

The End！




