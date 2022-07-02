---
session_ids: [110349]

---

# Session 110349/348 Swift Playground 指北

> 作者信息：
> 
> [PJHubs（PJ）](https://github.com/windstormeye)：WWDC19 Scholarship Winner，独立开发者，就职于字节跳动。
> 
> [Cyanichord（Cyan）](https://github.com/Mintshec)：WWDC22 Swift Student Challenge Winner，海外留学中。
> 
> 导读：
> 
> * 背景。Playground 在 Apple 各个平台下的产品形态及主要发展历史。
> 
> * 应用场景。Playground 目前主流的使用场景。
> 
> * Highlight。Swift Playgrounds app 最新版本中的特性。
> 
> * 实战。通过一个游戏场景写一份更加现代化的 Playground。
> 
> * 分发。如何把写好的 Playground 分发到互联网。
> 
> * 总结与展望。站在作者的角度对未来的 Swift Playgrounds app 做了总结。

## 背景

Playground 这种无需构建完整 app 工程就可用 AppKit、UIKit 等强依赖模拟器的能力最早跟随于 Xcode 6 和 Swift 1.0 一起出现，因其快速简洁的使用体验而赚取了一波热度，但因集成在 Xcode 中且调试过程相对繁琐，起初局限于做些小 demo 或测试语法等场景，并没有引起太大反响。直到 WWDC18 带来了全新的 CreateML framework，Xcode Playground 支持基础模型训练的能力后，Xcode Playground 才重新回到开发者视野中。

Apple 在 WWDC16 推出了 Swift Playgrounds app，iPad 用户可以在 iPad 上通过创建`.playgroundbook`工程来编写、调试并运行完整的 Swift 代码，但同样因为 Playground 本身的功能限制导致在 iPad 上写代码的体验依旧别扭，热情退去后 Swift Playgrounds app 又基本消失了。从 2017 年开始，WWDC Scholarship（现已改为 Swift Student Challenge）要求从以往提交一个完整的 app 变为了提交一份可以在 Mac Xcode 或 iPad Swift Playgrounds app 上运行的 Playground 工程后，Swift Playgrounds app 才算是真真正正的进入到开发者圈子中。

若开发者想要写一份运行在 iPad Swift Playgrounds app 上且流程清晰、体验流程的 Playground，需要基于 Apple 提供的 [Swift Playgrounds Template](https://developer.apple.com/download/all/?q=template) 工程做二次开发，并不断的通过 AirDrop 或 iCloud 转存其生成的`.playgroundbook`文件到 iPad 上进行效果验证，十分麻烦。PJ 当初的[奖学金项目](https://github.com/windstormeye/WWDC19_brocadeOfLiNationality)因时间太短，为缩减调试过程耗费的时间果断采用了 Xcode Playground 构建一份`.playground`文件完成。

Swift Playgrounds app 3.2 版本推出后，带来了 macOS 版本的 Swift Playgrounds app，开发者终于可以在 Mac 上验证 Playground 效果了！体验与 iPad Swift Playgrounds app 完全一致。Cyan 在参加 WWDC22 Swift Student Challenge 时，Swift Playgrounds app 已经来到了 4.1 版本，比赛的项目要求修改为，提交一份可运行在 Mac 或 iPad Swift Playgrounds app 上并以 SwiftUI 为主的 `.swiftpm` 工程。

截止到目前为止（2022.06），不管是 Mac Swift Playgrounds app 还是 iPad Swift Playgrounds app，我们一直都认为这才是 AppleOS 最佳开发入门平台，初学者可以完全不用处理开发者账号、App 签名和模拟器环境与 iOS / iPadOS / macOS 的不同等等这些一开始就十分令人困惑的问题，只需专注语言和效果本身。这点也在 PJ 之前的[《 iOS 开发入门 - 独立开发者的成长方案》](https://www.bilibili.com/video/BV1934y1V7B5)分享中有所体现，整体效果非常不错。

为方便大家理解，我们对“Playground”相关的名词做些说明：
* `.playground`：集成在 Xcode 中的 Playground 工程文件。
* `.playgroundbook`：伴随着 Swift Playgrounds app 1.0 推出的全新 Playground 电子书工程文件（经典“小怪兽吃宝石” Playground 就是用的这个），iPad Swift Playgrounds app 创建的“Playground”模板工程文件名。
* `.swiftpm`：伴随着 Swift Playgrounds app 4.0 版本推出的全新 app 类型工程文件。
* Playground：一份独立完整可运行可分发的 Playground，包括`.playgroundbook`、`.playground`和`.swiftpm`在内的三种工程文件。
* Swift Playgrounds app：Mac Swift Playgrounds app 和 iPad Swift Playgrounds app 的统称。
* Playgrounds app：同上，Swift Playgrounds app 的简称。
* Swift Playgrounds：包含以上名词的一整套完整生态链。

下图为 Swift Playgrounds 的生态发展历程（Xcode Playground 不算其中）。

![](./images/0.png)

## 应用场景

同样到目前为止（2022.06），在 PJ 个人所接触的群体中，除了前两年比较火的[小学生 Vita 君](https://space.bilibili.com/456606920/channel/seriesdetail?sid=327507)通过使用 Swift Playgrounds app “教你学编程”火了一把以及打破 WWDC Scholarship 最小获奖年龄（9 岁）的 [Yuma](https://www.youtube.com/c/AnyoneCanCode)外，能够真正的把 Swift Playgrounds 带出圈的开发者真的少之又少，但每年的 WWDC Scholarship repos 却经常可以冒出非常多令人眼前一亮的新鲜创意，它们大都集中在以下范围：

- 交互式/创新性编程体验
  - Apple 官方出品 Playground（质量极高）
  - [Pegboard](https://github.com/JustinFincher/WWDC2022-SwiftUINodeEditor)（[Video](https://www.youtube.com/watch?v=B6D3y49WOEQ)）
- 学科知识讲解
  - [Genetics Lab](https://github.com/soulwinter/WWDC22-Genetics-Lab)（[Video](https://www.youtube.com/watch?v=-1Vt5Ta_dYw)）
  - [Audioqe](https://github.com/MAJKFL/Audioqe-WWDC22)（[Video](https://www.youtube.com/watch?v=TnayjRjrYp8)）
  - [Build With Math](https://github.com/FuzzyNat26/build-with-math)
- App 式工具
  - [Split!](https://github.com/hugoqnc/Split)

以上所列作品可以看出 Apple 和开发者们对 Playground 都做了一定诠释。如果单纯的写一个 App 并处理一些交互式讲解，开发者需要处理太多上下文逻辑，其中最关键的是提供一个原生的“可编程环境”，这一点基本上就拒绝掉绝大多数开发者。

同时，PJ 觉得“授人以渔”才是最终的教育方式。通过视频从头到尾讲一遍或者写一篇文章从头到尾说一遍怎么写代码，在新手期的时候可能很有帮助，能够快速入门，但时间长了以后不光是作者包括读者本身也会深陷其中，很难拿到其中适合自己部分的内容。而通过一个流程设计精美的 Playground 是可以解决这个问题的，直接暴露给学习者最核心的逻辑代码并提供可控的交互范围，屏蔽掉大量的 UI 搭建过程和胶水逻辑。

## Highlight

在正式进入 demo 环节之前我们先来看看目前最新版 Swift Playgrounds app 4.1（下文统一使用 4.x 代替版本）中都有哪些新鲜东西。

### 权限管理

这一点非常重要！此前 PJ 想过使用 Swift Playgrounds app 做一些教程向的事情，准备先拿 MapKit 入手做一个简单的“罗盘”演示，但第一步就直接劝退了。做过 iOS / iPadOS 开发的小伙伴们都知道想要获取当前用户地理位置需要在`info.plist`文件中手动写明申请的权限，但在 Swift Playgrounds app 中如果不借助 [Swift Playgrounds Template](https://developer.apple.com/download/all/?q=template) 模板工程你就是无法找到入口去做这件事，但有些权限你又可以自动获得而不用手动申请（如访问相册资源），这种权限管理在当时（2019 年）看来十分劝退。

在 Swift Playgrounds app 4.x 推出后带来了完整的权限管理，再做这件事就非常容易了，获取用户当前位置的整套流程也变得比直接使用 Xcode 直观且方便了很多，可以一眼看完具体有哪些权限可供开发者使用！其它权限申请流程与下图类似，不再赘述。

| “获取当前用户位置”权限        |                     |
| ------------------- | ------------------- |
| 1、找到想要的权限           | 2、填写权限申请描述          |
| ![](./images/1.png) | ![](./images/2.png) |
| 3、成功弹出权限申请框         | 4、展示用户地理位置          |
| ![](./images/3.png) | ![](./images/4.png) |

### Swift Package Manager

是的，Swift Playgrounds app 支持完整 SPM 引入第三方库！在 4.x 之前的版本中想要使用第三方库只能拷贝一份。4.x 版本支持 SPM 后我们可以尽情的在 Playground 中调用你所熟悉的框架，尽情挥洒你的创意，需要注意的是拉取配置信息环境耗时较长。

![](./images/5.png)

### 模拟 App 环境

在 4.x 版本以前，我们只通过`import PlaygroundSupport`手动的设置承载 UI 可视容器的`liveView`宽高，无法自动适配屏幕宽高也无法模拟安装进 macOS 或 ipadOS 中的环境，4.x 版本后我们可以通过 Swift Playgrounds app 直接安装 app 到 mac 中。在 iPad Swift Playgrounds app 不允许单独安装一个 App，但可以直接通过“Run on My iPad”的方式全屏预览，可以等同为完整运行一个 App。

|                                              |                     |                     |
| -------------------------------------------- | ------------------- | ------------------- |
| 1、左上角区域“App Settings”->“Install on this Mac” | 2、安装至本机应用程序目录下      | 3、点击运行 App          |
| ![](./images/6.png)                          | ![](./images/7.png) | ![](./images/8.png) |

如果你使用 iPad Swift Playgrounds app 可以获得同一份代码分别在 iOS 和 iPadOS 的预览效果，更进一步，使用上 Mac Catalyst 能力后基本上可以等同三端都可在 iPad Swift Playgrounds app 上完成核心能力开发。

|                               |                      |
| ----------------------------- | -------------------- |
| iOS（编辑状态下 preview，约等于 iOS 布局） | iPadOS（全屏预览或运行）      |
| ![](./images/9.png)           | ![](./images/10.png) |

### 需要一台 mac

如果你想好好的写一份 Playground 贡献给社区、贡献给广大的 iPad 用户，不管是 4.x 版本之前的`.playgroundbook`还是 4.x 现在改为`.swiftpm`文件来组织内容，你一定得先拥有一台 Mac 用于制作并调整工程细节。更进一步，如果想要做到下文 demo 中的各种“引导”效果，需要利用一部分 Playgrounds app 内置的 Swift DocC 能力和 Swift Playgrounds markup 语法，而 Playgrounds app 无法很好的支持，需要借用 Xcode 环境来完善 Playground。

如，同一份代码在 Xcode 和 Swift Playgrounds（Mac 和 iPad）app 中打开的展示效果如下图所示。在 Swift Playgrounds app 中被隐藏的注释就是下文要展开 4.x 中新增的 Tutorial（下文统称“指南”）能力，交互体验非常棒！

|                      |                               |
| -------------------- | ----------------------------- |
| Xcode                | Swift Playgrounds（mac & iPad） |
| ![](./images/11.png) | ![](./images/12.png)          |

### Swift DocC

Swift Playgrounds app 4.x 的“指南”部分使用了 Swift DocC 能力替换了原先基于 [Swift Playgrounds Template](https://developer.apple.com/download/all/?q=template) 工程进行二次开发的方式，基本上可以认为 Playground 在 Swift DocC 基础上做了些二次封装，同时也正是用上了 DocC 的能力，屏蔽掉了大量重复繁杂的 UI 细节，让 Playgrounds app 的教学味道变得更强，提供更多引导能力，转变开发者编写 Playground 的想法。

2019 年伴随着 SwiftUI 一同推出惊艳四方的 [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui) 本质上也是通过 Swift DocC 完成。导出的`.doccarchive`文件托管至 web 服务器上，其中新增的`@Step`标签可以自动比对两个文件中的不同之处，并自动高亮，这样在不同的 step 之间通过关联的`@Image`和`@Code`可以在交互上骗过学习者，以为自己就是通过浏览器在学习整个工程，而`.doccarchive`文件内为`xcodebuild docbuild`自动生成的 web 模板资源 & 代码打包合集，可以拿到这个文件进行框架的学习，关于 Swift DocC 可以自行查阅 WWDC22 或往年 Session。

### 不要气馁

Swift Playgrounds app 偶尔会无法快速响应你在 Xcode 中对`.swiftpm`文件的修改，多尝试几遍重启 Swift Playgrounds app 触发其完整的刷新。

## 实战

以下 demo 只讲述 Swift Playgrounds app 4.x 新增的“App”模板，并利用“指南”能力做一份更加现代化的 Playground，“Playground”模板因推出时间较早且与 Xcode Playground 十分相似，网络上已有大量的内容去讲述怎么使用，本文不再赘述。

受文章篇幅的原因，我们也不会展开 demo 的每一步如何实现，而是通过讲解 demo 中都用上哪些交互式标签，关于这些交互式标签大家可以在 [Interactive Tutorials](https://developer.apple.com/documentation/docc/tutorial-syntax) 中找到更多细节。为了保证整体流畅性，我们将使用 Xcode Swift Playgrounds “App 模板”工程进行开发，并使用 Mac Swift Playgrounds app 验证 Playground 效果。

### 工程差异

使用 Swift Playgrounds app 创建一个 App 模板工程只能添加 Swift 和图片等资源文件，但如果通过 Xcode 新建一个 Swift Playgrounds app 模板工程，则与普通 App 工程无太大差异，可以随意添加我们想要增加的内容。

当然了如果你头铁就是不想要 Xcode 提供的完整开发体验去写一份 Playground，可以通过“打开包内容”自行把想要的文件都拖进去，并通过修改 Package.swift 文件来组织对应文件关系来“曲线救国”。通过包内容中出现的 Package.swift 文件可以看出是通过 Swift Package Manager 进行管理的，但该文件是被隐藏的且文件开头的注释不建议开发者自行修改其内容，关于 Package.swift 文件中新增的 .iOSApplication 类型大家感兴趣可自行搜索，因文章篇幅关系不做展开。

|                                     |                                                            |
| ----------------------------------- | ---------------------------------------------------------- |
| Xcode 新建 Swift Playgrounds App 模板工程 | iPad / Mac 上的 Swift Playgrounds 中添加的文件类型有限。图片、Swift 文件、文件夹 |
| ![](./images/13.png)                | ![](./images/14.png)                                       |

### 工程配置

如果我们按照 [Create engaging content for Swift Playgrounds](https://developer.apple.com/wwdc22/110349) 中的步骤一步步来改造现有 Playground 为它添加上“指南”，你会发现 Playgrounds app 打开工程文件后无法进行预览，但可以触发对 .tutorial 文件的识别，对比了官方几个 Playground 并多次实验后得出结论，出现这个原因是工程中缺少了几个关键文件。

Playgrounds app 对“指南”**入口的展示**依赖是否创建了 Guide  文件夹。而“指南”中**内容的展示**依赖是否在 Guide 文件夹中添加了 Resources 文件夹和本地化语言文件`.lproj`，一个最小集可运行带有“指南”能力的 Playground 文件树如下所示。

```shell
.
├── App # 命名随意
│   ├── ContentView.swift
│   └── MyApp.swift
├── Guide # 不可改
│   ├── Guide.tutorial # 命名随意
│   └── Resources # 不可改
│       └── en.lproj # 可为空文件夹，本地化配置有任意一个语言均可
└── Package.swift
```

注意：除了 Guide 和 Resources 文件名不可修改外，`.tutorial`文件命名随意。Guide 文件夹、Resources 文件夹、`.tutorial`和`.lproj`文件四者缺一不可，“指南”必须通过本地化文件`.lproj`进行展示，但经过实测如果你并不想支持多语言只需创建一门语言的空文件夹即可。这部分内容是 Apple 在 Session 和公开文档资料中没有阐述的，如果你缺少了任何一项，Playground 打开工程后会出现下图所示异常。

![](./images/16.png)

如果你的“指南”文件中标签内容有缺失，使用 Playgrounds app 打开工程将会导致 Playgrounds app 直接闪退，十分恼火。

```
❌
@WelcomeMessage(title: "标题") {
    <!-- 没有填写任何内容 -->
}

✅
@WelcomeMessage(title: "标题") {
    把需要的内容补齐
}
```

因为上文中我们已经新增了文件和文件夹，导致工程整体目录结构被修改，通过 Playgrounds app 打开工程会看到一个警告，提示我们新增的文件未加入到对应的模块中。

![](./images/17.png)

想要解决这个问题需要做一些 Apple “并不推荐的事情”。上文已说明，每一个 Swift Playgrounds app 都是基于 Swift Package Manager 进行管理的，Apple 并不推荐开发者自行修改 Package.swift 中的内容，但截止到本文写作时只能通过手动修改的方式解决这个问题，警告中所提示的问题还影响了“指南”最终交互式标签的响应，因为我们并没有把`.tutorial`文件添加到对应模块中，导致`.tutorial`文件关联不到对应的 swift 文件以至于无法执行跳转。

在 Mac 上右键打开`.swiftpm`文件，调整 Package.swift 中“AppModule”模块的路径为“App”。

```swift
// ...
targets: [
    .executableTarget(
        name: "AppModule",
        path: "App" // 默认是当前路径 "."
    )
]
// ...
```

### UI 标签

Swift Playgrounds app 的“指南”是由 Swift DocC 提供支持的一系列标签组成，以下代码是完成 Playground “指南”功能页面 UI 展示的最小集。

```swift
@GuideBook(title: "能否关个灯？", icon: "", background: "", firstFile: "") {
    @Guide {
        @Step(title: "游戏基础逻辑") {
            @ContentAndMedia {
                ![](homePange_banner.png)  

                小朋友你好呀！这是使用 Swift 进行游戏开发的第一份教程。

                在这篇教程中，我们将一起完成一个关灯小游戏，总共有三步，每一步都需要发挥你的聪明才智解决问题，快快学起来吧！
            }
        }
    }
}
```

`@GuideBook`

- 每一个“指南”文件父节点标签。
- `icon`和`background`字段可为空，但官方的 Playground 都给了相同值。
- `firstFile`为在欢迎界面上点击“了解更多”后跳转到“指南”时搭配出现的 Swift 文件。

`@Guide`

- 每一个`@GuideBook`标签下至少挂载一个`@Guide`标签。

`@Step`

- 可以理解为一份“指南”下的不同场景/关卡。
- 可以创建无数个`@Step`。

`@ContentAndMedia`

- 每一个`@Step`下的简介标签。
- 支持通过 markdown 语法添加图片和外链接等资源。

![](./images/18.png)

如果你的 Playground 非常简单，仅告诉学习者做的是什么，不需要操作代码并理解其中的逻辑，简单的做到这里也就足够了。但如果你想要做到一些交互性非常强的引导，想要学习者有顺序的去理解 Playground 中的内容，我们还需要学习一些新标签的使用。

`@WelcomMessage`

- 在未通过右上角进入“指南”功能前，打开 Playground 就给学习者一个欢迎提示，引导学习者前往“指南”进行学习。
- 点击“Learn More” / “查看更多”直接跳转到“指南。

![](./images/19.png)

```swift
@GuideBook(title: "能否关个灯？", icon: "", background: "", firstFile: "") {
    @WelcomeMessage(title: "能否关个灯？") {
        在这个教程中，你将学会如何使用 Swift 和 SwiftUI 进行简单的游戏开发。
    }
    // ...
}
```

`@GuideButton`

- 快速进入到第一个任务的开始。
- 除了文本内容外，其它内容均不可修改。

![](./images/20.png)

`@Page`

- “指南”中的最小集可交互标签。
- 展示在页面顶部。
- 标题前面所带的红色形象 icon 不可修改。

![](./images/21.png)

`@Task`

- 每一个`@Task`标签可以包含众多`@Page`标签。
- 每一个`@Page`标签可以定位到不同 Swift 文件中的不同位置代码，定位代码的能力通过 playground markup 实现。
- 分为两种类型：
  - `addCode`：插入/修改代码类型任务，必须把需要的代码插入并校验通过后才可进行下一步。
  - `walkthrough`：演示类型任务，看完即可下一步。
- 两种类型的任务前面所带的 icon 均不可修改。

![](./images/22.png)

`@TaskGroup`

- 不允许包含`@SuccessMessage`标签。
- 把相同要求取向的`@Task`囊括在一起。
- 只可修改标题内容。

![](./images/23.png)

只通过一些标签去搭建整个“指南”的内容还是显得有些生硬，搭配`@Page`标签支持对所需代码的高亮展示，不同的页面之间通过高亮不同区域的代码来映射引导内容，对于学习者来说这种“一个萝卜一个坑”是最是适合不过了。

如下图所示高亮效果，我们需要先在`@Page`标签中指明对应的 Swift 文件中的位置 id，并在对应的 Swift 文件代码前后插入一对高亮 markup 语法标签注释对儿。

![](./images/24.png)

```swift
// Guide.tutorial file
@Task(type: walkthrough, title: "没有灯泡？创建一个！", id: "LightBasicUITask", file: LightBasicUI.swift) {
    学习如何创建出一个灯泡
    // ...
    @Page(id: "2.second", title: "") {
        我们使用 `Circle()` 来创建一盏灯
    }
}
```

```swift
// LightBasicUI.swif file
import SwiftUI
struct LightBasicUI: View {
    var body: some View {
        /*#-code-walkthrough(2.second)*/
        Circle()
        /*#-code-walkthrough(2.second)*/
            .foregroundColor(.black)
    }
}
// ...
```

每一个`@Task`标签通过`file`字段关联在具体的 Swift 文件，`@Page`标签的 id 字段关联一对注释对儿`/*#-code-walkthrough(2.second)*/`，注释对儿前后包裹起来的内容就是被高亮的代码区域。

如果你的`@Task`类型是 walkthrough，则 cell 开头会默认带上一个红色形象，`addCode`类型则是绿色形象。`addCode`类型的任务比较特殊，如果学习者没有完成需要输入的内容则无法进行下一步。连续两个`addCode`类型任务，上一个`addCode`类型任务没有完成下一个`addCode`任务会无法进行，表现上就会出现下图黑框中所示无法点击的状态。如果是`addCode`类型任务紧接着`walkthrough`类型任务，UI 上并不会有所表现但依旧无法进行到下一步。

![](./images/25.png)

开发者想要识别学习者在 addCode 类型任务中是否输入了对应正确的内容，需要做一些“骚操作”。这部分校验输入代码的能力截止到本文写作时仅在 Get Started with Apps 和 Keep Going With Apps 两份官方出品的 Playground 中有所表现。

### 校验输入

官方所采用的是未经公开的 API，多了 `Assessment` 和 `Connection` 两个 Swift `文件，Assessment` 文件中暴露出了一个 Swift 同名方法供 Playground 调用，实践证明当对应的文件内容发生变化时就会调用该方法，并给到当前发生改动关联的所有`@Task`任务 id，开发者可以在这个方法中做一些判断，比如通过遍历当前页面视图集合判断其中是否有符合要求的视图，如果有则返回 `true`，通过闭包返回当前`addCode`类型任务学习者已完成，可以进行下一步。

```swift
// Assessment.swift file
import Foundation

let taskFunctionByID = ["changeText": changeText,
                        // 所有 addCode 任务 id 对应的判断函数
                        ]

@_cdecl("Assessment") public dynamic func Assessment(_ payload: [String: Any],
                                                     _ completion: @escaping ([String: Any]?, NSError?) -> Void) -> Void {
    // payload 记录了当前发生改动代码行数前后的任务 id
    if let taskIDData = payload["TaskID"] as? Data,
       let taskID = String(data: taskIDData, encoding: .utf8) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            var completed = false
            if let taskFunction = taskFunctionByID[taskID] {
                completed = taskFunction()
            }
            // ...
            completion([taskID: Data(completed.description.utf8)], nil)
        }
    }
}
```

```swift
// Connection.swift file
func changeText() -> Bool {
    return UIElement.elements.contains(where: {$0.traits.contains(.staticText) && $0.label != "Hello, friend."})
}
func textElement() -> Bool {
    return UIElement.elements.compactMap({($0.traits.contains(.staticText)) ? $0 : nil}).count > 1
}
// ...
```

在 demo 中我们也按照这两份 Playground 所提供的思路进行`addCode`类型任务输入内容的校验功能编写。首先需要修改 Package.swift 内容，把 Playground 依赖 Guide module，下面都是照着官方的 Playground Package.swift 内容搬运而来，基本上没有太多的差异。

```swift
// ...
let package = Package(
    name: "LightGame",
    // 指定默认语言，如果工程中只有一份 lproj，注意要对齐
    defaultLocalization: "en",
    // ...
    targets: [
        .executableTarget(
            name: "AppModule",
            // 添加依赖
            dependencies: ["Guide"],
            path: "App"
        ),
        .target(
            name: "Guide",
            path: "Guide",
            resources: [
            // 添加上 Guide 文件夹下需要被使用的资源文件
            .process("Guide.tutorial"),
            .process("Resources/homePange_banner.png"),
            ]
        )
    ]
)
```

创建出一个 Assessment.swift 文件，打开 Get Started with Apps 或 Keep Going With Apps，搬运结构体`UIElement`的实现，其实现基于`UIAccessibilityTraits`和`UIAccessibilityContainerType`来获取页面元素的信息描述，如 demo 中需要校验用户是否把灯的大小调整为 50x50，我们可以这么写判断函数。

```swift
// Assessment.swift
func changeLightSize() -> Bool {
    return UIElement.elements.contains(where: {
        print("当前元素 frame：\($0.frame.size.width)x\($0.frame.size.height)")
        return $0.frame.size.width == 50 && $0.frame.size.height == 50
    })
}
```

再创建一个 Connection.swift 文件，继续搬运代码。

```swift
import Foundation
// 写好 id 和检测函数的映射关系
let taskFunctionByID = ["changeLightSize": changeLightSize]
@_cdecl("Assessment") public dynamic func Assessment(_ payload: [String: Any],
                                                     _ completion: @escaping ([String: Any]?, NSError?) -> Void) -> Void {
    print(payload)
    if let taskIDData = payload["TaskID"] as? Data,
       let taskID = String(data: taskIDData, encoding: .utf8) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            var completed = false
            if let taskFunction = taskFunctionByID[taskID] {
                completed = taskFunction()
            } else {
                print("Error: Assessment function for taskID '\(taskID)' not found.")
            }
            completion([taskID: Data(completed.description.utf8)], nil)
        }
    }
}
```

这样我们就完成了当每次文件发生改动时都会拿到一次处理回调，现在回到代码中继续编写逻辑。我们需要引入一个全新的注释`//#-learning-task(changeLightSize)`，该注释必须关联`addCode`类型的`@Task`标签，如果该任务下某个`@Page`开启了`isAddable`能力，则可以自动插入代码替换掉注释所在位置。

```swift
// LightBasicUI.swift
import SwiftUI
/*#-code-walkthrough(1.first)*/
struct LightBasicUI: View {
    var body: some View {
        // ...
        Circle()
        // ...
            .foregroundColor(.yellow)
        //#-learning-task(changeLightSize)
    }
}
// ...
```

```swift
// Guide.tutorial
@Task(type: addCode, title: "调整灯的大小", id: "ahaLightSize", file: LightBasicUI.swift) {
    @Page(id: "lightTips", title: "") {
        灯现在全填充整个屏幕，太大了，屏幕都快装不下了！！！
    }
    @Page(id: "lightSizeChangeCode", title: "", isAddable: true) {
        我们来把它调整为 50 宽高的大小吧！灯的大小可以通过 `.frame` 来控制，把它加入到 `.foregroundColor` 下面吧，它看起来应该像这样。
        ```
        .frame(width: 50, height: 50, alignment: .center)
        ```
    }
}
@SuccessMessage(message: "") { 
    🎉 你可真行啊！灯泡颜色和大小都被你改好了，下一步我们一起来看看游戏棋盘是如何搭建的吧
}
```

重新打开我们的工程后就会看到在对应任务 page 下的代码插入提示了。点击“添加” playground 会自动插入该代码，而要插入的代码就是我们标记为`isAddable: true`的`@Page`标签所关联的代码块。

![](./images/26.png)

![](./images/27.png)

当学习者编写的代码被检测到回调到 Connection 文件中相关判断函数返回`true`后，当前任务即通过，我们可以使用`@SuccessMessage`标签弹出一个恭喜界面，并顺势引导到下一个任务中。

![](./images/28.png)

此时下一个任务也被点亮了。

![](./images/29.png)

一般情况下，学习者完成了某一项任务后是没有入口回退到任务初始状态的，整个 Playground 生命周期都会一直保持该 ✅ 通过状态，这对开发者调试 Playground 时非常不友好，我们可以增加或删除`.tutorial`文件中对应任务的`@Page`标签个数，触发 Playgrounds app 刷新该任务。

### 词汇表

如果开发者所编写的 Playground 涉及到较多需要额外说明的词汇，比如 demo 中需要先介绍一遍游戏规则，但又不想占用太多篇幅，可以通过链接词汇表的方式完成，如下图所示。

![](./images/30.png)

想要做到这种效果需要我们在本地化语言文件夹中新增一个`Glossary.plist`配置文件，并在其中写下对应的 k-v 对，在`.tutorial`文件中使用 markdown 语法标记需要跳转的文本内容即可，如果 key 中带有空格需要使用`%20`来代替，这是 ASCII 编码中的空格符号。

![](./images/31.png)

```swift
// ...
@ContentAndMedia {
    // ...
    在这篇教程中，我们将一起完成一个[关灯小游戏](glossary://gameRulo)，总共有三步，每一步都需要发挥你的聪明才智解决问题，快快学起来吧！
    // ...
}
// ...
```

## 分发

经过缜密的设计和开发调试，你的 Playground 已经从一张白纸变成了一款栩栩如生的 Playground App，是时候把它分享给更多人一起体验了。最简单的方法自然是把 Playground 文件直接分享给他人，但是无论是通过 AirDrop 还是其他第三方 App，分享和导入的过程都过于复杂。并且，如果后续 Playground 有了更新，不能及时地体验到新功能对学习者也是极大的损失。

最理想的 Playground 分发形式便是像 Mac 一样开盖即用并随时保持更新。Apple 早在 WWDC18 中就已提出以 Subscription 形式分发 Playground 的方法，Playground Subscription（以下省略为 “Subscription”） 和 Podcast（播客）相同，以 feed 形式存在，是一系列按顺序排列的内容，允许学习者选择列表中的一个或多个 Playground 进行下载并学习。

也就是说，任何拥有 Subscription 链接的学习者都可以一键订阅 Playground 并在有可用更新时得到通知。尽管 Playground 模板的内容已进行了数次更新，但 Playground 开发者仅需修改文件结构，便可创建新版本的 Subscription。

Cyan 通过设计并编写 TuerYeCloisonne Playground 项目荣获了 WWDC22 Swift Student Challenge 优胜者。该 Playground 以拼图和填色游戏的形式，引导学习者亲手体验以景泰蓝这一传统手工艺的形式完成一个兔儿爷的形象的流程，感受两种非遗结合在一起所带来的独特之美。本部分将以此 Playground 为例讲解如何发布一个 Playground Subscription。

| Cyan's WWDC22 Swift Student Challenge Playground |                      |                      |                      |
| ------------------------------------------------ | -------------------- | -------------------- | -------------------- |
| ![](./images/32.png)                             | ![](./images/33.png) | ![](./images/34.png) | ![](./images/35.png) |

为了让所有人都可以使用 Subscription 链接，需要完成三部分工作，分别是创建网络主机、创建和发布 Subscription。前者需要按照给定格式编写对应的`feed.json`文件，后者需要将包含 Playground 文件、元数据、图像和 feed 发布到网络主机上以供学习者下载。

### 创建网络主机

理论上你可以使用任何形式的网络主机，本文以 GitHub Page 为例。首先在 GitHub 上注册并登录自己的账号，在右上角的入口新建一个新的 Repository。

![](./images/36.png)

Repository 的名称必须与你的 GitHub 用户名一致。Cyan 的用户名是 cyanichord，因此 Repository 的名称是 cyanichord.github.io，之后点击`Create repository`。

![](./images/37.png)

至此，用于发布 Playground Subscription 的网络主机就创建好了，域是 cyanichord.github.io。

![](./images/38.png)

### 创建 Subscription feed

Swift Playgrounds app 中的 feed 结构为 JSON，主要由列表、定义、字符串和数字等原始值组成。受文章篇幅限制，本文不会展示 feed 中能包含的全部信息，而是以一个成品 Playground 为例讲解发布一个 Subscription 的必要信息。要创建一个符合 Swift Playgrounds app 使用的标准 feed 文件，至少需要包含以下键值对：

```json
// feed.json file
{
   "title": "", // Subscription 的名称
   "subtitle": "", // Subscription 的副标题
   "publisherName": "", // Subscription 的发布者，即个人、机构或组织的名称
   "feedIdentifier": "", // 托管 feed 的域的反向 DNS 字符串。例：如果托管 feed 的域是 cyanichord.github.io，那么它的反向 DNS 字符串即为 io.github.cyanichord。
   "contactURL": "", // Subscription 发布者的联系方式
   "formatVersion": "", // feed 版本号设置，当前为 1.0
   "documents": [] // 包含 Subscription 中每一个 Playground 具体信息的集合
}
```

对于`documents`字段中的每一个 Playground 实例配置，至少包含以下内容。

```json
// feed.json file
"documents": [
      {
           "title": "", // Playground 的标题
           "overviewSubtitle": "", // 概览视图中显示的副标题
           "description": "", //  在打开 Subscription 中 Playground 前的详细显示描述
           "contentIdentifier": "", // Playground 的反向 DNS 字符串
           "contentVersion": "", //  Playground 的版本号
           "url": "", //  Playground 压缩包的路径
           "publishedDate": "", // Playground 的发布时间
           "lastUpdatedDate": "", //  最后更新 Playground 的时间
           "thumbnailURL": "", // Playground 封面图片链接，尺寸要求为 902 x 678 像素
           "bannerImageURL": "", // Playground 横幅图像链接，尺寸要求为 1080 x 400 像素
           "additionalInformation": [ // 用于提供元数据的对象集合（详见链接），对于最简单的例子只需要提供 language 的键值即可。
              {
                   "name": "Languages",
                   "value": "English"
              }
          ],
           //"previewImageURLs": [] //  Playground 详细视图的图像的链接，尺寸要求为 800 x 600 像素。本字段用于兼容旧版 Swift Playgrounds app
      }
  ]
```

将 TuerYeCloisonne 项目的信息填入其中，就得到了完整的`feed.json`文件。

```json
// feed.json file
{
   "title": "WWDC22 TuerYeCloisonne",
   "subtitle": "Feel the charm of Tuer Ye and Cloisonne",
   "publisherName": "Cyanichord",
   "feedIdentifier": "io.github.cyanichord",
   "contactURL": "https://cyanichord.github.io",
   "formatVersion": "1.0",
   "documents": [
      {
           "title": "WWDC22 TuerYeCloisonne",
           "overviewSubtitle": "Experience the charm of Tuer Ye and Cloisonne",
           "description": "A simple jigsaw and coloring game.",
           "contentIdentifier": "io.github.cyanichord.tueryecloisonne",
           "contentVersion": "1.0",
           "url": "https://cyanichord.github.io/TuerYeCloisonne/WWDC22_Cyanichord_Cloisonne.swiftpm.zip",
           "publishedDate": "2022-06-25T18:00:00+09:00",
           "lastUpdatedDate": "2022-06-25T18:00:00+09:00",
           "thumbnailURL": "TuerYeCloisonne/thumbnail.png",
           "bannerImageURL": "TuerYeCloisonne/banner.png",
           "additionalInformation": [
              {
                   "name": "Languages",
                   "value": "English"
              }
          ],
           "previewImageURLs": []
      }
  ]
}
```

至此，`feed.json`的内容已经完成。

### 发布 Subscription

在本地终端中使用`git clone`命令把之前创建好的 GitHub Page Repository 克隆到本地。

![](./images/39.png)

为了使`feed.json`中的内容正确的体现在文件结构中，需要将文件夹的结构与文件统一，文件结构应该如下图所示。

```shell
.
├── index.html #用于提供 Subscription 链接
├── YuerYeCloisonne #包含 Subscription 中的 Playground 内容的文件夹
│   ├── WWDC22_Cyanichord_Cloisonne.swiftpm.zip #Playground 文件的压缩包
│   └── thumbnail.png #Playground 的缩略图
│   └── banner.png #Playground 的横幅图片
└── feed.json
```

![](./images/40.png)

![](./images/41.png)

其中，index.html 中的订阅链接格式如下：

- Swift Playgrounds app 通用链接前缀：`https://developer.apple.com/ul/sp0?url=`
- Subscription feed.json 的 URL，本例中为：`https://cyanichord.github.io/feed.json`

完整的链接是如下。

```
https://developer.apple.com/ul/sp0?url=https://cyanichord.github.io/feed.json
```

在网页中插入如下代码。

```html
<a href="https://developer.apple.com/ul/sp0?url=https://cyanichord.github.io/feed.json">TuerYeCloisonne</a>
```

![](./images/42.png)

学习者点击链接之后可以自动跳转到 Playground.app，进行订阅操作。

|                      |                      |
| -------------------- | -------------------- |
| ![](./images/43.png) | ![](./images/43.png) |

现在，Playground 的 Subscription 链接已经成功发布，所有人都可以使用 Subscription 链接来体验你自己编写的 Playground 了。

## 总结与展望

至此，Swift Playgrounds app 4.1 中的新鲜东西都已经说得差不多了，整体看下来虽然到了第四世代已经有了非常多的改善，能够做的东西也非常多，可以供开发者们好好的写一份交互非常棒的 Playground，高亮代码块是最让 PJ 惊喜的地方，解决了调了以往“顺序阅读”的学习方式。addCode 类型的@Task 标签引入更是统一了插入代码和检验输入代码正确性的问题，开发者不用再费劲心思的在代码中埋入隐藏的胶水逻辑代码。

PJ 原本以为 Swift Playgrounds app（4.0 版本之前）不会再推出更多的新鲜东西，纯粹把它作为 Apple 教育大局下一枚棋子去填补空白即可，但没想到在 WWDC21 中直接王炸，继续做出了一件“only Apple can do”的事情，放开了在 iPad 上发布 App 的能力。侧面去想这件事，本身也说明了做一个简单、流程清晰的 App 在 iPad 上完全没问题，这同时也说明了写 App 是一件低年龄段就可以开始做的事情。不经畅想起未来的 Playground 5.x 版本又会加入多少令人陈赞的功能，但以下几点是我们目前觉得 Swift Playgrounds app 还欠缺的地方，希望接下来的版本更新中可以完善这些能力。

### Debug

Swift Playgrounds app 只差最后一步了！选择 Playground 模板工程可以选择“单步断点”模式，但过于鸡肋体验导致几乎都选择使用 Swift Playgrounds Book 的模板工程在 Xcode 中进行开发于 debug，调试完毕后才发布，但选择 App 模板工程你会发现只能 print 大法了。PJ 有一个非常强烈的预感，选择 App 模板后，具备了控制台输出和代码行数标识，下一步 Swift Playgrounds app 一定会加上更好用的 debug 工具。

![](./images/45.png)

### 更便捷的分发方式

除了官方和部分筛选过的第三方 playground 占据了模板列表的绝大部分位置外，如果想要引入其它开发者编写的 playground 就需要先创建一堆索引文件并发布到自建 sever 中，拿着链接才可以进行分发。估计是市场太小，playground 本身能够做的事并不如 Xcode 那般复杂，整体可控导致 Apple 并不想再维护一个官方列表。但时过境迁，现如今 k-12 教育市场已经被洗牌了，PJ 觉得通过 playground 这种寓教于乐的方式去学习不同学科甚至感受不同文化背景的知识是一种全新体验，但求 Apple 能够提供一种更加便捷的 playground 分发方式，能够让我们这些立志于在教育市场做些贡献的开发者们更大量级的分发自己的作品。

### 更完善的标签能力

虽然目前的标签已经足够开发者玩出很多不一样的东西来了，但目前的代码校验方式以及编写方式十分头疼。因为没有代码提示基本上都得翻着官方事例或文档来猜，这件事情很不 Apple，而且 Apple 在 Playground.app 上隐藏了太多的实现细节，一直没有摆出一个海纳百川的姿态去配合开发者，导致越来越没有人愿意通过 Playground 去实现自己的创意。

## 参考链接

[Swift Playgrounds Release Note](https://developer.apple.com/swift-playgrounds/release-notes/)

- 每次版本更新都会放出一些新东西，但更新间隔时间很长，属实是“非必要不更新了”。
- 有一些细节不会在 session 或者 article 中说明，如果没有同步放出相关配套的 Playgrounds app 更新细节可以在这看到。

[WWDC Scholar repos](https://github.com/wwdc)

- 汇集了从 16 年开始到 22 年的所有 WWDC 奖学金项目，其中从 17 年开始转为提交 Playground，可以从 17 年开始逐年观察到优秀的学生开发者们是如何巧妙利用 Swift Playgrounds 搞事情的（玩出花来了！
- 其中有非常多惊喜，PJ 个人 WWDC19 Scholar 项目也从中汲取到了非常多的营养，十分推荐！

WWDC22 - [Build your first App in Swift Playgrounds](https://developer.apple.com/wwdc22/110348)

WWDC22 - [Create engaging content for Swift Playgrounds](https://developer.apple.com/wwdc22/110348)

WWDC18 - [Create Your Own Swift Playgrounds Subscription](https://developer.apple.com/wwdc18/413)

[Create, edit, and execute playgrounds](https://help.apple.com/xcode/mac/10.0/#/dev188e45167)

[Markup Overview](https://developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_markup_formatting_ref/index.html#//apple_ref/doc/uid/TP40016497-CH2-SW1)

[Swift Playgrounds - Creating a subscription](https://developer.apple.com/documentation/swift-playgrounds/creating-a-subscription)

[Swift Playgrounds App 1 - Swift Playgrounds App 项目](https://www.bilibili.com/read/cv16275466)

[Swift Playgrounds App 2 - 引导演示](https://www.bilibili.com/read/cv16276005)

[Swift Playgrounds App 3 - 引导任务](https://www.bilibili.com/read/cv16276267)

[Swift Playgrounds 4 娱乐还是生产力](https://www.fatbobman.com/posts/swiftPlaygrounds4/)

[玩转 Xcode Playground（上）](https://www.fatbobman.com/posts/xcodePlayground1/)

[玩转 Xcode Playground（下）](https://www.fatbobman.com/posts/xcodePlayground2/)