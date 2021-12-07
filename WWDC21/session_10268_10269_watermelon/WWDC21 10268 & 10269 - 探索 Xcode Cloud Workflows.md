> 作者：Watermelon，6年 iOS 开发经验，主要负责基础框架设计、SDK 封装及项目交付管理，目前致力于智能汽车 & 手机互联方案设计。
>
> 审核：红纸，iOS 开发，周报编辑，就职于淘系技术部

> 本文基于 [Session 10268](https://developer.apple.com/videos/play/wwdc2021/10268) & [Session 10269](https://developer.apple.com/videos/play/wwdc2021/10269) 梳理

## 本文知识概况
![](https://images.xiaozhuanlan.com/photo/2021/4303d5ba3ea8651ae4ec2dde52e5cc54.jpeg)

今年的 WWDC 21 对于开发者来说 Xcode Cloud 是最具有吸引力的话题之一吧！ 由于小编的 Xcode Cloud Beta 还在申请中，所以本文主要根据官方视频以及文档并结合小编在实际开发中的经验对 WorkFlows 在 Xcode Cloud 的重要性以及如何创建 WorkFlows 的详细介绍和总结。


## 引言


不管是使用哪种语言来开发，相信大家对 CI/CD 工具做持续集成、持续交付和部署工作应该是极为熟悉的。无论是大公司、小公司或个人都会选择一些工具，类似于 Jenkins、Travis CI 等来对自己的项目进行集成、测试、发布等工作，可以说通过一整套的 CI/CD 方法，可以让团队在创造高质量产品的同时，很好地协同工作。


如果读者曾经使用过 fastlane 等工具实现过项目的构建、打包、上传，那会很轻松的理解这一篇的文章介绍的内容。


全文以苹果官方 Fruta 的应用程序举例说明，它已经在 Xcode Cloud 上启动并运行。如何您还不知道什么是 Xcode Cloud，您可以订阅《老司机技术周报》-- [窥探 Xcode Cloud](https://xiaozhuanlan.com/topic/7496513820) 这篇文章，或者直接观看苹果官方视频 [Meet Xcode Cloud](https://developer.apple.com/videos/play/wwdc2021/10267)（[《【WWDC21 10267/10268/10269】窥探 Xcode Cloud》](https://xiaozhuanlan.com/topic/7496513820)）


## 工作流介绍


当我们加入到 Fruta 应用程序时 Xcode 已经为我们创建了一个默认工作流程，用于构建主分支。我们的需求设定是，任何人更新项目时：
​


- 构建，分析、自测和打包该应用程序；
- 在完成提交到该分支后需要通知团队；
- 以便同队成员可以 review 代码进行提测审核。



### 工作流配置

创建工作流很容易，Menu -> Product -> Xcode Cloud -> Manage Workflows -> 单击加号，然后选择我的应用程序。


![image.png](https://images.xiaozhuanlan.com/photo/2021/c46a2c24d9bac488be7fff1f6228c854.png)


确定添加之后，会出现一个新的工作流编辑器。


![image.png](https://images.xiaozhuanlan.com/photo/2021/95eb7ae895d59969f6cc6cd8fa799f50.png)


工作流由多个可配置组件组成，我可以在其中命名我的工作流程，苹果官方 Demo 将其命名为“Pull Requests”。


![image.png](https://images.xiaozhuanlan.com/photo/2021/58edfd1a5caf48d8ae7015b3cc259ebb.png)


如果我们所在的团队人数较少，可以选择限制编辑以防止可能影响团队内部的意外更新。


![image.png](https://images.xiaozhuanlan.com/photo/2021/f8d4a81dab11a271296d29e1223bf727.png)​


默认情况下，Xcode Cloud使用本地设置信息来设置代码仓库和项目信息，但是如果需要指定我们的仓库时可以在这里更改这些设置。


![image.png](https://images.xiaozhuanlan.com/photo/2021/9000147db696d2991f491bf3af08394f.png)


### 启动条件


Start Conditions 是定义 WorkFlows 何时运行的地方。


#### 启动条件配置

Xcode Cloud 有多种条件类型。对本文 Demo 工作流，我们将其启动条件设置为针对所有打算合并到主分支的 “Pull Requests” 请求运行：Start Conditions -> Type -> Every Change to a Pull Request


![image.png](https://images.xiaozhuanlan.com/photo/2021/90dbdd8535fd864276c045353b5b4b2a.png)


这种条件类型允许我指定源分支和目标分支。我将源分支设置为 Any Branch ，将目标分支设置为 main。


![image.png](https://images.xiaozhuanlan.com/photo/2021/6ef9b1f672dc9b97d6e542e4cdfa05a5.png)


现在，每次团队成员针对 main 创建拉取请求并对其进行更改时，Xcode Cloud 都会自动运行此工作流。

其他设置信息：


- 针对特定文件或文件夹的改动
- 并选择设置是否要在工作流运行时自动取消任何以前运行的构建。当我们出现连续地将一个提交推到另一个之上，这事会非常便利的。



当前在构建该项目时，Xcode Cloud 现在会一起构建和测试源分支和目标分支的合并，此时团队成员的任意一次修改都会让其他成员所了解


![image.png](https://images.xiaozhuanlan.com/photo/2021/e99bfcb3239e8420f1f1449e8e14f65e.png)​


#### 其他启动条件类型


对“Pull Requests”的每个更改都只是一个在上面创建的工作流设置的启动条件中，根据团队需要，我们还有其他条件类型提供给我们配置以满足这些需要。


- Every change to a branch：对分支的每次更改将始终构建源分支并忽略任何拉取请求状态；
- Every change to a tag：每当创建新标签时，都会构建对标签的每次更改；
- On a schedule：将在您可以选择的重复计划上构建您选择的分支，如果是偶尔进行长时间运行的测试，这个会很方便；



### 环境配置


Set up Environment  是决定 WorkFlows 如何运行的重要组成部分。

#### 基础配置


![image.png](https://images.xiaozhuanlan.com/photo/2021/93c9e4f7cd577c76170d305598c44bab.png)


1. Xcode Cloud 提供各种 macOS 和 Xcode 版本，还可以将 Workflows 设置为指向最新版本或 Beta 版本，让我们始终可以在最新软件上进行构建或测试。
1. Clean 选项，大多数的实际项目是包含许多文件的大型项目，构建需要很长一段时间。在 Xcode 中我们可以选择通过仅构建已更改的文件来构建本次项目。 Xcode Cloud 中 Clean 操作就是保证我们能更快的构建当前项目
1. 除了 Xcode 提供的现有脚本选项之外，Xcode 还添加了创建自定义脚本的功能，这些脚本在执行构建和测试的设备上运行。这个下面的环节会继续讲解
1. 在这一个配置中，我可以指定 Xcode Cloud 提供给自定义脚本的环境变量。这对于我们不想签入源代码存储库的配置和机密是非常有用的。



到目前为止，就是 Xcode Cloud 如何配置工作流和如何运行以及他们应该在什么环境中运行，那灵活性体现在哪里呢？


#### 环境的高级配置


苹果还提供了使用环境变量将额外的信息传递到构建中，这样就可以在“Environment”中配置所需的任何环境变量，用 key-value 的形式添加即可。**将 API 服务中的不同 URL 传递到测试中。**


![image.png](https://images.xiaozhuanlan.com/photo/2021/39db344c7d74448ba3248f91f932366d.png)


##### 环境变量加密


对于 API Key 或 access token 等敏感信息，您可以配置秘密环境变量。秘密环境变量会得到安全处理并安全存储，并且它们的解密值仅在运行我们操作的临时环境中可用。只需选中环境变量表中的“秘密”复选框即可。


![image.png](https://images.xiaozhuanlan.com/photo/2021/00ddef6145d77d41b6af404c2468676e.png)


更多环境变量可以查看[环境变量参考](https://developer.apple.com/documentation/Xcode/Environment-Variable-Reference)。其他更高级的配置，会在文章最后一节进行介绍。
接下来详细介绍一下 Actions。


## 工作流操作


这个部分内容实际上就是将 Xcode 在本地执行的相关操作现在都可以在 Xcode Cloud 中使用：构建、运行静态分析、测试、和存档，与 Xcode Cloud中对应的 Actions 一一对应，在此次Demo中，会依次展示以下操作：


![image.png](https://images.xiaozhuanlan.com/photo/2021/a00212d72d57d3d61d17a49674bb0595.png)


### 存档


首先在工作流编辑页面的 Actions 目录中，单击操作旁边的加号图标并选择存档来添加存档操作。默认选择了 iOS 平台和 iOS 方案。


![image.png](https://images.xiaozhuanlan.com/photo/2021/b15ff9e046bf597987a0775a499f8e0e.png)


（我还可以选择注册TestFlight 或使其为 App Store 分发做好准备，但稍后会详细自动部署）


读者是否已经注意到，我们没有管理证书和描述文件。当我们登陆了开发者账号时Xcode Cloud 已经自动为我们关联了。要了解更多相关信息，请查看 [Session 10204](https://developer.apple.com/videos/play/wwdc2021/10204)。


### 测试



对于开发者来说，Test 更重要的是自测环节，它是开发过程中是一个非常重要的角色，能够提高团队中测试同学的工作效率，进而保障 App 用户极优体验的前提。但是，大多数情况由于本地运行测试可能会占用很长的开发时间和工作环境，导致大多数开发和公司忽略掉这一点，全交由测试同学完成这一项工作，这会导致测试同学会做很多重复性且非常固定 testcase 测试工作。


因此，小编认为 Test action 是一个非常有意义的环节，在开发者完成 Unit test 代码后，通过在 Xcode Cloud 中设置带有测试的工作流，便可以轻松的在稳定、可靠和可重现的环境中运行。这个环节可以在我们做其他工作时在后台运行，释放我们的本地环境，并且可以定时自动开始无需手动开启。


#### 添加测试


要添加测试操作，我只需要点击加号按钮并选择测试。


![image.png](https://images.xiaozhuanlan.com/photo/2021/bd16dbcbba2b5adaf9b88a25c4467a2e.png)


#### 测试的可选性


对于测试操作，我们可以选择让它 Pass or Not Pass。


- Required To Pass：如果此测试操作失败，则整个构建将失败
- Not Required To Pass：不会影响整体构建状态（在本地构建过程中可以选择该项）



![image.png](https://images.xiaozhuanlan.com/photo/2021/ba8c905954048e6a725b8b94c1a078e9.png)


#### 多种测试方案


在选择要运行的测试时，我们还可以设置多种不同的测试方案。


例如苹果官方的 Demo -- Fruta iOS 方案中的设置，或者如果我们想反复测试某组方案，就可以设计一个特定的测试计划。一旦有了这个设置，剩下要做的就是选择我想要运行测试的模拟器。


![image.png](https://images.xiaozhuanlan.com/photo/2021/d75d3833c164556bd02869621d3f2e02.png)​


#### 模拟器选择


Xcode Cloud 提供了一个推荐选项，它是不同屏幕尺寸的模拟器集合。推荐的选项是针对在环境配置部分中选择的 Xcode 进行测试，但如果我们选择了特定的模拟器，也可以从操作列表中进行选择。


![image.png](https://images.xiaozhuanlan.com/photo/2021/e742d069581f17cfa3bb020ab0122ca3.png)​


### 分析


编译器能够自动发现许多错误并警告我们，这个操作不知道看这篇文章的你们，在平常工作中有没有用到过，实际上小编是偶尔会用到。


每当在有大的版本提测之前，会花一天的时间做一下静态分析，真的会发现一些自己或者测试同学不容易发现的一些性能问题，例如内存溢出、循环引用等一些莫名明奇妙不好复现的问题，可以为我们节省大量的开发时间（fix bug 也在我们的开发周期中），同时为我们的用户提供更稳定和无错误的应用体验。


小编之所以不是经常用到，是因为“发现、追踪、修复”这个流程真的会花费一段时间，并且也会打断开发业务的节奏。但实际上随着时间的推移隐藏的问题在整个项目中堆积如山，所以在提测之前花一天的时间去做一次静态分析也是有必要的。


在这次更新的 Xcode Cloud 中添加了该操作做，可以确保每次更改代码时都会运行静态分析。


![image.png](https://images.xiaozhuanlan.com/photo/2021/30ef2b1b802ea4e035fea6a3351e5646.png)​


单击 Actions 的「加号」按钮，然后选择分析。像测试一样，也可以选择将静态分析是否影响构建流程


### 构建


最后要介绍的是 Build Action，这个操作的使用频率是仅次于 Xcode Run 吧。有时我们可能只想确保特定的辅助构建配置或方案仍然可以编译，或者可能只是确保作为应用程序一部分的框架可以自行构建，因此我们可能仅需要一个简单的 Xcode Build 操作。


在 Xcode Cloud workflows 中，可以配置post-actions、Post-actions 在所有构建、分析、测试和存档操作完成后运行。


可以使用 Xcode Cloud 配置的后期操作是发送通知并使用 TestFlight 进行部署。


#### 构建后期操作 - 发送通知


![image.png](https://images.xiaozhuanlan.com/photo/2021/b5dadea21cd74e0dc54d1b0c6a170813.png)​


例如，可以发送两种类型的通知事件。


![image.png](https://images.xiaozhuanlan.com/photo/2021/bf0e8abcc0584ae3953ff71be7a2514b.png)​


- 构建成功时，可以选择发送所有构建成功的通知
- 仅修复，即当分支或拉取请求构建从失败转换为通过时；
- 或者不通知。
- 构建失败时，可以为所有构建失败发送通知
- 仅中断，即当分支或拉取请求构建从通过转换为失败时。
- 或者不通知。



![image.png](https://images.xiaozhuanlan.com/photo/2021/cdd43e1fe9cdf64e499f04532d2bff6a.png)​


在苹果官方 Demo 的工作流程中，想在拉取请求构建完成时通知团队。（点击加号添加操作，有几个用于发送通知的选项）


![image.png](https://images.xiaozhuanlan.com/photo/2021/003350e1a3449851ebdab5af3a2378ac.png)


- Xcode Cloud与流行的协作工具 Slack集成。授权 Slack 帐户后，可以单击加号按钮以显示频道列表，选择“ci-builds”频道并单击“确定”。
- 还可以选择添加电子邮件地址。



#### 构建后期操作 - TestFlight 自动部署


最后，小编要想要分享自己最感兴趣的 Xcode Cloud Workflows 功能之一：使用 TestFlight 自动部署的能力。在这之前小编一直用的是 fastlane 做一部分的工作，最开始每次上传都需要输入账号和密码，后来试着配置秘钥，最后经常使用的还是其他上传工具，例如 Transporter。


众所周知 TestFlight 已经被集成在 App Store Connect，日常开发中我们可能会使用 Transporter 等其他工具将我们打好的包提交到App Store。现在 Xcode Cloud 提供了两个 TestFlight 部署选项。


![image.png](https://images.xiaozhuanlan.com/photo/2021/8f477cbbe0d751d8151d6bb09be624b1.png)


同时在 Xcode Cloud 中支持我们管理和使用在 App Store Connect 中的 TestFlight 组，Xcode Cloud 提供了可以 配置 workflows 自动将构建的结果部署到我们拥有的任何的 TestFlight 组内。


### TestFlight 自动部署配置


#### 内部测试


![image.png](https://images.xiaozhuanlan.com/photo/2021/ce8c1bffa73ff587d061684572b4c34f.png)


1. 添加一个存档操作。
1. 将存档上的部署选项设置为内部测试。
1. 添加一个 TestFlight 内部测试后期操作。



例如，官方 Demo 工作流程自动部署到 QA 团队，
1、单击 Archive iOS 操作。
2、选择 TestFlight Internal Testing Only（构建将在 TestFlight 中可用）。


![image.png](https://images.xiaozhuanlan.com/photo/2021/9938d7c58023a8b5082aeace15229e0b.png)


3、在生成构建时自动部署给其他同事，需要添加一个 TestFlight Post-Actions 操作（单击 Post-Actions 旁边的加号按钮，并添加 TestFlight 内部测试。）


![image.png](https://images.xiaozhuanlan.com/photo/2021/40bce7e852904ca4d069dde6ef14a99f.png)


现在，QA 团队的成员可以在按照我们预先设置的流程（所有功能合并到主分支之前）验证和测试所有功能。

#### 外部测试

实质上就是在提交到 App Store 之前就可以安装该 App，以便不是安装过证书的测试机，例如公司想要提前发布给一些忠实用户的一种途径，可以提早获取用户的反馈意见。通过这种方式也可以在发布到 App Store 之前进行问题的发现并修复。（小编说，类似于灰度发布，不知道你们有没有过类似操作呢）。


该项部署需要设置一些条件


![image.png](https://images.xiaozhuanlan.com/photo/2021/7b345953cdbcc31e341248dd56d6577e.png)​


1. 在开始条件中选择单个分支，这确保了构建的一致性为我们打算发送给外部 Beta 测试人员。
1. 在环境部分选择 Clean，这保证了我们的代码将从头开始构建，而不使用派生数据。
1. 将 Archive 操作中的部署设置为 TestFlight 和 App Store。



完成所有设置后，配置 TestFlight 外部测试 Post-Actions 类似于配置 TestFlight 内部测试了。我们只需添加在 TestFlight 中创建的外部组，TestFlight 外部测试还具有部署到单个测试人员的附加功能。


## 工作流的灵活配置


正如本文介绍，Workflows具有强大的功能和灵活性，可以根据不同的需求创建任意数量的工作流来完成工作。上文展示了“Pull Request”的工作流程，接下来简单介绍一下其他 Workflows 的想法。

#### 1. 灰度发布


应用 TestFlight 自动部署到外部测试组，也可以说是我们的 VIP 用户，等等任何我们想要让他提前体验我们的新功能的用户组。


和上面的介绍的流程一致，执行以下流程


![image.png](https://images.xiaozhuanlan.com/photo/2021/e2cfab1b6b41dc8a17a97e4d0ee3b9e3.png)​


这样我们就可以快速获相关友好的反馈，保证我们的功能以最优的效果展示给所有用户使用


#### 2. 固定时间进行测试


不知道读者是否接触过自动化测试，其中一个应用就是将一些不会经常变动的流程和 testcase 进行测试。我们可以创建一个叫做“Overnight testing workflow”。有以下几点需求，


![image.png](https://images.xiaozhuanlan.com/photo/2021/2771fc7a5efe8b8ab16adc4056845149.png)​


1. 针对多个模拟器进行测试以覆盖我需要的多个平台。
1. 任何测试失败都会报告给 QA 团队。
1. 并且由于重点完全放在测试上，因此无需在任何地方部署构建。



![image.png](https://images.xiaozhuanlan.com/photo/2021/aab694d15bbbc56b22d0c72c4a2c1c9a.png)​


选择 On a Schedule for a Branch 作为我们每周频率的启动条件类型


1. 将启动条件设置为每个工作日晚上运行此工作流。
1. 将周期选择为周一至周五凌晨 1:00 在“环境”配置中
1. 选择了最新的 Xcode 版本以确保随着新工具的发布，我们的应用程序构建成功。
1. 想要彻底测试我们的应用程序，可以选择一些需要通过的测试计划和模拟器。
1. 运行静态分析，可以添加了一个分析操作，并要求它通过。
1. 构建成功设置为不通知，并将构建失败设置为所有人。QA 团队会在第二天早上发现任何构建失败。



使用这样的的工作流程是节省时间的很好的方法，因为我们的团队可以在白天继续开发，而在下班后晚上的时间通过 Xcode Cloud 来彻底测试我们的应用程序。


最后，在 Xcode 的 Product 菜单下是 Manage Workflows，我可以在其中查到曾经创建和使用的所有工作流。


![image.png](https://images.xiaozhuanlan.com/photo/2021/af1f8d90f4dc61be08f3b794c61da001.png)​


随着我们项目的发展，我可以添加更多、编辑或删除工作流程以满足团队的需求。


官方 Demo 中已经向我们展示了如何为“Pull request”创建工作流、如何为不同平台配置操作、如何向 TestFlight 用户分发版本、以及如何设置夜间测试。
​

## 自定义 Xcode Cloud


Xcode Cloud 最终目的是将 Apple 开发者使用的工具和服务，例如开发者网站、TestFlight 和 App Store Connect 打包成一个工具箱，一站式服务。
​

在工作中必不可少的会有开发工具的集成使用，例如基于 Git 的源代码仓库的下载、管理、提交等工作，甚至是用于发送消息通知的邮箱，crash 日志上传，cocopods 对依赖库的管理，等等一切在 CI/CA 流程中的所使用的公司内部专有工具或者其他外部服务工具。
​

那么在 Xcode Cloud 中确实隆重的介绍了如何自定义 Xcode Cloud 去提供与这些工具和服务良好集成。主要将涵盖四个自定义主题（原文和自己的理解对比展示）：


![image.png](https://images.xiaozhuanlan.com/photo/2021/70734f426a7a8eef737f518691042446.png)
### 自定义脚本
​

即使 Xcode Cloud 的工作流已经提供了灵活且丰富的操作，但实际工作中我们会有团队内部自定的需求。
​

例如在构建项目时，我需要添加一个脚本让其将版本号自动更新（fastlane 功能代码）：
![image.png](https://images.xiaozhuanlan.com/photo/2021/000dcfbcb3866ab201871e7474ef9d7a.png)
Xcode Cloud 中提供了将上面的代码内容添加到**自定义脚本的的**方式来实现这一点。
​

自定义脚本在工作流中对应不同运行时间节点可分为以下 3 种类型脚本：
​


- Post-clone
- Pre-Xcodebuild
- Post-Xcodebuild



每次 Xcode Cloud 运行一个操作时，它都会执行一系列步骤，每个自定义脚本，正如其名字的含义那样，在工作流中的特定节点作为其中一个步骤加入运行：
​


- 首先，Xcode Cloud 设置一个临时环境 clone 项目的源代码；
- 之后运行脚本 Post-clone 脚本；
- 解决其他依赖项后，Xcode Cloud 运行 Pre-Xcodebuild 脚本；
- 接下来，运行上一步操作对应的 Xcodebuild 命令。
- 当 Xcodebuild 完成后，运行 Post-Xcodebuild 脚本并保存这之前生成的所有归档文件。

![image.png](https://images.xiaozhuanlan.com/photo/2021/960bc1e077e7344f2aea6c646c280683.png)
简单的说，在我们设置的工作流中，有 3 个时间几点可以让我们做相应的操作。
​

#### ci_scripts 文件夹


上面介绍了自定义脚本在 Xcode Cloud 工作流中的操作的位置，接下来介绍如何创建、配置步骤。
​

首先请读者放心，向 Xcode Cloud 添加自定义脚本很容易。只需将我们使用的 shell 脚本添加到名为**“ci_scripts”**的文件夹中，并将此文件夹放工程文件（例如官方 Demo：Fruta.xcodeproj）相同的级别。
​

![image.png](https://images.xiaozhuanlan.com/photo/2021/f516f48810f2faf67d8e399d7499c735.png)


当 Xcode Cloud 运行我们的配置时，会自动在适当的时间查找每个脚本是否存在，无需做额外的配置工作，只要存在即可运行。
​

这里需要注意，ci_scripts 文件夹的名称和里面的脚本必须符合该命名约定以便 Xcode Cloud 能够找到并运行该脚本。


#### 配置和使用示例


自定义脚本可以看做是源代码的一部分，因此对不同分支的脚本进行更改，执行不同的操作，我们可以通过以下场景来学习：
​


- 工作中我们会为了不同版本和功能独立出一个分支，例如官方 Demo：“Pull Requests”；
- 这可能会导致提交测试到覆盖安装后，从表面上看让我们无法区分是否是“Pull Requests”分支；
- 我们可以针对这种情况，为不同分支或者版本的 App 显示相应的 Appicon。

​

1、首先需要将 ci_scripts 文件夹添加到项目中。
​

![image.png](https://images.xiaozhuanlan.com/photo/2021/76ed1e2c343ce7e1fa6b703a4a6fdfc1.png)


2、接下来，将设计好的 「beta 应用程序图标」添加到 ci_scripts 文件夹。
（注意图片的内容，需要将它从 「Assets.xcassets -> AppIcon.appiconset」 拖到 ci_scripts 文件夹中。）
​

![image.png](https://images.xiaozhuanlan.com/photo/2021/cfb0933ea375ea6d86636073c1ddbf73.png)


3、最后，添加一个 Pre-Xcodebuild 脚本。因为需要在 Xcodebuild 之前将 「beta 应用程序图标」替换到 Appicon 的位置，且不需要勾选任何一个 targets。
![image.png](https://images.xiaozhuanlan.com/photo/2021/44e204ea0f2bb5a851cef96c9ca4ceef.png)
##### 
**现在脚本已经就位，简单介绍一下脚本是如何做到的**


1、我想确保只有在构建来自「Pull requests」时才会更换应用程序图标。通过使用Xcode Cloud 提供的环境变量在运行时检查构建是否为「Pull requests」。[环境变量参考](https://developer.apple.com/documentation/Xcode/Environment-Variable-Reference)
2、删除现有的应用程序图标，并使用 rm 和 mv 命令将途径替换为测试版。
​

![image.png](https://images.xiaozhuanlan.com/photo/2021/bd582a9a4b404897443e550358e8118f.png)


应用该配置构建成功后安装的 App 就是我们希望看到的的 beta 应用程序图标。


![image.png](https://images.xiaozhuanlan.com/photo/2021/8620fb884059cd13a0ec76b9912bba8c.png)
​

### 在 Xcode Cloud 中使用其他依赖库


相信 iOS 开发者对 Cocoapods 一定不默认吧，即使你不知道他的原理，你也使用过他，即使没有使用过，总算听说过吧。
​

Cocoapods是一个专为Xcode工程（项目）所需第三方包的一个包依赖管理工具！类似于Java的Maven、Android的JCenter、Node的npm、yarn，工作职责都是一样。那本章节不是为了介绍 Cocoapods，因为 Xcode Cloud 为我们提供了这样的功能。
​

实例场景：Fruta 项目需要引入一个团队内部开发的一个 InvitationsKit 功能的 framework（官方 Demo 中是用的 Swift 项目，引入的是 package，不清楚 Xcode Cloud 是否支持 Objective-C framework）
​

1、这是在 Xcode 中的 Fruta 项目，File -> Add Packages... 
​

![image.png](https://images.xiaozhuanlan.com/photo/2021/558923b44d28cb028fa033f31ab7b406.png)


2、然后选择 Add Package
​

![image.png](https://images.xiaozhuanlan.com/photo/2021/659274e44a6d2d33e5ba2909e3f505e6.png)


3、现在添加了依赖项，我们将更改的内容提交到当前分支上。


由于这是第一次添加这个依赖库， Xcode Cloud 无法访问 InvitationsKit 仓库，所以预计会构建失败。Xcode Cloud 提供了一个简单的界面来解决这个问题。


正如预期的那样，构建失败了并且在 Xcode Cloud 页面显示了一个 warning。单击“Manage Repositories”按钮。
​

![image.png](https://images.xiaozhuanlan.com/photo/2021/b9bff2209b755d8fcd9dbabf16c46c7b.png)


在出现的设置页面，在我们想要操作的依赖库的位置单击 Grant 来允许 Xcode Cloud 链接代码仓库。
​

![image.png](https://images.xiaozhuanlan.com/photo/2021/582f22d05aec24bef74508db4b85fa6a.png)
​

此时有可能会需要我们去 GitHub 添加权限。
​

![image.png](https://images.xiaozhuanlan.com/photo/2021/b291105697323572cecb1bfe2161d721.png)


至此，我们添加了所有需要的权限，允许 Xcode Cloud 访问我们的代码以及依赖的三方库。
​

![image.png](https://images.xiaozhuanlan.com/photo/2021/4728fd7cd0f35c53197f98d0eff6d923.png)


现在，当我们回到 Xcode Cloud 页面时它显示 Access Granted。
​

![image.png](https://images.xiaozhuanlan.com/photo/2021/d24c15f352ae9e061223799fc79ac4f2.png)
​

Xcode Cloud 还提供了对已链接的三方库的使用权限设置，在 Settings 下的 Additional Repositories 部分可以看到该列表，Xcode Cloud 将在构建期间检测这一部分内容。
## 小编有话

还有更多的 workflows 等待我们去发现和探索，并且苹果还在 App Store Connect 中提供了 workflows 的创建、编辑和管理。


通过官方介绍小编的感受是，苹果真的是给开发者的日常工作提供便利，功能强大且灵活，但实际工作中或许有的团队已经有了自己的一套完整的 CI 流程，或者说有的小公司或者个人项目已经适应了没有这些环节的开发。


例如阿里集团内部使用的摩天轮，已经完全覆盖了这些操作。那么广大开发者是不是愿意使用这个功能，这还要看接下来真正发布之后，实际应用中是否真的做到了功能强大且灵活、开发便利、提高工作效率，让我们拭目以待吧！


Xcode Cloud 是 Xcode 13 的一项功能，目前处于测试阶段，使用 Xcode Cloud Beta 版需要提交申请，小编目前还在排队中


![image.png](https://images.xiaozhuanlan.com/photo/2021/71a199866c67b42bd47311c705966afc.png)

如果申请下来，会进行实操后继续文章的更新。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
