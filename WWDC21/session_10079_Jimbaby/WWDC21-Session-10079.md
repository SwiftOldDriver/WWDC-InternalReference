# WWDC21 10079 - Discover geometry-aware audio with PHASE

[TOC]

![10079-00-background](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-00-background.png)



> 本文章基于 WWDC21 Session 10079 - [Discover geometry-aware audio with the Physical Audio Spatialization Engine (PHASE)](https://developer.apple.com/videos/play/wwdc2021/10079/) 梳理



## 引言

![10079-02-contents](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-02-contents.png)

众所周知，无论是在普通应用还是游戏应用中，音频都扮演着重要的角色。Core Audio 团队今年给我们带来了新框架 PHASE（Physical Audio Spatialization Engine），用于探索几何感知的音频体验。该 Session 主要包括四个方面的内容，分别为：`Motivation`、`Features`、`Concepts`、`Sample use cases`，讲述了 PHASE 的初衷、主要能力、重要的概念和部分示例。

读完本文，你将了解到 PHASE 解决的问题是什么，是如何提供几何感知能力的，以及如何运用它来构建几何感知的音频体验。



## Motivation

![10079-01-audio-post-production](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-01-audio-post-production.png)

在当今的游戏中，游戏引擎的各种子系统，如物理、动画、视觉效果等，都是根据玩家的行为而发生变化，推动游戏情节向前发展。

然而，音频子系统通常与其余部分是分开管理和驱动的。**音频资源通常是后期制作、预先处理、手动调整的**，随着视觉效果的变化，音频关资源需要再生，这会导致**音频体验落后于游戏的视觉方面**。于是 Apple 团队带来新的音频框架 PHASE，用 PHASE 探索几何感知的音频体验，解决音频资源后期制作的痛点。



## Features

### Introducing PHASE

![10079-03-introduce-PHASE](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-03-introduce-PHASE.png)

其实 PHASE 主要给开发者带来了 `几何感知` 和 `事件驱动的音频播放` 两大能力，这两大能力可以很好地解决上述问题。同时在支持的设备上可以提供一致性的空间音频体验，并且也可以与现有的游戏创作流程相结合。



### Geometry-aware

在介绍 `几何感知` 之前，让我们来回顾下传统的游戏音频工作流程：

![10079-04-common-game-audio-workflow](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-04-common-game-audio-workflow.png)

这是个室外场景的例子，有一个听众，一个声源（小溪流动），一个遮挡物（谷仓）。遮挡物是场景中的物体，可以抑制声音源和听者之间的声音。通常，我们将在小溪区域**放置多个点声源**，随着听者的移动，必须使用各种技术确定点声源之间适当的过滤和混合比，并手动混合它们以提供良好的音频体验。在通常的游戏开发过程中，如果视觉场景发生变化，例如示例场景中的谷仓，你**必须手动调整音频来匹配视觉场景变化**。

想象一下，你可以构建应用程序，其中声音源不是你需要根据场景管理和混合的点声源，而是音频系统自动为你管理的区域或体积声源上发出的声音，PHASE 就是这么做的。

![10079-05-geometry-intergration-and-volumetric-sounds](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-05-geometry-intergration-and-volumetric-sounds.png)

PHASE 引入了**体积声源**的概念，**声音源可以是几何形状的物体**，遮挡物也可以是几何形状的物体，并且可以设置遮挡物的声学材料属性。PHASE 还允许你**为声音源设置距离模型和方向模型**，对距离模型感兴趣的可以延伸阅读下 [这篇文章](https://www.52vr.com//extDoc/ue4/CHN/Engine/Audio/DistanceModelAttenuation/index.html)。你还可以从预设库中选择 [早期反射](https://www.sweetwater.com/insync/early-reflections/) 和后期 [混响](https://baike.baidu.com/item/%E6%B7%B7%E5%93%8D/480460) 等属性模拟声音碰到遮挡物时的效果。一旦你告诉框架各种声源、遮挡物和听者在哪里，PHASE 将帮助你完成繁重的工作，并为你模拟场景中各种声源的遮挡和传播效果。这样你的应用程序的音频系统就是几何感知的，它可以很快地适应视觉场景的变化。



### Event-based interactive playback system

![10079-06-sound-events](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-06-sound-events.png)

除了几何感知之外，PHASE 还提供了一个**基于事件的交互式播放系统**。声音事件是描述相位中音频播放事件的基本单元，它封装了音频资源的切换、混合和播放。声音事件的范围可以从简单的事件，如单次播放、循环播放，到复杂的事件序列组织成一棵树，每个父节点事件可以混合或切换播放事件的子节点事件。

![10079-07-sound-events-tree-for-footstep-example](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-07-sound-events-tree-for-footstep-example-2.png)

让我们举一个简单的脚步声的例子。这里我们有一个随机节点，它将在砾石上的三个不同的脚步声中进行随机选择一个。同时我们有另一个随机节点为布沙沙作响，这两个事件树都可以嫁接到另一棵树 `Near` 上，以播放布沙沙声和脚步声的混合。我们可以有另一棵树 `Far`，当角色在远处时，播放一组不同的脚步声。`Near` 和 `Far` 的混合现在可以根据游戏的距离来控制。这样我们就可以模拟一个角色走路的场景，每迈出一步，都可以听到近距离走在砾石上的脚步声和布沙沙作响的混合，同时随着与远方的距离变化，我们会或多或少地听到远方一个踩在砾石上的脚步声。

另外，如果有需要的话，我们还可以添加更多的声音事件树，如雪地或草地上的脚步，并构建一个复杂的播放事件序列，该序列可以由用户交互、物理和动画等子系统触发。这样音频系统就可以和游戏其他子系统一样，根据玩家的行为驱动游戏的情节自然发展了。



### Rendering system

![10079-08-rendering-system](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-08-rendering-system.png)

PHASE 强大的几何感知能力，背后当然少不了渲染系统的支撑，它支持多种音频混合模式，这里简单介绍下几种模式的区别，详见 `Concepts -> Mixers` 部分。

1. 简单的 `通道混合`，播放普通的音频文件就可以用这种混合，比如播放立体声，见上图左。
2. 具有方向和距离概念的 `空间混合`，这种混合既有环绕声效果，又具有真实环境的模拟，见上图中。正是这种混合，PHASE 才名副其实地拥有了几何感知能力。
3. 介于前两者之间的 `环境混合`，这种混合和 `空间混合` 一样有环绕声的效果，但是少了距离建模等真实模拟环境的能力，见上图右。

另外，这些渲染能力已经支持 iOS、macOS 设备和 Air Pods 系列耳机，这样你的应用程序在支持的设备上就可以提供一致的空间音频体验了。介绍完 PHASE 主要的功能，下面让我们来看看 PHASE API 的几个主要概念。



## Concepts

![10079-09-three-main-concerpts](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-09-three-main-concerpts.png)

PHASE API 可以分为三个主要概念， `Engine`、 `Nodes` 和 `Mixers`，引擎管理声音资源，节点控制播放逻辑，混音器控制空间化能力。



### Engine

![10079-10-engine-breakdown-three-sections](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-10-engine-breakdown-three-sections.png)

`Engine` 分为三个主要部分，`Asset Registry`、`Scene Graph` 和 `Rendering State`，下面首先来介绍下 `Asset Registry`



#### Asset Registry

![10079-11-asset-registry](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-11-asset-registry.png)

在整个引擎的生命周期中，您将向其注册和注销资源。PHASE 支持注册 `声音资源` 和 `声音事件资源`。`声音资源` 可以直接从音频文件加载，也可以从原音频数据加载到引擎中。`声音事件资源` 是一个或多个的 `声音事件节点` 组成的树状结构，`声音事件节点` 可以连接 `音频资源` 和 `混音器` 并控制声音播放，`混音器` 控制空间化，下面 `Concepts -> Nodes` 和 `Concepts -> Mixers` 部分会分别详细介绍 `声音事件节点` 和 `混音器` 的概念。



#### Scene Graph

![10079-12-scene-graph](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-12-scene-graph.png)

`场景图` 是参与模拟的对象的层次结构，包括 `听者`、`声音源` 和 `遮挡物`。`听者` 表示听到声音的对象。`声音源` 表示声音起源的对象，PHASE 同时支持点声源和体积声源。`遮挡物` 是影响声音传输的几何形状物体，可以给它定义吸收和传输声音的材料，PHASE 带有一个材料预设库，用来模拟从纸板箱到玻璃窗，再到砖墙的一切。当你将这些对象添加到场景时，需要把它们组织成一个层次结构，并将它们直接或间接附加到引擎的根对象。



#### Rendering State

![10079-13-rendering-state](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-13-rendering-state.png)

`Rendering State` 管理音频 IO 和播放声音事件。首次创建引擎时，将禁用音频 IO，这允许你注册资产、构建场景图、构建声音事件和执行其他引擎操作，所有这些都无需运行音频输入输出。一旦你准备好播放声音事件，你就可以启动引擎，它将在内部启动音频 IO。同样，当你播放完声音事件后，你可以停止引擎，这将停止音频 IO 并停止任何播放声音事件。



### Nodes

![10079-14-node-categories](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-14-node-categories.png)

引擎中的 `节点` 控制音频内容的播放，`节点` 是生成或控制音频播放的对象的分层集合。`生成器节点` 产生音频，它们总是层次结构中的叶节点。`控制节点` 控制在空间化之前 `生成器节点` 的切换、混合和参数化逻辑。`控制节点` 始终是父节点，可以组织成复杂声音设计场景的层次结构。



#### Sampler node

![10079-15-sampler-node](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-15-sampler-node.png)

`采样器节点` 是 `生成器节点` 的一种类型，负责播放已注册的 `声音资源`，你也可以设置一些基本属性，使其正确回放。`播放模式` 决定音频文件将如何播放，`OneShot` 表示音频文件播放一次将自动停止，`looping` 表示音频文件将无限期播放。`剔除选项` 控制 PHASE 当声音变得听不见时该做什么，`terminate` 表示声音将在听不见时自动停止，`sleep` 表示声音将在听不见时停止渲染，并在听得到时再次开始渲染。`Calibration level` 设置真实环境中 [SPL](https://en.wikipedia.org/wiki/Sound_pressure#Sound_pressure_level) 的级别，以分贝为单位。



#### Control nodes

![10079-16-control-nodes](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-16-control-nodes.png)

`控制节点` 主要有四种类型，分别是 `随机`、`切换`、`混合` 和 `容器` 节点。

![10079-17-random-node](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-17-random-node.png)

`随机` 节点根据加权随机选择其子节点之一。上图例子中，在下次触发声音事件时，左采样器节点与右采样器节点被选中的几率为 4:1。

![10079-18-switch-node](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-18-switch-node.png)

`切换` 节点根据参数名在其子节点之间切换。上图例子中，你可以将地形开关从 `creaky wood` 改为 `soft gravel`，下次触发声音事件时，它将选择与参数名称匹配的采样器节点。

![10079-19-blend-node](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-19-blend-node.png)

`混合` 节点基于参数值在其子节点之间混合。上图例子中，你可以为 `混合` 节点分配一个湿度参数，将得到一个 `Footstep` 和 `Splash` 节点混合的效果。

![10079-20-container-node](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-20-container-node.png)

`容器` 节点同时播放其所有子节点。上图例子中，你可以有一个播放脚步声的采样器，另一个是播放衣服声音的采样器，每次触发 `容器` 节点时，两个采样器节点都会同时播放。



### Mixers

![10079-21-mixers](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-21-mixers.png)

在 PHASE 框架中，`混音器` 控制音频内容的空间化，框架支持 `通道`、`环境` 和 `空间化` 这三种混音器。



#### Channel mixers

![10079-22-channel-mixer](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-22-channel-mixer.png)

`通道混音器` 渲染音频时没有 `空间化` 和 `环境` 的效果，主要用于主干内容的直接播放，比如立体声音乐和叙事对话这类的音频内容，下面示例一 `Play an audio file` 会使用到。



#### Ambient mixers

![10079-23-ambient-mixer](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-23-ambient-mixer.png)

`环境混音器` 渲染音频可以有环绕声的效果，但是没有距离建模或者身临其境的效果。举个例子，当听者转动他们的头部时，声音还是继续来自空间中相同的相对位置。`环境混音器` 主要用于 [多声道内容](https://baike.baidu.com/item/%E5%A4%9A%E5%A3%B0%E9%81%93%E9%9F%B3%E9%A2%91)，这里的多声道内容指的是音频不是在真实环境中模拟的，但是有一种来自太空某处的感觉，举个例子，蟋蟀在大森林中鸣叫的背景。另外，如果对沉浸式音乐感兴趣的话，可以详细看看 [Immerse your app in spatial audio](https://developer.apple.com/videos/play/wwdc2021/10265/)。



#### Spatial mixers

![10079-24-spatial-mixer](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-24-spatial-mixer.png)

`空间化混音器` 和 `环境混音器` 一样也有环绕声的效果，但同时还拥有全部的空间化能力，当声源相对于听者移动时，你将听到声音的来源位置、分贝数以及频率的变化，这些的变化都是基于 [声相](https://en.wikipedia.org/wiki/Panning_(audio))、距离建模和方向性建模算法的。另外，在声音源和听者之间的路径上，将使用几何感知环境的效果。所以 `空间化混音器` 主要用于参与完整环境模拟的声音。

![10079-25-spatial-mixer-distance-models](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-25-spatial-mixer-distance-models.png)

`空间化混音器` 支持两种独特的距离建模算法。一种是标准的几何扩展损耗，当然也可以根据自己的喜好增加或者减少其中的效果。举个例子，如果你想在远处用麦克风进行对话，降低值可能会很有用。另一种是设置完整的分段弯曲衰减段，举个例子，你可以构建一系列衰减段，在开始和结束处设置自然距离衰减，但在中间降低衰减，以保证这段区域内重要对话的可听性。

![10079-26-spatial-mixer-directivity-models](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-26-spatial-mixer-directivity-models.png)

对于点声源而言，`空间化混音器` 支持两种不同的方向建模算法。一种是 [心脏曲线形](https://baike.baidu.com/item/%E5%BF%83%E8%84%8F%E7%BA%BF/10323843?fromtitle=%E5%BF%83%E5%BD%A2%E7%BA%BF&fromid=10018818) 方向建模，做一些简单的修改，你可以用这种模型来模拟人类说话的声音，或者用 [hyper-cardioid](https://mynewmicrophone.com/what-is-a-hypercardioid-microphone-polar-pattern-mic-examples/) 模式来模拟声学弦乐器的声音。另一种是 `锥形方向建模`，这种经典模式允许你将方向性过滤限制在特定的旋转范围内。

![10079-27-spatial-mixer-geometry-aware-env-effects](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-27-spatial-mixer-geometry-aware-env-effects.png)

`空间化混音器` 还支持基于 `空间管道` 的几何感知环境的效果，`空间管道` 可以选择启用或者禁用环境效果，以及每个效果的发送级别。PHASE 当前支持 `直接路径传输`、[早期反射](https://www.sweetwater.com/insync/early-reflections/) 和后期 [混响](https://baike.baidu.com/item/%E6%B7%B7%E5%93%8D/480460) 三种效果。

![10079-28-geo-env-effect-direct-path-transmission](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-28-geo-env-effect-direct-path-transmission.png)

`直接路径传输` 渲染在声音源和听者之间的直接路径和遮挡路径，其中，被遮挡的声音一些被材料吸收，其他能量被传输到物体的另一侧。

![10079-29-geo-env-effect-early-reflections](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-29-geo-env-effect-early-reflections.png)

`早期反射` 为直接路径提供了强度修改和着色，这些通常是由墙壁和地板上的镜面反射形成的，在更大的空间里，它们也为体验增添了明显的回声。

![10079-30-geo-env-effect-late-reverb](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-30-geo-env-effect-late-reverb.png)

`后期混响` 提供环境的声音，这是漫射散射能量的密集聚集，汇聚成空间的最终听觉表现，除了提供空间大小和形状的感觉，它还会给你一种包围感。

当目前为止，我们已经介绍了 PHASE `引擎`、`节点` 和 `混音器` 背后的概念，是时候将这些概念与一些示例结合起来了。



## Sample use cases

![10079-31-three-examples-intro](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-31-three-examples-intro.png)

在本节中，我将介绍怎样实现**播放音频文件**、**构建空间音频体验**和**构建行为声音事件**。这三个 Demo，都极具代表性，可以让你更加了解 PHASE 的主要功能，开始的例子会简单一些，越往后的例子就越深入，也越有趣。



### Play an audio file

首先，我们来介绍下播放音频文件的这个示例。

![10079-32-register-a-sound-asset](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-32-register-a-sound-asset.png)

1. 首先，我们需要**创建一个 PHASE 引擎实例**。我们通过 `PHASEEngine` 类初始化一个实例，这边我选择了 `automatic` 更新模式，一般我们首选这个模式，如果游戏需要更精确地与帧更新同步时，可以选择 `manual`。
2. 接下来，我们需要向 PHASE 引擎**注册音频资源**。我们通过引擎实例的 `registerSoundAsset` 方法注册，分别传入音频文件的 `url`、`identifier`、`assetType`、`channelLayout` 和 `normalizationMode` 参数。
    - `url` 指的是音频文件在 `Bundle` 中的 `url`。
    - `identifier` 是音频资源在引擎中唯一标识，下面例子取名为 `drums`。
    - `assetType` 代表资源类型，是个枚举类型 `PHASEAssetType`，有 `resident` 和 `streamed` 两种值，前者音频数据全部加载到内存再播放，后者是实时流播放。
    - `channelLayout` 代表通道布局，如果传入非法的 `channelLayout` 或 `nil` 时，只支持 `mono` 或者 `stereo` 音频资源（`mono` 是单声道，`stereo` 是立体声）。
    - `normalizationMode` 代表对输入音频的标准化模式，提供了 `dynamic` 和 `none` 两种模式，如果传入 `none` 的话，官方建议应用最好自己实现标准化。

以上两步代码实现如下：

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

![10079-33-register-sound-event-asset](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-33-register-sound-event-asset.png)

3. 现在我们需要**注册声音事件资源**，具体步骤如下：
    1. 创建 `Mono` 类型的 `通道布局`。
    2. 通过上述的 `通道布局` 创建一个 `通道混音器`。
    3. 通过已注册在引擎内的 `drums` 声音资源创建 `采样器节点`，并将其连接到 `通道混音器`，`采样器节点` 是一个声音事件节点，概念详见上面的 `Concepts -> Nodes` 部分。
    4. 设置 `采样器节点` 的一些基本属性，比如 `播放模式`、`校准模式`。
    5. 通过 `采样器节点` 注册一个 `声音事件资源`，并且取名为 `drumEvent`。

具体代码实现如下：

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

![10079-34-start-a-sound-event](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-34-start-a-sound-event.png)

4. 一旦注册了一个声音事件资源，我们就可以**创建一个声音事件实例并开始播放**了。
    1. 从注册名为 `drumevent` 的声音事件资源创建一个声音事件。
    2. 启动引擎，这将启动音频 IO，以便我们可以在输出设备中听到声音。
    3. 开始声音事件。
    

具体代码实现如下：

```Swift
// Create a Sound Event from the Sound Event Asset "drumEvent".
let soundEvent = try PHASESoundEvent(engine: engine, assetIdentifier: "drumEvent")

// Start the Engine.
// This will internally start the Audio IO Thread.
try engine.start()

// Start the Sound Event.
try soundEvent.start()
```

综上，一个音频文件的播放，大致可以是这样的：**加载的声音资源通过采样器播放，路由到通道混音器，重新映射到当前输出格式，并通过输出设备播放**。

5. 最后一步，当我们播放完声音事件后，我们需要**清理引擎**，具体步骤如下：
    1. 停止声音事件。
    2. 停止引擎。
    3. 注销声音事件资源。
    4. 注销声音资源。
    5. 最后销毁引擎。

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



### Build a spatial audio experience

现在，我们用 PHASE 完成了一个基础的播放音频功能，下面我们来介绍下用 PHASE 如何完成一个空间化音频的体验。和播放普通音频文件相比，构建空间音频体验主要区别需要用 `空间化混音器`，并需要 `模拟一个音频场景`。

![10079-36-register-sound-event-asset-4-spatial-mixer](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-36-register-sound-event-asset-4-spatial-mixer.png)

和播放音频示例一样，最开始我们还是需要先创建一个 PHASE 引擎实例，然后注册音频资源，这个例子我们就从这开始说起。首先，和播放音频文件不同，构建空间音频体验需要一个经过 `空间化混音器` 处理过的声音事件资源。

1. 构建一个 `空间管道`，我们可以设置声音碰撞遮挡物发生的几何效果，比如 `直接路径传输`、`早起反射` 和 `后期混响`。
2. 通过 `空间管道` 创建一个 `空间混音器`。
3. 给 `空间混音器` 设置 `距离模型`，`距离模型` 的概念详细可以见上述的 `Concepts -> Mixers -> Spatial mixers` 章节。
4. 通过已注册在引擎内的 `drums` 声音资源创建 `采样节点`，并将其连接到 `空间混音器`。
5. 设置 `采样节点` 的一些基本属性，比如 `播放模式`、`校准模式` 和 `剔除选项`。
6. 通过 `采样节点` 注册一个 `声音事件资源`，并且取名为 `drumEvent`。

具体代码实现如下：

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

有了 `空间化混音器`，我们还需要 `模拟一个音频场景`，一个场景主要包含 `声音源`、`遮挡物` 和 `听者`。

![10079-37-create-a-listener](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-37-create-a-listener.png)

首先我们创建一个 `听者`，设置 `变换` 属性，并加到引擎的根对象或其子对象之一，实现代码如下：

```Swift
// Create a Listener.
let listener = PHASEListener(engine: engine)

// Set the Listener's transform to the origin with no rotation.
listener.transform = matrix_identity_float4x4;

// Attach the Listener to the Engine's Scene Graph via its Root Object.
// This actives the Listener within the simulation.
try engine.rootObject.addChild(listener)
```

![10079-38-create-a-volumetric-source](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-38-create-a-volumetric-source.png)

其次我们需要创建一个 `声音源`，具体步骤如下：

1. 创建一个 `二十面体网格`。
2. 从 `二十面体网格` 创建一个 `形状`。
3. 从 `形状` 创建一个 `体积声音源`，如果有需求的话，这里也可以创建 `点声源`，不是一定要创建 `体积源`。
4. 通过设置 `体积声音源` 的 `变换` 属性，来设置 `声音源` 和 `听者` 之间的位置关系。
5. 将 `体积声音源` 加到引擎的根对象或其子对象之一。

具体代码实现如下：

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

![10079-39-create-an-occluder](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-39-create-an-occluder.png)

然后需要创建一个 `遮挡物`，具体步骤如下：

1. 创建一个箱子形的 `网格`。
2. 从`网格`创建一个 `形状`。
3. 从引擎中预置的材料库中创建一个 `材料`，并将其附加给 `形状`。
4. 从 `形状` 创建一个 `遮挡物`。
5. 通过设置 `遮挡物` 的 `变换` 属性，来设置 `声音源`、`听者` 和 `遮挡物` 三者之间的位置关系。
6. 将 `遮挡物` 加到引擎的根对象或其子对象之一。

具体实现代码如下：

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

![10079-40-create-a-sound-event](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-40-create-a-sound-event.png)

最后，我们需要将 `音频场景` 中的 `声音源`和 `听者` 与 `空间混音器` 相关联，并从注册的 `声音事件资源` 中创建一个 `声音事件` 开始播放，代码实现如下：

```Swift
// Associate the Source and Listener with the Spatial Mixer in the Sound Event.
let mixerParameters = PHASEMixerParameters()
mixerParameters.addSpatialMixerParameters(identifier: spatialMixerDefinition.identifier, source: source, listener: listener)

// Create a Sound Event from the built Sound Event Asset "drumEvent".
let soundEvent = try PHASESoundEvent(engine: engine, assetIdentifier: "drumEvent", mixerParameters: mixerParameters)
```



### Build a behavioral Sound Event

现在，我们完成了一个空间化音频的体验，下面让我们来看下如何构建一个复杂的声音事件。声音事件可以被组织成行为层次结构，用于交互式声音设计。在本节中，我将介绍基于每种类型的声音事件节点创建最终声音事件的过程。在这里，我们将模拟一个穿着嘈杂的 Gore-Tex 夹克的演员在不同类型的表面湿度可变的地形上行走。

![10079-41-third-example](https://gitee.com/jimbabydev/blog-image/raw/master/uPic/10079-41-third-example.png)

1. 首先创建一个带有两个子采样器节点的 `随机节点`，表示在吱吱作响的木板地形上播放略有不同的脚步声。具体代码实现如下：

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

2. 接下来创建一个地形 `开关节点`，并创建第二个 `随机节点` 播放砾石上的随机脚步声，将两个脚步声 `随机节点` 作为地形 `开关节点` 的子节点，使用地形参数来控制开关。具体代码实现如下：

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

3. 接下来创建一个由湿度参数控制的 `混合节点`，并创建溅水的 `随机节点`，将地形 `切换节点` 和溅水 `随机节点` 作为子节点。如果我将湿度参数设置为 0，我只会听到吱吱作响的木头或砾石上干燥的脚步声，这取决于地形。当我将湿度从 0 增加到 1 时，会增加伴随每一步的溅水声的响度，模拟潮湿的地形。具体代码实现如下：

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

4. 最后创建一个 `容器节点`，并创建 Gore-Tex 夹克噪声的 `随机节点`，将上述的湿度 `混合节点` 和 Gore-Tex 夹克噪声的 `随机节点` 作为子节点，这样我们就有了最终的节点层次结构，也就有了演员在场景中行走的完整表示。每次演员迈出一步，我都会听到夹克的褶皱声，以及在吱吱作响的木头或柔软的砾石上的脚步声，具体取决于地形参数。除此之外，根据湿度参数，我会在每个脚步声中或多或少地听到溅水声。具体代码实现如下：

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

### 小结

1. 我们学习了如何播放音频文件，解决了简单播放的问题。
2. 我们学习了如何构建简单而有效的空间音频体验。在这里，我们了解了如何通过 `听者`、`体积声音源` 和 `遮挡物` 来构建虚拟的音频场景。
3. 我们了解了为交互式声音设计构建行为声音事件。在这里，我们学习了如何将 `随机`、`切换`、`混合` 和 `容器` 节点组合在一起以形成分层的交互式声音事件。

至此，我们对 PHASE 的内部工作原理基本有了一个广泛的了解，如果之后你有需求要构建几何感知的音频体验，相信对你会有一定帮助的。



## 总结

最后，我们来总结下本文的大致内容，以及表达下我个人的一些遐想。

1. PHASE 框架的初衷是解决游戏开发中音频需要后期制作，不能和游戏中其他子系统实时交互的痛点。
2. PHASE 给开发者带来 `几何感知` 和 `事件驱动的音频播放` 两大能力，这两大能力可以很好地解决上述问题。
   `几何感知`：
   1. 在 PHASE 中，你可以模拟一个真实音频世界中的场景，场景包含 `声音源`、`遮挡物` 和 `听者`。
   2. `声音源`、`遮挡物` 都可以是几何形状的，同时可以设置声音源的 `距离建模` 和 `方向建模`，设置遮挡物的声学材料属性，以及还可以设置声音碰撞遮挡物发生的几何效果，比如 `直接路径传输`、`早起反射` 和 `后期混响`。
   
   `事件驱动的音频播放`：
   1. 在 PHASE 中，一个 `声音事件节点` 可以由多个子节点组成，是一个树状的结构，这些节点可以是 `生成器节点` 或者 `控制节点`。
   2. `生成器节点` 负责连接 `音频资源` 和 `混音器` 产生 `声音事件资源` 的最基本单位，`控制节点` 负责掌握整个程序的逻辑，它可以 `随机节点`、`切换节点`、`混合节点` 和 `容器节点` 中的一者，这些可以让我们随意表达一个复杂的 `事件驱动的音频播放` 了。
3. 除了解决游戏创作的痛点外，我有些个人的遐想。因为 PHASE 有了完整模拟真实音频场景的能力，所以个人认为对产品的音频体验和音频内容的丰富都会有很好的帮助。比如 VR 和 PHASE 的结合是否可以给用户带来更好的的虚拟世界，音频产品是否可以模拟出更真实的音频享受空间，让用户更沉浸地在某个场景下享受音频内容。

另外，本人也是第一次接触到几何感知的音频知识，部分地方理解不当还希望大家多多指教。
