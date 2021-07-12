# WWDC21 10267 一窥 Xcode Cloud

## Xcode Cloud 概览 
Xcode Cloud 是为 Apple 平台开发者所设计的一项易用的集持续集成（Continuous Integration）和持续交付（Continuous Delivery）于一体的服务。

> 持续集成指的是周期性地合并发生变动的代码，这样能尽早地发现问题解决问题，以提高代码质量。

一个典型的持续集成工作流程如下图所示：
![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%201.jpg)
1. 将发生变动的代码推送至远端代码仓库
2. 项目开始构建、运行测试代码和其他自定义步骤
3. 如若通过质量测试（构建成功、测试通过等），保存构建产物，并发出通知至其他团队成员。

再让我们看一下 iOS 应用常见的开发流程：
![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%202.jpg)
1. 修复 Bug 和完成新的需求.
2. 根据团队内部 Code Review 的反馈，对代码作相应的修改.
3. 通过自测后，将应用分发至测试团队手中。
4. 根据测试用户的反馈，及时地修复问题。

高效地运作上图所示流程是构建高质量应用的关键。

嘭! Xcode Cloud 此时闪亮登场！
![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%203.jpg)
在上述持续集成的流程之上，Xcode Cloud 把应用开发、应用测试和应用分发三点连接起来，提供给开发者一条完整的开发流水线：
1. 应用开发
2. 应用测试
3. 应用分发
4. 收集使用反馈
5. 根据反馈，进行快速迭代。

### 立马上手 Xcode Cloud

![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%204%20%E6%96%B0.jpg)

Fruta 是 Apple 用来演示 Xcode Cloud 的 App。在 Xcode 13 本地打开的 Xcode Cloud 控制台页面大致如上图所示，左边侧边栏展示了已完成/正在执行中的工作流，右边则是对多个工作流的总览，从中我们可以粗略了解整个团队开发的进度。

#### 什么是 Xcode Cloud Workflow？
我们可以把 Xcode Cloud 工作流理解成某种配置。Xcode Cloud 会读取该配置的内容，从而明白自己在何时执行何种任务。某个工作流执行的过程称为一次构建。Xcode Cloud 依托于 Apple 自管理的云端基础设施。该基础设施提供代码签名，同时也能帮助开发者访问多种不同版本的操作系统和 Xcode，例如最新版的 macOS Monterey 和 Xcode 13。

![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%205.jpg)

在左侧边栏中点选某个工作流，展现在我们面前的是该工作流单次运行的总览。从这里，我们能看到测试代码运行的结果与相应的日志，甚至可以双击报错处，直接定位到导致出错的某一行代码。

![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%206.jpg)

这些内容可不只是在 Xcode 本地才能看到，也可以在 App Store Connect 网页中获取到，包括开始构建、管理工作流、检阅构建产物、与团队成员共享构建报告和管理通知等。比如，在构建完成后，可以在网页中设置结果通知到 Slack 等交流协作工具，以帮助团队成员在第一时间知道结果。

#### One More Thing...
 Xcode Cloud 不光是团队开发以及协作流程的好帮手，而且 Apple 一贯良好的隐私保护也未曾在它身上缺席，源代码的管理是软件工程中的核心之一。Xcode Cloud 的方方面面均是为保护用户数据而设计的：
* 构建环境的信息过一段时间会被删除
* 从不存储项目源代码
* 构建数据会被加密存储在 CloudKit 数据库中
* 用户可随时随地删除数据，且数据会被从 Xcode Cloud 系统中完全移除

## 为你的工程配置 Xcode Cloud

![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%207.jpg)
 在 Xcode 13 中仅需“几步“操作即可为你的工程配置 Xcode Cloud。

![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%208.jpg)
接着，选中接入 Xcode Cloud 的应用（这里以 Fruta 为例），·

![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%209.jpg)
然后，开始预览一个工作流。工作流最基本的四个要素为：
* 启动的条件
* 构建的环境
* 执行的任务
* 结束后的任务

想要深入了解工作流的编辑过程，请参考 [WWDC21 10268 探索 Xcode Cloud 工作流](https://developer.apple.com/videos/play/wwdc2021/10268/)。

![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%2010.jpg)
然后需要给 Xcode Cloud 授权以获取 Fruta 源代码。授权范围不光光是代码主仓库，也包括名下的子模块以及私有的 Swift Package。

Fruta App 使用到两个托管于 GitHub 上的私有仓库，所以点击「Grant Access」会跳转到 App Store Connect 网页界面。值得一提的是：这个流程取决于工程代码是如何托管的。Xcode Cloud 要求使用 Git 来管理工程代码，且仅支持以下几种源代码管理提供商：
* Bitbucket Cloud 和 Bitbucket Server
* GitHub 和 GitHub 企业版
* GitLab 和自建版本的 GitLab

Xcode Cloud 也支持 Git 大文件存储（Git LFS）。

整个授权过程将 Apple ID 与源代码管理提供商的账号相关联，并使用源代码管理提供商原生的授权方式与 Xcode Cloud 的安全加密，以确保源代码和用户信息处于保护之下。

![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%2012.jpg)
在 App Store Connect 上完成授权后就可以回到 Xcode 本地继续之前的流程。

![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%2014.jpg)
到了最后一步，Xcode Cloud 将会帮助开发者把应用信息注册至 App Store Connect。

## 检阅构建报告
![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%2015%20%E6%96%B0.jpg)
以 Fruta 这次构建为例：从该构建报告中，我们可以清晰明了地知道构建耗时以及构建环境的配置。点击右上角的 `Rebuild` 按钮也能帮助我们重新开始构建。

![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%2016.jpg)
![](https://imagebed-1301918945.cos.ap-shanghai.myqcloud.com/WWDC%2021/%E6%AD%A3%E5%BC%8F/%E6%88%AA%E5%9B%BE%2017.jpg)
在 `Actions` 一列中，点击单个 action，可以看到该次 Action 的日志和相应的产物。这样的设计使得整个团队都能很方便地获取到当前 CI 的信息。

由此可见，借助于 Apple 云基础设施的力量，整个团队的协作效能将大大提高。

## 一点自己的思考
### 鱼儿游于水，却困于水
Xcode Cloud 在 Apple 生态圈中如鱼得水，然而现实是：公司中往往需要搭建一套通用 CI、CD 流程，把 iOS 与 Android 两端统一管理。在这种情况下，第一顺位可能是社区内容更完善的 [Fastlane](https://docs.fastlane.tools/)。Fastlane 对 iOS、Android 和跨平台方案（如 Flutter）均提供不同程度的支持，也能方便地配合 GitLab CI、Jenkins 等一起协同工作。

### 何...何时能开始使用它呢？
WWDC21 上一公布 Xcode Cloud，我就第一时间申请 beta 版测试资格，到现在过去大半个月了，也没拥有测试资格。利用搜索引擎，我也只发现 @PastePalApp 的作者有收到测试资格，他用简单的图文描述了下 Xcode Cloud 的体验（[相关链接](https://twitter.com/onmyway133/status/1404856151058141185)）。

Xcode Cloud 应该会是依托于 Apple 基础设施的云服务，回想起国区 iBooks Store、iTunes Store 的昙花一现，Xcode Cloud 会如期而至吗？

### "那么，古尔丹，代价是什么呢？"
你以为你的项目会像 Fruta 那样点一点就能很顺利地接入 Xcode Cloud 了吗？你错啦！
接入 Xcode Cloud 的前置条件还不少：
* 得使用自 Xcode 10 以来的新版构建系统
* 得使用自动代码签名
* 得使用符合条件的源代码管理服务
* ......

更多详情，请参考 [Xcode Cloud 的使用要求](https://developer.apple.com/documentation/xcode/requirements-for-using-xcode-cloud)。



