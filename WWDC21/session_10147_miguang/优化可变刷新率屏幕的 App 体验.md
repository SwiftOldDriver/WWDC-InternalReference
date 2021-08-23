# 优化可变刷新率屏幕的 App 体验 
> 作者：米广，有赞 iOS 开发，喜欢折腾，微信订阅号：剁手指北;微信 meeleo

> 审核：


![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297199190715.jpg)


###前言
`WWDC21` 中发布的 `macOS  Monterey` 中新增了可变刷新率的 `Adaptive-Sync` 显示技术；今天我们就围绕苹果生态中的可变帧率显示技术，来讨论如何在可变帧率的情况下为用户带来最佳体验；   
首先我们会介绍一下  `macOS`  中的 `Adaptive-Sync` 技术；这项技术为 `macOS` 的全屏显示的 App 和游戏提供了更加顺滑的帧率；
然后我们会深入现有的 `iPad Pro` 上的 `ProMotion`技术，来探讨能在不同帧率下基于 `CADisplayLink` 的最佳技术实践，为用户带来流畅的自定义绘图体验；
本篇文章是基于 [Session 10147 - Symbolication: Beyond the basics](https://developer.apple.com/videos/play/wwdc2021/10147/) 撰写，Session 的演讲者是来自 `Apple GPU` 软件团队的 `WindowServer` 工程师  `Kyle Sanner` 和 `CoreAnimation` 工程师 `Alex Li`；
### 基于  `macOS`  平台中的 `Adaptive-Sync` 为用户提供顺滑体验
#### `Adaptive-Sync` 技术简介
`Adaptive-Sync` 是由美国的非营利性标准制定组织 `VESA` 提出的基于 `DisplayPort`接口的可变帧率显示技术，目的是为了解决画面撕裂和卡顿掉帧的问题；我们平时常用的 `DisplayPort` 接口就是 `VESA` 制定的标准接口；该组织不同于索尼等盈利性与专利保护的商业标准指定组织， `DisplayPort` 相较于索尼的 `HDMI` 是一种免费而开源的技术，而 `HDMI` 受专利保护且是盈利性收费性视频传输界面；`Adaptive-Sync` 类似于现行 `AMD`的 `Free-Sync` 和 `NVIDIA` 的 `G-Sync` 的动态帧率技术，但该技术免费且开放；因此在不同品牌的显示器和不同品牌的显卡中，只要都支持 `Adaptive-Sync`，那就支持动态帧率技术，不受制于 `AMD` 显卡必须买 `AMD` 认证支持的 `Free-Sync` 显示器等问题；免费开源技术将利于市场广泛推广应用可变帧速率；苹果已经明确在 `macOS`中将提供基于 `Adaptive-Sync`的可变帧率显示技术支持；
![Adaptive Sync ON](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/adaptive-sync-on.png)
#### 首先，我们来快速回顾一下 `Apple` 平台中的几种屏幕类型；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297051228247.jpg)

`Apple` 生态中的大部分显示器都是固定帧率的，也就是屏幕只要被点亮，就会以每秒固定的刷新频率进行显示；唯一的例外是 `iPad  Pro` 的 `Promotion` 和最近发布的 `Mac` 中的 `Adaptive-Sync`；首先，我们来了解一下 `Mac` 中的`Adaptive-Sync` 新技术；
#### 固定与可变帧率的区别
在讲解可变帧率的屏幕刷新技术前，我们先回顾一下固定帧率的显示技术；如下图所示，在 60Hz 的显示器中，帧与帧间的刷新间隔是固定的 16 毫秒；如果在帧缓存里准备好了新的一帧，新的一帧就会被呈现出来；如果没有准备好新的帧，那么前一帧就会被继续显示；当固定帧率提高到 120Hz 时，我们提高了一倍帧刷新率，这导致每一帧的准备时间缩小了一倍到 8 毫秒；但固定帧率的显示是相似的，只是刷新速度的快慢有区别；

![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296995810056.jpg)

#### `Adaptive-Sync` 可变帧率带来的变化和优势
在 `Adaptive-Sync` 显示中，每一帧都有一个可变的时间窗口，这个时间窗口替代了原有的固定的阵刷新时间间隔；这个间隔取决于具体链接的显示器；下面以可变帧率 40-120Hz 为例，这意味着每一帧可以在屏幕中展示 8-25 毫秒；但需注意，一旦一个帧的展示时间超过了最大的 25  毫秒的极值，系统就会强制刷新帧，刷新期间会有短暂的不可用时间；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296996699083.jpg)

我们对比一下，就可以发现可变帧率带来的好处；在 120Hz 固定帧率的屏幕中，如果 App 能够在 8 毫秒内完成帧绘制，这将给用户带来一个顺滑的 120Hz 体验，但假设由于场景复杂度提升，某些帧的绘制时间超过了 8 毫秒，需要 9 毫秒才能在帧缓存中准备完毕，这会导致前一帧显示 16 毫秒（重新被展示一次），而不是 8 毫秒；这种 16 毫秒的帧会导致呈现给用户的显示会有明显可察觉的卡顿；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296997166798.jpg)

在可变帧率的显示器中，你可以设置帧在绘制完成后立刻呈现至屏幕，因此如果当前帧的绘制用时为 9 毫秒，那么在绘制完成时就会被显示，这其中1毫秒的延迟，不会导致易察觉的卡顿；在这种模式下，针对复杂帧的绘制，如果无法达到可变帧率的最大速率，可以通过拆分绘制任务适当增加帧绘制时间，来提供一个平滑、均匀的帧绘制。

![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296997370808.jpg)

#### 基于真实场景的 `Adaptive-Sync` 的最佳实践
##### 需要可变帧率的场景
设想这种情况：一个可能运行复杂场景的游戏，基本可以稳定在 90Hz 的刷新速率，但特定复杂场景会导致帧速率下降至 66Hz；通过实时监测 `GPU` 的工作复合，开发者可以有意在复杂场景中降低画面质量或适当增加帧绘制时间，直至画面场景复杂度恢复至平均水平；如此操作，可以为用户提供一种较为顺滑的帧呈现；

基于此，我们可以聊聊固定帧率和动态帧率的最佳实践的不同；
在固定帧率的机制中，如果帧绘制时间超过现有显示器帧率的固定时间时，我们会建议将所有帧绘制的时间都延长，也就是使用更低的阵刷新速率，以使所有帧绘制都能够在刷新间隔中在 `GPU`上完成；

![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296997536455.jpg)


而在可变刷新帧率机制中，我们会建议 App 在任何情况下都应该尽力提供更高的帧刷新速率，`App` 需要平衡 `GPU` 负载和刷新率之间的平衡，最大的帧渲染时长不能超过最低动态帧率的间隔，否则会导致剧烈可察觉的卡顿。

![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296997701573.jpg)
##### 启用 `Adaptive-Sync`
基于此，我相信您已经对可变帧率有了进一步的理解；我们来谈谈如何在游戏中启用 `Adaptive-Sync` 可变帧刷新率技术；
首先需要软硬件的支持，包括 `M1` 架构的 `Mac` 和近年来部分 `Intel` 架构的 `Mac`；其次需要 `Adaptive-Sync` 支持的显示器，并开启 `Adaptive-Sync` 功能；其次游戏和 `App` 必须以全屏方式运行；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296997887253.jpg)

接下来我们深入至 `API` 来进一步了解 `Adaptive-Sync`
首先你需要获取当前环境是否支持可变刷新帧率，对此你可以通过 `NSScreen` 的新属性来判断；在支持可变刷新帧率的环境中，这两个值会反应最大和最小帧率所对应的刷新时间间隔；而在不支持可变帧率的环境中，这两个值会是相等的数值；同时需要判断当前 App 是否在全屏模式中运行；最后通过上述两个条件，确保 `Adaptive-Sync` 已经正常开启；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296998216673.jpg)
##### 在绘制中控制帧步调
调整 `Metal` 呈现技术，以在自适应同步显示器上流畅显示。您可以直接使用我们的 `MetalDrawable` 相关 `API` ，这些 `API` 已经内置了帧步调技术，例如 `presentAfterMinimumDuration` 或者 `presentAtTime`；当然您也可以基于 `present now` 逻辑自己实现呈现逻辑和自定义计时器管理；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296998913697.jpg)

我们来结合一个简单的例子来看看与之前固定帧率相比，我们需要做出哪些调整；
在这个例子中，我们会获取一个 `Drawable` 实例，设置好 `GPU` 的工作，完成后呈现在屏幕上；我们需要依赖于 `GPU` 完成接下来 `Drawable` 渲染工作的压力来设置帧速率。在固定帧率显示器上，我们很容易知道这不是最好的实践逻辑，因为我们无法保证 `GPU` 的渲染频率与显示器帧速率保持一致；但基于 `Adaptive-Sync` 显示器和动态帧步调，同样是之前这个场景，我们可以在 `Instruments` 中观察到个别帧消耗时间有所增加，这似乎没有问题；但这个例子中的问题是，周期性发生的，单个帧渲染所需时间过长，会形成用户可见的卡顿；红色部分所示
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296999304457.jpg)

首先让我们尝试以较大的固定平均的渲染速率来解决这个问题；当然在用户可以自定义帧率的情形中，也可以使用该方法；我们尝试固定帧率为 78Hz，并将该间隔值传入 `afterMinimumDuration` 中
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296999506199.jpg)

实际效果我们将得到一个帧率低但渲染均匀顺滑的效果，同时整个 `App` 更少的 `CPU` 和 `GPU` 资源消耗；这种方法可以解决用户遇到的卡顿，但实际会导致整个App的体验降低（由于整体的帧率下降）
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296999642698.jpg)
##### 基于 `GPU` 负荷动态平滑实际绘制帧率
而在`Adaptive-Sync` 显示器中，我们可以尝试通过 `GPU` 负载（前述帧渲染所需时间）动态计算，而非直接赋予固定值的方式来设定帧速率；具体算法如下图所示，我们通过计算前述帧的滚动平均值，来动态计算下一帧所用时间，结合 `Adaptive-Sync` ，动态赋予下一帧所需预估的时间；这里的初始值设为最高帧速率的所用时间；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16296999942552.jpg)

最终我们可以充分利用 `GPU` 资源为用户呈现尽可能高帧率的画面；且在不同性能设备，不同的 `GPU` 负载下，都无需进行额外的代码更改；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297001492796.jpg)

综上，我们了解了几个新 `API` 让我们能够利用 `Adaptive-Sync` 技术为用户提供更顺滑的渲染体验；
接下来让我们继续了解一下 `iPad` 中的可变刷新率技术

### 基于 iPad Pro 平台中的 ProMotion 技术为用户提供顺滑呈现
#### ProMotion 可变帧率技术简介
接下来我们来了解 `iPad Pro` 中的 `ProMotion` 可变帧率技术；`ProMotion` 自 `iPad Pro 2017` 年发布以来，可以最高提供 120Hz 的刷新率。但在接下来发布的 `iPad OS15` 中，省电模式会将 `ProMotion` 刷新率降低至 60Hz ，也就是 120Hz 的刷新率并不总是可用；您应当适当的协调帧步调以在 `ProMotion` 因种种原因而帧率下降时，仍为用户提供正确流畅的渲染内容；
接下来我们将讨论 
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297039134714.jpg)

 正如之前提到的 60Hz 的显示器 16 毫秒刷新一次，保持固定的刷新节奏，当屏幕限制 30Hz、20Hz 的内容是，显示器本身仍旧保持 60Hz 的刷新率，因此相同帧会被重复展示，这种不可察觉的刷新操作会影响电池使用时长；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297039574339.jpg)


而在 ProMotion 技术显示器上，帧刷新速率最高为 120Hz ，最低为 24Hz ，ProMotion在不同刷新频率下，不会重复刷新之前帧，而是根据当下的帧速率动态刷新帧，因此刷新间隔从 8毫秒到 41 毫秒不等；动态的帧率刷新可以节约电池使用时长；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297039633331.jpg)

#### `ProMotion` `120Hz` 的可用性限制
`ProMotion`  的 120Hz 并不总是可用帧速率，用户可以在辅助功能设置中打开限制帧速率动态变换，将最大帧率限制至 60Hz；当设备负载过大，出现过热情况时，系统会限制 120Hz 的可用性；在 `iPadOS 15` 中，低电量模式会强制限制 `ProMotion` 最大帧率为 60Hz。对于上述情况，绝大多数 `App` 都无需特别适配。但如果您的 `App` 执行逐帧的自定义绘制，那么您需要处理上述帧速率限制事件；
#### ProMotion 绘制的最佳实践
##### CADisplayLink 与动态帧率
首先 `DisplayLink` 有基于 `CoreAnimation` 的 `CADisplayLink` 和基于`CoreVideo` 的 `CVDisplayLink` ，前者在除  `macOS`  之外的系统中可用，后者在  `macOS` 中可用；因为 `iPad` 中的 `ProMotion` 基于 `iPadOS`，因而这里我们只讨论 `CADisplayLink` ；
`DisplayLink` 的 `vsync callback` 事件可以理解为与屏幕帧刷新速率稳定同步的一个计时器回调；在设备的帧速率发生变化时，与 `CADisplayLink` 的时序回调保持一致的帧渲染步调，是保证 App 顺滑体验的关键；虽然这是一个计时器，但我们不能自己新建计时器来实现此逻辑，因为自己新建的 `NSTimer` 的步调不可能和可能变化的帧速率同步；
通过给 `CADisplayLink` 的 `preferredFramesPerSecond` 赋值，可以调节 `vsync` 的回调间隔贴近于你所期望的值；也可以通过 `timestamp` 和 `targetTimestamp` 来获取上一帧和下一帧的渲染时长等上下文信息，必要时可以像前述提到的 `Adaptive-Sync` 的动态帧率计算逻辑，来实现一个基于当前环境的最大帧率；
##### 绘制步调的最佳实践
在这里我们并不直接讨论如何实现自定义动画和渲染循环，但我们提供 4 个最佳实践，帮助您自定义绘图步调尽量与 vsync 回调的时间保持一致，以及避免一些常犯的错误；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297040132489.jpg)

##### 1、获取当前硬件帧速率等信息
你可以从 `UIScreen` 获取硬件支持最大帧速率，在 `ProMotion` 显示器中，这个值永远为 120Hz，即使有前述的降低帧率的事件发生，这里仍然为 120Hz ；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297040293142.jpg)

##### 2、获取 `CADisplayLink` 的实际帧速率；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297040757260.jpg)

![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297041440505.jpg)

![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297041671638.jpg)


##### 3、 使用 `targetTimestamp` 来规划绘图所用时间
下面的例子中， 当 `CADisplayLink` 的实际帧速率发生变化时， `targetTimeStamp` 相较于 `timestamp` 属性与实际变化更同步，基于此步调渲染和提交显示的帧，更为顺滑，而不会有明显可感知的卡顿；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297042068247.jpg)

![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297042721501.jpg)


因此，在 `ProMotion` 中，尽量使用 `targetTimestamp` 而不是 `timestamp` 来规划帧绘制时间和提交节奏；在实际使用中，你可以使用 `targetTimestamp` 直接替换之前所有的 `timestamp` ；就是这么简单
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297043080592.jpg)

##### 4、动态计算合适的帧速率
`targetTimestamp` 与 `timestamp` 之间的差值反映了预估的 `vsync callback` 之间的时间，但实际时间可能有所差异；比如 `CPU` 和 `GPU` 被其他高优先级任务所调度，或是 `runloop` 在忙于一些其他事，这些情况下，`vsync callback` 回调可能被完全略过（回调丢失）；因此保持正确的自定义绘图步调是提供顺滑用户体验的关键；

**下面的例子包含了 `CADisplayLink` 回调延时与回调跳过两种情况**

现在假设这一帧的绘制工作花了太长时间，下一次回调且需等待 `runloop` 释放，因为这次回调被延迟了，那下一次回调将被直接跳过；这种情况下，如果计划提前开始绘制下一帧时，需要注意这里的可用时间是 16毫秒，而非正常的 8 毫秒；为了追踪到这个时间差，可以记录上一次 `targetTimestamp` 与本次 `targetTimestamp` 来准确获得这个时间；
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297044102692.jpg)


因此基于 `targetTimestamp` 和 `timestamp` 差值来判断当前是否回调被跳过，进而提前渲染之后帧的操作，会导致每次回调被丢失时，你自定义提前绘图也减慢了一帧；
而追踪 `targetTimestamp` 和 上一次 `targetTimestamp` 之间的差值，来保证获取正确的剩余时间，进而可以在回调被跳过时，正确提前绘制下一帧；
当然如果你的绘制任务很大，建议基于 `targetTimestamp` 提供的值来动态调整绘制工作量，以达成这里的绘制时间要求
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297044505020.jpg)


##### 总结上述 `ProMotion` 最佳实践
![](https://wwdc21.oss-cn-hangzhou.aliyuncs.com/2021/08/23/16297044888987.jpg)

回顾本 `Session` ，我们先讨论了 `macOS`  中的 `Adaptive-Sync` 动态帧速率技术，以及如何基于此技术为用户提供更加顺滑的渲染效果体验；之后，我们讨论了如何在 `iPad Pro` 设备中基于 `ProMotion` 的 `CADisplayLink` 最佳实践；随着显示技术的不断发展，我们希望本 `Session` 为您在日益动态的显示时序技术应用中提供一些帮助 ；
在此向您推荐  [WWDC17 - Introducing Metal 2](https://developer.apple.com/videos/play/wwdc2017/601/) 和 [WWDC19 - Delivering Optimized Metal Apps And Games](https://developer.apple.com/videos/play/wwdc2019/606/)