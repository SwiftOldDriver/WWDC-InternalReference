What's new in AVKit


>本篇来源为WWDC2021 中 [What’s new in AVKit](https://developer.apple.com/videos/play/wwdc2021/10290/) 

今天，我们来谈谈我们对画中画（或简称PiP）以及 macOS 上的全屏体验所做的一些改进。

# Picture in picture (PiP)
使用画中画，用户可以在使用设备进行多任务处理的同时继续欣赏他们的视频内容。

*例如，如果我们正在全屏观看视频并收到一条消息，可以在保持继续观看的同时回复该消息；视频会自动进入画中画，回复完毕后即可快速恢复全屏播放。*
![](https://images.xiaozhuanlan.com/photo/2021/71aed66878239173515a80d0edf0db03.png)



这带来了真正无缝的观看体验，在观看视频时用户会期望这种行为。

有关如何将 PiP 集成到我们自己的应用程序中，可以观看 2019 年关于AVKit的Session：[Delivering Intuitive Media Playback with AVKit](https://developer.apple.com/videos/play/wwdc2019/503/)


今年新增了内联播放的能力，我们可以选择在用户滑动回主屏幕时自动进入画中画。
![](https://images.xiaozhuanlan.com/photo/2021/81eb76b69826ec2d8dcc55b023bca781.png)

此行为可以通过设置属性canStartPictureInPictureAutomaticallyFromInline  = true来实现：
![](https://images.xiaozhuanlan.com/photo/2021/946cb28507807021073129a673dc5666.png)

*AVPlayerViewController和AVPictureInPictureController都拥有此属性，分别适用于默认控件和自定义UI；需要确保只有在当前播放内容是用户的主要焦点时才将此标志设置为 true。*


- 如果使用 AVPlayerViewController 来呈现视频内容，PiP请求会自动处理
- 如果不使用 AVPlayerViewController，我们仍然可以使用 AVPictureInPictureController 为应用程序带来原生画中画体验

首先，要能够播放，我们需要先配置应用程序AudioSession的对应Category——再启用画中画后台模式；然后创建一个pictureInPictureController，并传入一个playerLayer 的引用：
![](https://images.xiaozhuanlan.com/photo/2021/9f4e55a79e8d51b79757b6390bc2c737.png)

当用户尝试使用您提供的按钮切换画中画时，我们需要在控制器对象上调用启动或停止画中画
![](https://images.xiaozhuanlan.com/photo/2021/f8c48bf23ec3302cdf3c760c3e362d44.png)

上面介绍的画中画体验是使用 AVPlayer 来构建的；而今天，我很高兴地宣布iOS 15对 AVSampleBufferDisplayLayer 提供相同级别的支持！
![](https://images.xiaozhuanlan.com/photo/2021/cd25c7cb24b63caeb9e0a738c5324c77.png)

首先创建一个 ContentSource——可以使用 AVPlayerLayer 或上面代码的AVSampleBufferDisplayLayer 来设置

对于用户来说，画中画体验将是相同的

当我们这样使用时，需要关注使用AVSampleBufferDisplayLayer 时的新职责 —— 先看看这个播放委托：

我们依赖新的 AVPictureInPictureSampleBufferPlaybackDelegate 提供的播放状态信息，来正确呈现画中画 UI（因为媒体播放不是由 AVPlayer 管理的）。
![](https://images.xiaozhuanlan.com/photo/2021/da10a40b9111862c6921d989d9ab88ec.png)

当用户尝试从画中画 UI 控制媒体时，系统会将这些命令转发给委托进行处理，我们看看这五个回调：
- 当用户按下画中画窗口中的播放/暂停按钮时，将调用 setPlaying 函数。
- 当用户按下跳过按钮之一时，会调用 skipByInterval 函数。
![](https://images.xiaozhuanlan.com/photo/2021/61f89ed59f6816e125279f079ad82ba3.png)

使用这些回调来相应地控制媒体播放：
![](https://images.xiaozhuanlan.com/photo/2021/b6fe62219ec62b01415f12b98dab0b86.png)
- timeRangeForPlayback 函数允许您指定当前可播放的时间范围。
  - 允许我们渲染时间线并显示播放头当前的位置
  - 用有限持续时间的范围来表示当前媒体的总时间
  - 用无限持续时间表示实时内容

- didTransitionToRenderSize 函数在画中画窗口更改大小时调用（例如在双指缩放时）
![](https://images.xiaozhuanlan.com/photo/2021/28318bb07a54a016103ab8552618135e.png)
![](https://images.xiaozhuanlan.com/photo/2021/aace82c5cda86b4ec0da9526721d4b38.png)


> 在选择媒体时应该考虑渲染大小，以避免不必要的解码开销


![](https://images.xiaozhuanlan.com/photo/2021/aa95ecc8d249745bac0135ed35071bd6.png)
- 当播放状态被暂停或恢复时isPlaybackPaused 函数会被回调
  - 在概念上等同于 AVPlayer 上的 timeControlStatus


接下来，让我们来看看iOS 15对 macOS 上的全屏体验做的一些改进。

# Mac全屏播放体验
在 Big Sur 中，当您在 Mac Catalyst 应用程序中全屏拍摄视频时，视频将填满整个窗口，但不会填满整个屏幕。
![](https://images.xiaozhuanlan.com/photo/2021/30455684fa0b628e1d89c41aa810aaec.png)


而在 macOS Monterey 中，视频将占据整个屏幕：
![](https://images.xiaozhuanlan.com/photo/2021/74c64f8b7ca703f28c2034661b34dde7.gif)

- 原生 macOS 和 Mac Catalyst 应用程序都会获得真正的全屏体验。
- 两者的播放控件外观相同，所有 Mac Catalyst 应用程序都会自动获得这种新行为。
- 和在之前原生 macOS 全屏体验一样，用户可以滑动回应用程序窗口
- 将显示占位符而不是原始视频，表示内容正在全屏播放———与在画中画中播放视频显示的占位符比较相似

>在 macOS Monterey 中，用户可以通过按下窗口左上角的绿色全屏按钮来获得真正的全屏播放体验

*比如，在用户先操作了一些内容后又将操作窗口全屏显示的场景中，视图控制器也将继续保持全屏显示*

可以根据用户体验的需要，设计全屏生命周期以提供更好的用户体验。

看一个例子：
1. 正如我们已经展示的那样，用户能够先全屏拍摄视频，然后在需要继续播放时滑回应用程序
2. 用户可以自由地在app内导航，即使会导致播放器的viewController从视图层次结构中删除
  - 但在需要的时候，用户能够直接滑动或使用 Mission Control 导航回全屏视频

现在，我们来看看这是如何做到的：
我们要负责 playerViewController 的生命周期：
为了获得最佳体验，您需要确保 playerViewController 保持存活——即使它不在视图栈中

**否则，当用户离开带有视频的页面时，全屏播放将随着 playerViewController 的释放而结束**

我们需要做的就是在收到 willBeginFullScreenPresentation 回调时保持对 playerViewController 的强引用
![](https://images.xiaozhuanlan.com/photo/2021/55c80aa1a5ecb0b269fc3903545f6062.png)


一旦用户退出全屏，app将收到 willEndFullScreenPresentation 回调：
假设用户已从其呈现的原始视图中导航离开，这里应该释放保活状态中 playerViewController
![](https://images.xiaozhuanlan.com/photo/2021/1ad31929944a0deaeed1c56dda3f0406.png)


>上述机制同样适用于原生 macOS

我们可以使用新的 playerViewDelegate 使 playerView 保持活动状态，直到我们收到 playerViewWillExitFullScreen 回调：
![](https://images.xiaozhuanlan.com/photo/2021/fb094111b5d49960c60a893626979a28.png)

当用户退出全屏时，app还将收到此 restoreUserInterface 回调：
![](https://images.xiaozhuanlan.com/photo/2021/579ed0698083b3ee8b2b40a3adfefb9a.png)

*这是app导航回包含视频页面的机会，这与用户停止画中画时收到的现有回调非常相似*

确保尽快从这个 completionHandler 返回，以免阻止从全屏到内联的转换

**返回 false 表示恢复失败或不可能，在这种情况下，内容会在没有动画的情况下全屏退出**

# 总结


本Session中我们看到了：
- 通过新的API，使用 AVSampleBufferDisplayLayer（而不是 AVPlayerLayer ）， 给app添加画中画
- macOS 和 Mac Catalyst中增强的全屏体验，并介绍了无缝集成代码的步骤


感谢你看到这里，我是 Marty Pye，AVKit 团队的工程师：
![](https://images.xiaozhuanlan.com/photo/2021/1601ca229fbfb0eb93129feb9efcd951.png)




