# WWDC21 10079 - 使用 PHASE 探索几何感知的音频

> 作者：Jimbaby，iOS 开发者，目前就职于字节跳动音乐团队
>
> 审核：曾铭，iOS 开发，老司机技术周报编辑，就职于字节跳动音乐部门

[TOC]

![10079-00-background](https://images.xiaozhuanlan.com/photo/2021/73aa2bdb59447250677af0bb1bbf4754.png)

> 本文章基于 WWDC21 Session 10079 - [Discover geometry-aware audio with the Physical Audio Spatialization Engine (PHASE)](https://developer.apple.com/videos/play/wwdc2021/10079/) 梳理



## 引言

众所周知，无论是在普通应用还是游戏应用中，音频都扮演着重要的角色。今年 Core Audio 团队带来了一个新的音频框架 PHASE（Physical Audio Spatialization Engine），给开发者一个可以创造音频 3D 空间的能力，探索「几何感知」的音频体验。该 Session 主要包括四个方面的内容，分别为：`Motivation`、`Features`、`Concepts`、`Sample use cases`，讲述了 PHASE 的初衷、主要能力、重要的概念和部分示例。

![10079-02-contents](https://images.xiaozhuanlan.com/photo/2021/57571ba5907c632a3138fd6a9c733e0f.png)

读完本文，你将了解到「几何感知」的音频体验是怎么样的，PHASE 是如何提供「几何感知」能力的，以及如何运用它来构建「几何感知」的音频体验。



## Motivation

![10079-01-audio-post-production](https://images.xiaozhuanlan.com/photo/2021/4f1170442cc5b7b76cb564f4e80ea483.png)

在当今的游戏中，游戏引擎的各种子系统，如物理、动画、视觉效果等，都是根据玩家的行为而发生变化，推动游戏情节向前发展。

然而，音频子系统通常与其余部分是分开管理和驱动的。**音频资源通常是后期制作、预先处理、手动调整的**，随着视觉效果的变化，音频相关资源需要再生，这会导致**音频体验落后于游戏的视觉方面**。于是 Apple 团队带来新的音频框架 PHASE，用 PHASE 探索「几何感知」的音频体验，解决音频资源后期制作的痛点。



## Features

PHASE 主要给开发者带来了 「几何感知（Geometry-aware）」 和 「事件驱动的音频播放（Event-based interactive playback）」 两大能力，这两大能力的结合可以很好地解决上述问题。



### 几何感知

在介绍 「几何感知」 之前，让我们来回顾下传统的游戏音频工作流程：

![10079-04-common-game-audio-workflow](https://images.xiaozhuanlan.com/photo/2021/ce1d3d668a251bd5fac6f86d0d5c47af.png)

这是个室外场景的例子，有一个听众，一个声源（小溪流动），一个遮挡物（谷仓）。遮挡物是场景中的物体，可以抑制声音源和听者之间的声音。通常，我们将在小溪区域**放置多个点声源**，随着听者的移动，必须使用各种技术确定点声源之间适当的过滤和混合比，并手动混合它们以提供良好的音频体验。在通常的游戏开发过程中，如果视觉场景发生变化，例如示例场景中的谷仓，你**必须手动调整音频来匹配视觉场景变化**。

想象一下，你可以构建应用程序，其中声音源不是你需要根据场景管理和混合的点声源，而是音频系统自动为你管理的区域或体积声源上发出的声音，PHASE 就有这样的能力。

![10079-05-geometry-intergration-and-volumetric-sounds](https://images.xiaozhuanlan.com/photo/2021/e2360466a0f950011130cbe028c738e8.png)

PHASE 引入了**体积声源**的概念，**声音源可以是几何形状的物体，遮挡物也可以是几何形状的物体**，并且可以设置遮挡物的声学材料属性。PHASE 还允许你**为声音源设置距离模型和方向模型**。你还可以从预设库中选择 [早期反射](https://www.sweetwater.com/insync/early-reflections/) 和后期 [混响](https://baike.baidu.com/item/%E6%B7%B7%E5%93%8D/480460) 等属性模拟声音碰到遮挡物时的效果。一旦你告诉框架各种声源、遮挡物和听者在哪里，PHASE 将帮助你完成繁重的工作，并为你模拟场景中各种声源的遮挡和传播效果。这样你的应用程序的音频系统就是「几何感知」的，它可以很快地适应视觉场景的变化。

> 1. [距离模型延伸阅读](https://www.52vr.com//extDoc/ue4/CHN/Engine/Audio/DistanceModelAttenuation/index.html)
> 2. [早期反射](https://www.sweetwater.com/insync/early-reflections/)：被墙壁、天花板等遮挡物反射一两次后到达听众的声音。
> 3. [混响](https://baike.baidu.com/item/%E6%B7%B7%E5%93%8D/480460)：当声源停止发声后，声波在室内要经过多次反射和吸收，最后才消失，我们就感觉到声源停止发声后还有若干个声波混合持续一段时间。



### 事件驱动的音频播放

![10079-06-sound-events](https://images.xiaozhuanlan.com/photo/2021/53728ec517e561889af718eb2dbf7728.png)

除了「几何感知」之外，PHASE 还提供了一个「基于事件的交互式播放系统」。`声音事件（Sound Event）` 是描述音频播放事件的基本单元，它封装了音频资源的 `切换（Switch）`、`混合（Blend）` 和 `播放（Playback）`。`声音事件` 的范围可以从简单的事件，如单次播放、循环播放，到复杂的事件序列组织成一棵树，每个父节点事件可以 `混合` 或 `切换` 播放事件的子节点事件。

![10079-07-sound-events-tree-for-footstep-example](https://images.xiaozhuanlan.com/photo/2021/a18ce54f9d06e603c81b3429549b37c2.png)

让我们举一个简单的脚步声的例子。这里我们有一个 `随机节点（Random Node）`，它将在砾石上的三个不同的脚步声中进行随机选择一个。同时我们有另一个 `随机节点` 为布沙沙作响，这两个事件树都可以嫁接到另一棵树 `Near` 上，以播放布沙沙声和脚步声的混合。我们可以有另一棵树 `Far`，当角色在远处时，播放一组不同的脚步声。`Near` 和 `Far` 的混合现在可以根据游戏的距离来控制。这样我们就可以模拟一个角色走路的场景，「每迈出一步，都可以听到近距离走在砾石上的脚步声和布沙沙作响的混合，同时随着与远方的距离变化，我们会或多或少地听到远方一个踩在砾石上的脚步声」。

另外，如果有需要的话，我们还可以添加更多的声音事件树，如雪地或草地上的脚步，并构建一个复杂的播放事件序列，该序列**可以由用户交互、物理和动画等子系统触发**。这样音频系统就可以和游戏其他子系统一样，根据玩家的行为驱动游戏的情节自然发展了。



### 渲染系统

![10079-08-rendering-system](https://images.xiaozhuanlan.com/photo/2021/ea04b7ae65fc76d62743f2fcd10b5b79.png)

PHASE 强大的「几何感知」能力，背后当然少不了「渲染系统」的支撑，它支持多种音频混合模式，这里简单介绍下几种模式的区别，详见 「Concepts -> Mixers」 部分。

1. 简单的 `通道混合（Channel Mixer）`，播放普通的音频文件就可以用这种混合，比如播放立体声，见上图左。
2. 具有方向和距离概念的 `空间混合（Spatial Mixer）`，这种混合既有环绕声效果，又具有真实音频空间的模拟能力，见上图中。正是这种混合，PHASE 才名副其实地拥有了「几何感知」的能力。
3. 介于前两者之间的 `环境混合（Ambient Mixer）`，这种混合和 `空间混合` 一样有环绕声的效果，但是少了距离建模等「几何感知」的能力，见上图右。

另外，这些渲染能力已经支持 iOS、macOS 设备和 Air Pods 系列耳机，这样你的应用程序在支持的设备上就可以提供一致的空间音频体验了。介绍完 PHASE 主要的功能，下面让我们来看看 PHASE API 的几个主要概念。



## Concepts

![10079-09-three-main-concerpts](https://images.xiaozhuanlan.com/photo/2021/463c24fcbae1b201e282a76ded5d7d5d.png)

PHASE API 可以分为三个主要概念：

1. `引擎（Engine）`：管理声音资源。
2. `节点（Nodes）`：控制播放逻辑。
3. `混音器（Mixers）`：控制空间化能力。



### Engine

![10079-10-engine-breakdown-three-sections](https://images.xiaozhuanlan.com/photo/2021/01fe3d3ffd8919dce006f57b8e2a6285.png)

`引擎（Engine）` 分为三个主要部分：

1. `资源注册（Asset Registry）`：支持注册 `声音资源（Sound Asset）` 和 `声音事件资源（Sound Event Asset）`。
2. `场景图（Scene Graph）`：参与模拟的对象的层次结构，用于模拟真实的音频场景。
3. `渲染状态（Rendering State）`：管理音频 IO 和播放声音事件。



#### Asset Registry

![10079-11-asset-registry](https://images.xiaozhuanlan.com/photo/2021/40baca8170ffd8d3a28eff9f6127e82e.png)

在整个引擎的生命周期中，您将向其注册和注销资源。PHASE 支持注册 `声音资源（Sound Asset）` 和 `声音事件资源（Sound Event Asset）`。`声音资源` 可以直接从音频文件加载，也可以从原音频数据加载到引擎中。`声音事件资源` 是一个或多个的 `声音事件节点` 组成的树状结构，`声音事件节点` 可以连接 `音频资源` 和 `混音器` 并控制声音播放，`混音器` 控制空间化，下面 「Concepts -> Nodes」 和 「Concepts -> Mixers」 部分会分别详细介绍 `声音事件节点` 和 `混音器` 的概念。



#### Scene Graph

![10079-12-scene-graph](https://images.xiaozhuanlan.com/photo/2021/40651f3df6bd699d20ca5ac624ce0275.png)

`场景图（Scene Graph）` 是参与模拟的对象的层次结构，包括 `听者（Listener）`、`声音源（Sound）` 和 `遮挡物（Occluder）`。`听者` 表示听到声音的对象。`声音源` 表示声音起源的对象，PHASE 同时支持点声源和体积声源。`遮挡物` 是影响声音传输的几何形状物体，可以给它定义吸收和传输声音的材料，PHASE 带有一个材料预设库，用来模拟从纸板箱到玻璃窗，再到砖墙的一切。当你将这些对象添加到场景时，需要把它们组织成一个层次结构，并将它们直接或间接附加到引擎的根对象。



#### Rendering State

![10079-13-rendering-state](https://images.xiaozhuanlan.com/photo/2021/bcfec41ba390f61d8beb68e2b7df1340.png)

`渲染状态（Rendering State）` 管理音频 IO 和播放声音事件。首次创建引擎时，将禁用音频 IO，这允许你注册资源、构建场景图、构建声音事件和执行其他引擎操作，所有这些都无需运行音频输入输出。一旦你准备好播放声音事件，你就可以启动引擎，它将在内部启动音频 IO。同样，当你播放完声音事件后，你可以停止引擎，这将停止音频 IO 并停止任何播放声音事件。



### Nodes

![10079-14-node-categories](https://images.xiaozhuanlan.com/photo/2021/0e4d26527bda3e95b15a25581f059085.png)

引擎中的 `节点（Nodes）` 控制音频内容的播放，`节点` 是生成或控制音频播放的对象的分层集合。主要分为两种节点：

1. `生成器节点（Generator Nodes）`：产生音频，它们总是层次结构中的叶节点。
2. `控制节点（Control Nodes）`：控制在空间化之前 `生成器节点` 的切换、混合和参数化逻辑。`控制节点` 始终是父节点，可以组织成复杂声音设计场景的层次结构。



#### Sampler Nodes

![10079-15-sampler-node](https://images.xiaozhuanlan.com/photo/2021/163071d9b0fd7e324ca97d51d7769541.png)

`采样器节点（Sampler Nodes）` 是 `生成器节点（Generator Nodes）` 的一种类型，负责播放已注册的 `声音资源（Sound Event）`，你也可以设置一些基本属性，使其正确播放。`播放模式（Playback Mode）` 决定音频文件将如何播放，`OneShot` 表示音频文件播放一次将自动停止，`looping` 表示音频文件将无限期播放。`剔除选项（Cull Option）` 控制 PHASE 当声音变得听不见时该做什么，`terminate` 表示声音将在听不见时自动停止，`sleep` 表示声音将在听不见时停止渲染，并在听得到时再次开始渲染。`校准级别（Calibration level）` 设置真实环境中 [SPL](https://en.wikipedia.org/wiki/Sound_pressure#Sound_pressure_level) 的级别，以分贝为单位。

> [SPL](https://en.wikipedia.org/wiki/Sound_pressure#Sound_pressure_level)：声音相对于参考值的有效压力的对数测度。



#### Control Nodes

![10079-16-control-nodes](https://images.xiaozhuanlan.com/photo/2021/16634095f3734d9d01acf50a511a0bf0.png)

`控制节点（Control Nodes）` 主要有四种类型：

1. `随机节点（Random Node）`
2. `切换节点（Switch Node）`
3. `混合节点（Blend Node）`
4. `容器节点（Container Node）`

![10079-17-random-node](https://images.xiaozhuanlan.com/photo/2021/6de48e78107caaf8877c6cbe759a371b.png)

`随机节点（Random Node）` 根据加权随机选择其子节点之一。上图例子中，在下次触发声音事件时，左采样器节点与右采样器节点被选中的几率为 4:1。

![10079-18-switch-node](https://images.xiaozhuanlan.com/photo/2021/215a063ab2ad4f58dbae5f982a115ec7.png)

`切换节点（Switch Node）` 根据参数名在其子节点之间切换。上图例子中，你可以将地形开关从 `creaky wood` 改为 `soft gravel`，下次触发声音事件时，它将选择与参数名称匹配的采样器节点。

![10079-19-blend-node](https://images.xiaozhuanlan.com/photo/2021/ea7f03f9f426499b229152058d13bdf5.png)

`混合节点（Blend Node）` 基于参数值在其子节点之间混合。上图例子中，你可以为 `混合节点` 分配一个湿度参数，将得到一个 `Footstep` 和 `Splash` 节点混合的效果。

![10079-20-container-node](https://images.xiaozhuanlan.com/photo/2021/6893361f4f269274bd5ec53ead03acd6.png)

`容器节点（Container Node）` 同时播放其所有子节点。上图例子中，你可以有一个播放脚步声的采样器，另一个是播放衣服声音的采样器，每次触发 `容器节点` 时，两个采样器节点都会同时播放。



### Mixers

![10079-21-mixers](https://images.xiaozhuanlan.com/photo/2021/cd6aa29742453cba2aad65ae86b4bda0.png)

在 PHASE 框架中，`混音器（Mixers）` 控制音频内容的空间化，框架支持三种混音器：

1. `通道混音器（Channel Mixers）`：可以简单播放音频文件，但是渲染音频时没有 `空间化（Spatial）` 和 `环境（Ambient）` 的效果。
2. `环境混音器（Ambient Mixers）`：渲染音频时有环绕声的效果，但是没有「几何感知」的真实音频空间模拟能力。
3. `空间化混音器（Spatial Mixers）`：渲染音频时既有环绕声的效果，又有「几何感知」的真实音频空间模拟能力。



#### Channel Mixers

![10079-22-channel-mixer](https://images.xiaozhuanlan.com/photo/2021/33614eef47f7161319a946953da912ee.png)

`通道混音器（Channel Mixers）` 渲染音频时没有 `空间化（Spatial）` 和 `环境（Ambient）` 的效果，主要用于主干内容的直接播放，比如立体声音乐和叙事对话这类的音频内容，下面「Demo 1：播放一个音频文件」会使用到。



#### Ambient Mixers

![10079-23-ambient-mixer](https://images.xiaozhuanlan.com/photo/2021/a9b000abd0ee69e994188a6c1ae5780f.png)

`环境混音器（Ambient Mixers）` 渲染音频可以有环绕声的效果，但是没有「几何感知」的真实音频空间模拟能力。举个例子，当听者转动他们的头部时，声音还是继续来自空间中相同的相对位置。`环境混音器` 主要用于 [多声道音频](https://baike.baidu.com/item/%E5%A4%9A%E5%A3%B0%E9%81%93%E9%9F%B3%E9%A2%91)，这里的多声道音频指的是音频不是在真实环境中模拟的，但是有一种来自太空某处的感觉，举个例子，蟋蟀在大森林中鸣叫的背景。另外，如果对沉浸式音乐感兴趣的话，可以详细看看 [Session 10265 - Immerse your app in spatial audio](https://developer.apple.com/videos/play/wwdc2021/10265/)([《【WWDC21 10265】将你的应用沉浸在空间音频中》](https://xiaozhuanlan.com/topic/8750491623))。

> [多声道音频](https://baike.baidu.com/item/%E5%A4%9A%E5%A3%B0%E9%81%93%E9%9F%B3%E9%A2%91)：一种音频放音系统，可以处理若干个（通常多于两个）声道的声音。



#### Spatial Mixers

![10079-24-spatial-mixer](https://images.xiaozhuanlan.com/photo/2021/5135dd8d36f611c07a7b8ec237033fb3.png)

`空间化混音器（Spatial Mixers）` 的特性主要体现在三个方面：

1. 「全部的空间化能力」：当声源相对于听者移动时，你听到声音的来源位置、分贝数以及频率的变化都是基于 [声相](https://en.wikipedia.org/wiki/Panning_(audio))、「距离建模」和「方向性建模」算法的。
2. 「几何感知的环境效果」：在声音源和听者之间的路径上，将使用几何感知环境的效果，支持 `直接路径传输（Direct Path Transmission）`、`早期反射（Early Reflections）` 和 `后期混响（Late Reverb）` 三种环境效果。
3. 「环绕声的效果」：和 `环境混音器（Ambient Mixers）` 一样，音频有一种来自太空某处的感觉。

> [声相](https://en.wikipedia.org/wiki/Panning_(audio))：声相是将声音信号（单声道或立体声对）分配到由声相控制设置确定的新立体声或多声道声场中。



**「距离建模算法」**

![10079-25-spatial-mixer-distance-models](https://images.xiaozhuanlan.com/photo/2021/e4345638ccfea25ee19f8df313aeae5a.png)

`空间化混音器` 支持两种独特的距离建模算法。一种是标准的几何扩展损耗，当然也可以根据自己的喜好增加或者减少其中的效果。举个例子，如果你想在远处用麦克风进行对话，降低值可能会很有用。另一种是设置完整的分段弯曲衰减段，举个例子，你可以构建一系列衰减段，在开始和结束处设置自然距离衰减，但在中间降低衰减，以保证这段区域内重要对话的可听性。



**「方向建模算法」**

![10079-26-spatial-mixer-directivity-models](https://images.xiaozhuanlan.com/photo/2021/fe331a8e27a2ca9d179b685f10a90525.png)

对于点声源而言，`空间化混音器` 支持两种不同的方向建模算法。一种是 [心脏曲线形](https://baike.baidu.com/item/%E5%BF%83%E8%84%8F%E7%BA%BF/10323843?fromtitle=%E5%BF%83%E5%BD%A2%E7%BA%BF&fromid=10018818) 方向建模，做一些简单的修改，你可以用这种模型来模拟人类说话的声音，或者用 [hyper-cardioid](https://mynewmicrophone.com/what-is-a-hypercardioid-microphone-polar-pattern-mic-examples/) 模式来模拟声学弦乐器的声音。另一种是 `锥形方向建模`，这种经典模式允许你将方向性过滤限制在特定的旋转范围内。

> [心脏曲线形](https://baike.baidu.com/item/%E5%BF%83%E8%84%8F%E7%BA%BF/10323843?fromtitle=%E5%BF%83%E5%BD%A2%E7%BA%BF&fromid=10018818)：是一个圆上的固定一点在它绕着与其相切且半径相同的另外一个圆周滚动时所形成的轨迹，因其形状像心形而得名。



**「几何感知的环境效果」**

![10079-27-spatial-mixer-geometry-aware-env-effects](https://images.xiaozhuanlan.com/photo/2021/e1ce3d411af1ee15b2650550e1b97ee9.png)

`空间化混音器` 还支持基于 `空间管道（Channel Pipeline）` 的「几何感知的环境效果」，`空间管道` 可以选择启用或者禁用环境效果，以及每个效果的发送级别。PHASE 当前支持三种效果：

1. `直接路径传输（Direct Path Transmission）`
2. `早期反射（Early Reflections）`
3. `后期混响（Late Reverb）`

![10079-28-geo-env-effect-direct-path-transmission](https://images.xiaozhuanlan.com/photo/2021/89b5d9613f0408159cad4abcf198f835.png)

`直接路径传输（Direct Path Transmission）` 渲染在声音源和听者之间的直接路径和遮挡路径，其中，被遮挡的声音一些被材料吸收，其他能量被传输到物体的另一侧。

![10079-29-geo-env-effect-early-reflections](https://images.xiaozhuanlan.com/photo/2021/b78557668fb4c6d089a16ef922f2fc35.png)

`早期反射（Early Reflections）` 为直接路径提供了强度修改和着色，这些通常是由墙壁和地板上的镜面反射形成的，在更大的空间里，它们也为体验增添了明显的回声。

![10079-30-geo-env-effect-late-reverb](https://images.xiaozhuanlan.com/photo/2021/f144bc093e9cde55b507a66da042c43b.png)

`后期混响（Late Reverb）` 提供环境的声音，这是漫射散射能量的密集聚集，汇聚成空间的最终听觉表现，除了提供空间大小和形状的感觉，它还会给你一种包围感。



### 小结

PHASE API 可以分为三个主要概念：

1. `引擎（Engine）`：管理声音资源。`引擎` 分为三个部分：
    1. `资源注册（Asset Registry）`：支持注册 `声音资源（Sound Asset）` 和 `声音事件资源（Sound Event Asset）`。
    2. `场景图（Scene Graph）`：参与模拟的对象的层次结构，用于模拟真实的音频场景。
    3. `渲染状态（Rendering State）`：管理音频 IO 和播放声音事件。
2. `节点（Nodes）`：控制播放逻辑。分为两种节点：
    1. `生成器节点（Generator Nodes）`：连接 `音频资源` 和 `混音器`，是生产 `声音事件` 的最基本单位。
    2. `控制节点（Control Nodes）`：控制 `生成器节点` 的切换、混合、随机等逻辑，可以组织成复杂声音设计场景的层次结构。有切换、混合、随机、容器四种节点类型。
3. `混音器（Mixers）`：控制空间化能力。
    1. `通道混音器（Channel Mixers）`：可以简单播放音频文件，但是渲染音频时没有 `空间化（Spatial）` 和 `环境（Ambient）` 的效果。
    2. `环境混音器（Ambient Mixers）`：渲染音频时有环绕声的效果，但是没有「几何感知」的真实音频空间模拟能力。
    3. `空间化混音器（Spatial Mixers）`：渲染音频时既有环绕声的效果，又有「几何感知」的真实音频空间模拟能力。拥有「距离建模」和「方向建模」能力，以及支持 `直接路径传输（Direct Path Transmission）`、`早期反射（Early Reflections）` 和 `后期混响（Late Reverb）` 三种环境效果。

当目前为止，我们已经介绍了 PHASE `引擎`、`节点` 和 `混音器` 背后的概念，是时候将这些概念与一些示例结合起来了。



## Sample use cases

![10079-31-three-examples-intro](https://images.xiaozhuanlan.com/photo/2021/0dcfc09b994d82468f705990ff20c786.png)

在本节中，我将介绍怎样实现 **「播放一个音频文件」**、**「构建一个空间化的音频体验」** 和 **「构建一个行为声音事件」**。这三个 Demo，都极具代表性，可以让你更加了解 PHASE 的主要功能，开始的例子会简单一些，越往后的例子就越深入，也越有趣。



### Demo 1：播放一个音频文件

「播放一个音频文件」这个 demo 主要讲述如何用 PHASE 框架来播放一个简单的音频文件。主要步骤分为四个部分：

1. 创建 PHASE 引擎，并注册 `声音资源（Sound Asset）`。
2. 注册 `声音事件资源（Sound Event Asset）`。
3. 创建 `声音事件实例（Sound Event）`，并开始播放。
4. 清理和销毁引擎。



**步骤一：创建 PHASE 引擎，并注册 `声音资源`**

![10079-32-register-a-sound-asset](https://images.xiaozhuanlan.com/photo/2021/82e717922c681f353f0f8fac46ba7259.png)

首先，我们需要创建一个 PHASE 引擎实例。我们通过 `PHASEEngine` 类初始化一个实例，这边我选择了 `automatic` 更新模式，一般我们首选这个模式，如果游戏需要更精确地与帧更新同步时，可以选择 `manual`。

接下来，我们需要向 PHASE 引擎注册 `音频资源`。我们通过引擎实例的 `registerSoundAsset` 方法注册，分别传入 `url`、`identifier`、`assetType`、`channelLayout` 和 `normalizationMode` 参数。

代码实现如下：

```Swift
// Create an Engine in Automatic Update Mode.
let engine = PHASEEngine(updateMode: .automatic)

// Retrieve the URL to an Audio File stored in our Application Bundle.
let audioFileUrl = Bundle.main.url(forResource: "DrumLoop_24_48_Mono", withExtension: "wav")!

// Register the Audio File at the URL.
// Name it "drums", load it into resident memory and apply dynamic normalization to prepare it for playback.
let soundAsset = try engine.assetRegistry.registerSoundAsset(url: audioFileUrl,
                                                             identifier: "drums",
                                                             assetType: .resident,
                                                             channelLayout: nil,
                                                             normalizationMode: .dynamic)
```



**步骤二：注册 `声音事件资源`**

![10079-33-register-sound-event-asset](https://images.xiaozhuanlan.com/photo/2021/40a3357d7cee6685f92c5b1062ffbe37.png)

「注册 `声音事件资源`」主要分为五个步骤：

1. 创建音频资源类型的 `通道布局（Channel Layout）`，这里使用了 `Mono` 类型。
2. 通过上述的 `通道布局` 创建一个 `通道混音器（Channel Mixer）`。
3. 通过已注册在引擎内的「drums」`声音资源` 创建 `采样器节点（Sampler Node）`，并将其连接到 `通道混音器`，`采样器节点` 是一个声音事件节点，概念详见上面的「Concepts -> Nodes」部分。
4. 设置 `采样器节点` 的一些基本属性，比如 `播放模式（Playback Mode）`、`校准模式（Calibration Mode）`。
5. 通过 `采样器节点` 注册一个 `声音事件资源`，并且取名为 `drumEvent`。

代码实现如下：

```Swift
// Create a Channel Layout from a Mono Layout Tag.
let channelLayout = AVAudioChannelLayout(layoutTag: kAudioChannelLayoutTag_Mono)!
     
// Create a Channel Mixer from the Channel Layout.
let channelMixerDefinition = PHASEChannelMixerDefinition(channelLayout: channelLayout)

// Create a Sampler Node from "drums" and hook it into the downstream Channel Mixer.
let samplerNodeDefinition = PHASESamplerNodeDefinition(soundAssetIdentifier: "drums",
                                                       mixerDefinition: channelMixerDefinition)

// Set the Sampler Node's Playback Mode to Looping.
samplerNodeDefinition.playbackMode = .looping;

// Set the Sampler Node's Calibration Mode to Relative SPL and Level to 0 dB.
samplerNodeDefinition.setCalibrationMode(.relativeSpl, level: 0)

// Register a Sound Event Asset with the Engine named "drumEvent".
let soundEventAsset = try engine.assetRegistry.registerSoundEventAsset(rootNode:samplerNodeDefinition,
                                             identifier: "drumEvent")
```



**步骤三：创建 `声音事件实例`，并开始播放**

![10079-34-start-a-sound-event](https://images.xiaozhuanlan.com/photo/2021/f20685ed1e4aeddb45f4933110224d93.png)

「创建 `声音事件实例`，并开始播放」分为三个步骤：

1. 从注册名为「drumevent」的 `声音事件资源` 创建一个 `声音事件实例`。
2. 启动引擎（内部会启动音频 IO），这样我们就可以在输出设备中听到声音了。
3. 开始播放 `声音事件实例`。

代码实现如下：

```Swift
// Create a Sound Event from the Sound Event Asset "drumEvent".
let soundEvent = try PHASESoundEvent(engine: engine, assetIdentifier: "drumEvent")

// Start the Engine.
// This will internally start the Audio IO Thread.
try engine.start()

// Start the Sound Event.
try soundEvent.start()
```



**步骤四：清理和销毁引擎**

清理和销毁引擎主要分为五个步骤：

1. 停止播放 `声音事件实例`。
2. 停止引擎。
3. 注销 `声音事件资源`。
4. 注销 `声音资源`。
5. 最后销毁引擎。

代码实现如下：

```Swift
// Stop and invalidate the Sound Event.
soundEvent.stopAndInvalidate()

// Stop the Engine.
// This will internally stop the Audio IO Thread.
engine.stop()

// Unregister the Sound Event Asset.
engine.assetRegistry.unregisterAsset(identifier: "drumEvent", completionHandler:nil)

// Unregister the Audio File.
engine.assetRegistry.unregisterAsset(identifier: "drums", completionHandler:nil)

// Destroy the Engine.
engine = nil
```



### Demo 2：构建一个空间化的音频体验

我们先简单回顾下，上述「播放一个音频文件」的例子中，音频资源是如何到输出设备上的：

1. 音频资源加载注册到引擎中，并通过 `采样器节点（Sampler Node）` 获取。
2. `采样器节点` 获取音频资源后路由到 `通道混音器（Channel Mixer）`，重新映射到当前输出格式，并通过输出设备播放

这里有两个重要的概念，`采样器节点` 负责音频资源获取，`混音器（Mixer）` 负责音频处理输出并输出最终格式。

这个 demo 主要讲述如何用 PHASE 框架来构建一个空间化的音频体验，整体流程和「播放一个音频文件」很相似，唯一不同的是 `混音器` 的使用。在这个 demo 我们将使用 `空间化混音器（Spatial Mixer）`，并且我们需要 「模拟一个音频场景」配合 `空间化混音器` 使用。所以本节主要讲述两个部分：

1. 注册使用 `空间化混音器` 处理的 `声音事件资源`。
2. 构建 `场景图（Scene Graph）` 与 `空间化混音器` 相关联。

下面让我讲讲详细的过程和实现：



**第一部分：注册使用 `空间化混音器` 处理的 `声音事件资源`**

![10079-36-register-sound-event-asset-4-spatial-mixer](https://images.xiaozhuanlan.com/photo/2021/1aae7d5029200d9e819161675eece925.png)

「注册经过 `空间化混音器` 处理的 `声音事件资源`」主要分为六个步骤：

1. 构建一个 `空间管道（Channel Pipeline）`，我们可以设置声音碰撞遮挡物发生的几何效果，比如 `直接路径传输（Direct Path Transmission）`、`早起反射（Early Reflections）` 和 `后期混响（Late Reverb）`。
2. 通过 `空间管道` 创建一个 `空间化混音器`。
3. 给 `空间化混音器` 设置 `距离模型（Distance Model）`，`距离模型` 的概念详细可以见上述的「Concepts -> Mixers -> Spatial mixers」章节。
4. 通过已注册在引擎内的「drums」`声音资源` 创建 `采样器节点`，并将其连接到 `空间化混音器`。
5. 设置 `采样器节点` 的一些基本属性，比如 `播放模式`、`校准模式` 和 `剔除选项（Cull Option）`。
6. 通过 `采样器节点` 注册一个 `声音事件资源`，并且取名为「drumEvent」。

代码实现如下：

```Swift
// Create a Spatial Pipeline.
let spatialPipelineOptions: PHASESpatialPipeline.Options = [.directPathTransmission, .lateReverb]
let spatialPipeline = PHASESpatialPipeline(options: spatialPipelineOptions)!
spatialPipeline.entries[PHASESpatialCategory.lateReverb]!.sendLevel = 0.1;
engine.defaultReverbPreset = .mediumRoom

// Create a Spatial Mixer with the Spatial Pipeline.
let spatialMixerDefinition = PHASESpatialMixerDefinition(spatialPipeline: spatialPipeline)

// Set the Spatial Mixer's Distance Model.
let distanceModelParameters = PHASEGeometricSpreadingDistanceModelParameters()
distanceModelParameters.fadeOutParameters = PHASEDistanceModelFadeOutParameters(cullDistance: 10.0)
distanceModelParameters.rolloffFactor = 0.25
spatialMixerDefinition.distanceModelParameters = distanceModelParameters

// Create a Sampler Node from "drums" and hook it into the downstream Spatial Mixer.
let samplerNodeDefinition = PHASESamplerNodeDefinition(soundAssetIdentifier: "drums", mixerDefinition:spatialMixerDefinition)

// Set the Sampler Node's Playback Mode to Looping.
samplerNodeDefinition.playbackMode = .looping

// Set the Sampler Node's Calibration Mode to Relative SPL and Level to 12 dB.
samplerNodeDefinition.setCalibrationMode(.relativeSpl, level: 12)

// Set the Sampler Node's Cull Option to Sleep.
samplerNodeDefinition.cullOption = .sleepWakeAtRealtimeOffset;

// Register a Sound Event Asset with the Engine named "drumEvent".
let soundEventAsset = try engine.assetRegistry.registerSoundEventAsset(rootNode: samplerNodeDefinition, identifier: "drumEvent")
```



**第二部分：构建 `场景图` 与 `空间化混音器` 相关联**

一个 `场景图` 中主要包含 `声音源（Source）`、`遮挡物（Occluder）` 和 `听者（Listener）` 三个部分，「构建一个 `场景图` 与`空间化混音器` 相关联」主要分为四个步骤：

1. 创建一个 `听者`，并加到引擎的根对象。
2. 创建一个 `声音源`，并加到引擎的根对象。
3. 创建一个 `遮挡物`，并加到引擎的根对象。
4. 将 `场景图` 与 `空间化混音器` 相关联，并创建一个 `声音事件实例` 开始播放。



**步骤一：「创建一个 `听者`，并加到引擎的根对象」**

![10079-37-create-a-listener](https://images.xiaozhuanlan.com/photo/2021/4caf4496409bc0b1bf266163c041fbd6.png)

创建一个 `听者` 之后，我们可以设置 `变换（Transform）` 属性，然后将其加到引擎的根对象或其子对象之一，代码实现如下：

```Swift
// Create a Listener.
let listener = PHASEListener(engine: engine)

// Set the Listener's transform to the origin with no rotation.
listener.transform = matrix_identity_float4x4;

// Attach the Listener to the Engine's Scene Graph via its Root Object.
// This actives the Listener within the simulation.
try engine.rootObject.addChild(listener)
```



**步骤二：「创建一个 `声音源`，并加到引擎的根对象」**

![10079-38-create-a-volumetric-source](https://images.xiaozhuanlan.com/photo/2021/f56b06884d9c6b3ece46ac6f287c248c.png)

创建一个 `声音源` 主要分为五个步骤：

1. 创建一个 `二十面体网格（Icosahedron Mesh）`。
2. 从 `二十面体网格` 创建一个 `形状（Shape）`。
3. 从 `形状` 创建一个 `体积声音源（Volumetric Source）`，如果有需求的话，这里也可以创建 `点声源`，不是一定要创建 `体积声音源`。
4. 通过设置 `体积声音源` 的 `变换（Transform）` 属性，来设置 `声音源` 和 `听者` 之间的位置关系。
5. 将 `体积声音源` 加到引擎的根对象或其子对象之一。

代码实现如下：

```Swift
// Create an Icosahedron Mesh.
let mesh = MDLMesh.newIcosahedron(withRadius: 0.0142, inwardNormals: false, allocator:nil)

// Create a Shape from the Icosahedron Mesh.
let shape = PHASEShape(engine: engine, mesh: mesh)

// Create a Volumetric Source from the Shape.
let source = PHASESource(engine: engine, shapes: [shape])

// Translate the Source 2 meters in front of the Listener and rotated back toward the Listener.
var sourceTransform: simd_float4x4
sourceTransform.columns.0 = simd_make_float4(-1.0, 0.0, 0.0, 0.0)
sourceTransform.columns.1 = simd_make_float4(0.0, 1.0, 0.0, 0.0)
sourceTransform.columns.2 = simd_make_float4(0.0, 0.0, -1.0, 0.0)
sourceTransform.columns.3 = simd_make_float4(0.0, 0.0, 2.0, 1.0)
source.transform = sourceTransform;

// Attach the Source to the Engine's Scene Graph.
// This actives the Listener within the simulation.
try engine.rootObject.addChild(source)
```



**步骤三：「创建一个 `遮挡物`，并加到引擎的根对象」**

![10079-39-create-an-occluder](https://images.xiaozhuanlan.com/photo/2021/ff45e030800882891375f3d23184d974.png)

创建一个 `遮挡物` 主要分为以下六个步骤：

1. 创建一个箱子形的 `网格（Mesh）`。
2. 从`网格`创建一个 `形状（Shape）`。
3. 从引擎中预置的材料库中创建一个 `材料（Material）`，并将其附加给 `形状`。
4. 从 `形状` 创建一个 `遮挡物`。
5. 通过设置 `遮挡物` 的 `变换` 属性，来设置 `声音源`、`听者` 和 `遮挡物` 三者之间的位置关系。
6. 将 `遮挡物` 加到引擎的根对象或其子对象之一。

代码实现如下：

```Swift
// Create a Box Mesh.
let boxMesh = MDLMesh.newBox(withDimensions: simd_make_float3(0.6096, 0.3048, 0.1016),
                             segments: simd_uint3(repeating: 6),
                             geometryType: .triangles,
                             inwardNormals: false,
                             allocator: nil)

// Create a Shape from the Box Mesh.
let boxShape = PHASEShape(engine: engine, mesh:boxMesh)

// Create a Material.
// In this case, we'll make it 'Cardboard'.
let material = PHASEMaterial(engine: engine, preset: .cardboard)

// Set the Material on the Shape.
boxShape.elements[0].material = material

// Create an Occluder from the Shape.
let occluder = PHASEOccluder(engine: engine, shapes: [boxShape])
    
// Translate the Occluder 1 meter in front of the Listener and rotated back toward the Listener.
// This puts the Occluder half way between the Source and Listener.
var occluderTransform: simd_float4x4
occluderTransform.columns.0 = simd_make_float4(-1.0, 0.0, 0.0, 0.0)
occluderTransform.columns.1 = simd_make_float4(0.0, 1.0, 0.0, 0.0)
occluderTransform.columns.2 = simd_make_float4(0.0, 0.0, -1.0, 0.0)
occluderTransform.columns.3 = simd_make_float4(0.0, 0.0, 1.0, 1.0)
occluder.transform = occluderTransform

// Attach the Occluder to the Engine's Scene Graph.
// This actives the Occluder within the simulation.
try engine.rootObject.addChild(occluder)
```



**步骤四：「将 `场景图` 与 `空间化混音器` 相关联，并创建一个 `声音事件实例` 开始播放」**

![10079-40-create-a-sound-event](https://images.xiaozhuanlan.com/photo/2021/617e23df8be5cbb834807be9e354a126.png)

代码实现如下：

```Swift
// Associate the Source and Listener with the Spatial Mixer in the Sound Event.
let mixerParameters = PHASEMixerParameters()
mixerParameters.addSpatialMixerParameters(identifier: spatialMixerDefinition.identifier, source: source, listener: listener)

// Create a Sound Event from the built Sound Event Asset "drumEvent".
let soundEvent = try PHASESoundEvent(engine: engine, assetIdentifier: "drumEvent", mixerParameters: mixerParameters)
```



### Demo 3：构建一个行为声音事件

现在，我们完成了一个空间化音频的体验，下面让我们来看下如何构建一个复杂的 `声音事件（Sound Event）`。`声音事件` 可以被组织成行为层次结构，用于交互式声音设计。在本节中，我们将模拟「一个穿着嘈杂的 Gore-Tex 夹克的演员在不同类型的表面湿度可变的地形上行走」，整个过程主要分为四个步骤：

1. 创建一个「表示在木板上行走发出不同脚步声」的 `随机节点（Random Node）`。
2. 创建一个「地形控制」的 `切换节点（Switch Node）` 和一个「表示在砾石上行走发出不同脚步声」的 `随机节点`，将两个脚步声 `随机节点` 作为地形 `切换节点` 的子节点。
3. 创建一个「由湿度参数控制」的 `混合节点（Blend Node）` 和一个溅水的 `随机节点`，将地形 `切换节点` 和溅水 `随机节点` 作为湿度控制 `混合节点` 的子节点。
4. 创建一个 `容器节点（Container Node）` 和一个「表示 Gore-Tex 夹克噪声」的 `随机节点`，将上述的湿度控制 `混合节点` 和 Gore-Tex 夹克噪声的 `随机节点` 作为 `容器节点` 的子节点。

![10079-41-third-example](https://images.xiaozhuanlan.com/photo/2021/52c1a2c88192c16fb91f5437f981ba93.png)

**步骤一：创建一个「表示在木板上行走发出不同脚步声」的 `随机节点`**

```Swift
// Create a Sampler Node from "footstep_wood_clip_1" and hook it into a Channel Mixer.
let footstep_wood_sampler_1 = PHASESamplerNodeDefinition(soundAssetIdentifier: "footstep_wood_clip_1", mixerDefinition: channelMixerDefinition)

// Create a Sampler Node from "footstep_wood_clip_2" and hook it into a Channel Mixer.
let footstep_wood_sampler_2 = PHASESamplerNodeDefinition(soundAssetIdentifier: "footstep_wood_clip_2", mixerDefinition: channelMixerDefinition)

// Create a Random Node.
// Add 'Footstep on Creaky Wood' Sampler Nodes as children of the Random Node.
// Note that higher weights increase the likelihood of that child being chosen.
let footstep_wood_random = PHASERandomNodeDefinition()
footstep_wood_random.addSubtree(footstep_wood_sampler_1, weight: 2)
footstep_wood_random.addSubtree(footstep_wood_sampler_2, weight: 1)
```



**步骤二：创建一个「地形控制」的 `切换节点` 和一个「表示在砾石上行走发出不同脚步声」的 `随机节点`，将两个脚步声 `随机节点` 作为地形 `切换节点` 的子节点**

```Swift
// Create a Sampler Node from "footstep_gravel_clip_1" and hook it into a Channel Mixer.
let footstep_gravel_sampler_1 = PHASESamplerNodeDefinition(soundAssetIdentifier: "footstep_gravel_clip_1", mixerDefinition: channelMixerDefinition)

// Create a Sampler Node from "footstep_gravel_clip_2" and hook it into a Channel Mixer.
let footstep_gravel_sampler_2 = PHASESamplerNodeDefinition(soundAssetIdentifier: "footstep_gravel_clip_2", mixerDefinition: channelMixerDefinition)

// Create a Random Node.
// Add 'Footstep on Soft Gravel' Sampler Nodes as children of the Random Node.
// Note that higher weights increase the likelihood of that child being chosen.
let footstep_gravel_random = PHASERandomNodeDefinition()
footstep_gravel_random.addSubtree(footstep_gravel_sampler_1, weight: 2)
footstep_gravel_random.addSubtree(footstep_gravel_sampler_2, weight: 1)

// Create a Terrain String MetaParameter.
// Set the default value to "creaky_wood".
let terrain = PHASEStringMetaParameterDefinition(value: "creaky_wood")

// Create a Terrain Switch Node.
// Add 'Random Footstep on Creaky Wood' and 'Random Footstep on Soft Gravel' as Children.
let terrain_switch = PHASESwitchNodeDefinition(switchMetaParameterDefinition: terrain)
terrain_switch.addSubtree(footstep_wood_random, switchValue: "creaky_wood")
terrain_switch.addSubtree(footstep_gravel_random, switchValue: "soft_gravel")
```



**步骤三：创建一个「由湿度参数控制」的 `混合节点` 和一个溅水的 `随机节点`，将地形 `切换节点` 和溅水 `随机节点` 作为湿度控制 `混合节点` 的子节点**

```Swift
// Create a Sampler Node from "splash_clip_1" and hook it into a Channel Mixer.
let splash_sampler_1 = PHASESamplerNodeDefinition(soundAssetIdentifier: "splash_clip_1", mixerDefinition: channelMixerDefinition)
    
// Create a Sampler Node from "splash_clip_2" and hook it into a Channel Mixer.
let splash_sampler_2 = PHASESamplerNodeDefinition(soundAssetIdentifier: "splash_clip_2", mixerDefinition: channelMixerDefinition)

// Create a Random Node.
// Add 'Splash' Sampler Nodes as children of the Random Node.
// Note that higher weights increase the likelihood of that child being chosen.
let splash_random = PHASERandomNodeDefinition()
splash_random.addSubtree(splash_sampler_1, weight: 9)
splash_random.addSubtree(splash_sampler_2, weight: 7)

// Create a Wetness Number MetaParameter.
// The range is [0, 1], from dry to wet. The default value is 0.5.
let wetness = PHASENumberMetaParameterDefinition(value: 0.5, minimum: 0, maximum: 1)
    
// Create a 'Wetness' Blend Node that blends between dry and wet terrain.
// Add 'Terrain' Switch Node and 'Splash' Random Node as children.
// As you increase the wetness, the mix between the dry footsteps and splashes will change.
let wetness_blend = PHASEBlendNodeDefinition(blendMetaParameterDefinition: wetness)
wetness_blend.addRangeForInputValues(belowValue: 1, fullGainAtValue: 0, fadeCurveType: .linear, subtree: terrain_switch)
wetness_blend.addRangeForInputValues(aboveValue: 0, fullGainAtValue: 1, fadeCurveType: .linear, subTree: splash_random)
```



**步骤四：创建一个 `容器节点` 和一个「表示 Gore-Tex 夹克噪声」的 `随机节点`，将上述的湿度控制 `混合节点` 和 Gore-Tex 夹克噪声的 `随机节点` 作为 `容器节点` 的子节点**

```Swift
// Create a Sampler Node from "gortex_clip_1" and hook it into a Channel Mixer.
let noisy_clothing_sampler_1 = PHASESamplerNodeDefinition(soundAssetIdentifier: "gortex_clip_1", mixerDefinition: channelMixerDefinition)

// Create a Sampler Node from "gortex_clip_2" and hook it into a Channel Mixer.
let noisy_clothing_sampler_2 = PHASESamplerNodeDefinition(soundAssetIdentifier: "gortex_clip_2", mixerDefinition: channelMixerDefinition)

// Create a Random Node.
// Add 'Noisy Clothing' Sampler Nodes as children of the Random Node.
// Note that higher weights increase the likelihood of that child being chosen.
let noisy_clothing_random = PHASERandomNodeDefinition()
noisy_clothing_random.addSubtree(noisy_clothing_sampler_1, weight: 3)
noisy_clothing_random.addSubtree(noisy_clothing_sampler_2, weight: 5)

// Create a Container Node.
// Add 'Wetness' Blend Node and 'Noisy Clothing' Random Node as children.
let actor_container = PHASEContainerNodeDefinition()
actor_container.addSubtree(wetness_blend)
actor_container.addSubtree(noisy_clothing_random)
```

综上，我们就有了最终的节点层次结构，也就有了演员在场景中行走的完整表示：「演员每迈出一步，我都会听到夹克的褶皱声，以及在吱吱作响的木板或柔软的砾石上的脚步声（取决于地形参数），并或多或少地听到溅水声（取决于湿度参数）。



### 小结

1. 我们学习了「播放一个音频文件」，解决了简单的播放问题。
2. 我们学习了「构建一个空间化的音频体验」。在这里，我们了解了如何通过 `听者`、`体积声音源` 和 `遮挡物` 来构建虚拟的音频场景。
3. 我们学习了「构建一个行为声音事件」。在这里，我们学习了如何将 `随机`、`切换`、`混合` 和 `容器` 节点组合在一起构建交互式声音事件。

至此，我们对 PHASE 的内部工作原理基本有了一个大概的了解，如果之后你有需求要构建 `几何感知` 的音频体验，相信对你会有一定帮助的。



## 总结

最后，我们来总结下本文的大致内容：

1. PHASE 框架的初衷是「解决游戏开发中音频需要后期制作，不能和游戏中其他子系统实时交互的痛点」。
2. PHASE 给开发者带来 「几何感知」 和 「事件驱动的音频播放」 两大能力，这样可以很好地解决上述问题。
  
   「几何感知」：
   1. 在 PHASE 中，你可以模拟一个真实音频世界中的场景，场景包含 `声音源`、`遮挡物` 和 `听者`。
   2. `声音源`、`遮挡物` 都可以是几何形状的，同时可以设置声音源的 `距离建模` 和 `方向建模`，设置遮挡物的声学材料属性，以及还可以设置 `声音源` 碰撞 `遮挡物` 发生的几何效果，比如 `直接路径传输`、`早起反射` 和 `后期混响`。
   
   「事件驱动的音频播放」：
   1. 在 PHASE 中，一个 `声音事件节点` 可以由多个子节点组成，是一个树状的结构，这些节点可以是 `生成器节点` 或者 `控制节点`。
   2. `生成器节点` 负责连接 `音频资源` 和 `混音器`，是产生 `声音事件资源` 的最基本单位，`控制节点` 负责掌握整个程序的逻辑，它可以是 `随机节点`、`切换节点`、`混合节点` 和 `容器节点` 中的一者，这些可以让我们随意表达一个复杂的 `事件驱动的音频播放` 了。

除了解决游戏创作的痛点外，因为 PHASE 有「几何感知」的能力，所以只要有「模拟现实的极致听觉体验」的场景，我们就可以用 PHASE 来完成。想象一下 VR 和 PHASE 的结合是否可以给用户带来更好的虚拟世界呢？另外用 PHASE 完成一场「在线音乐会」呢？PHASE 可以还原舞台上不同位置不同乐器的声音，有小提琴，有钢琴等等，同时可以还原座位席上每个听众的位置，用户可以在手机上选择不同的座位来享受不同的听觉体验，我相信这将会是一场美好的听觉盛宴。


## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
