> 本文基于 [Session 10268](https://developer.apple.com/videos/play/wwdc2021/10268) & [Session 10268](https://developer.apple.com/videos/play/wwdc2021/10269) 梳理

## 本文知识概况
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274494298-a492acae-503c-4255-be6f-db0092d3bb7c.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u816bc5ba&margin=%5Bobject%20Object%5D&name=image.png&originHeight=740&originWidth=1328&originalType=url&ratio=2&size=217989&status=done&style=stroke&taskId=ufd09a70e-fa5d-4c3f-af5b-ad39bc359de)​
今年的 WWDC 21 对于开发者来说 Xcode Cloud 是最具有吸引力的话题之一吧！ 由于小编的 Xcode Cloud Beta 还在申请中，所以本文主要根据官方视频以及文档并结合小编在实际开发中的经验对 WorkFlows 在 Xcode Cloud 的重要性以及如何创建 WorkFlows 的详细介绍和总结。
## 引言


不管是使用哪种语言来开发，相信大家对 CI/CD 工具做持续集成、持续交付和部署工作应该是极为熟悉的。无论是大公司、小公司或个人都会选择一些工具，类似于 Jenkins、Travis CI 等来对自己的项目进行集成、测试、发布等工作，可以说通过一整套的 CI/CD 方法，可以让团队在创造高质量产品的同时，很好地协同工作。
​

如果读者曾经使用过 fastlane 等工具实现过项目的构建、打包、上传，那会很轻松的理解这一篇的文章介绍的内容。如果您使用过 MTL 那我相信读者会完全知道 Xcode Cloud 在做什么！
​

全文以苹果官方 Fruta 的应用程序举例说明，它已经在 Xcode Cloud 上启动并运行。如何您还不知道什么是 Xcode Cloud，您可以订阅《老司机技术周报》 会有相关文章详细介绍，或者直接观看[Meet Xcode Cloud](https://developer.apple.com/videos/play/wwdc2021/10267)
## 工作流介绍


当我们加入到 Fruta 应用程序时 Xcode 已经为我们创建了一个默认工作流程，用于构建主分支。我们的需求设定是任何人更新项目时构建，分析、测试和打包该应用程序：
​


- 在构建完成时通知团队
- 将该应用程序版本交付给团队成员
以便他们可以在将功能合并到我们的主要集成分支之前对其进行自测。

​

### 工作流配置
​

创建工作流很容易，Menu -> Product -> Xcode Cloud -> Manage Workflows -> 单击加号，然后选择我的应用程序。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274494566-37d82547-12c0-4a46-aa7a-b7fa1a222a8b.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u48998465&margin=%5Bobject%20Object%5D&name=image.png&originHeight=772&originWidth=1374&originalType=url&ratio=2&size=441564&status=done&style=stroke&taskId=u65b731c0-f2bf-4f8d-a974-2faf30e3255)
确定添加之后，会出现一个新的工作流编辑器。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274494625-cb5e989c-461d-4521-b370-42b3fd302544.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u35f008b0&margin=%5Bobject%20Object%5D&name=image.png&originHeight=774&originWidth=1378&originalType=url&ratio=2&size=259281&status=done&style=none&taskId=u8e6de65d-3152-4afb-9deb-2f7a8c6775f)
工作流由多个可配置组件组成，我可以在其中命名我的工作流程，苹果官方 Demo 将其命名为“Pull Requests”。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274494451-b110786d-3e89-4eae-b19e-31fa9c1342d9.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u31529b0f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=772&originWidth=1372&originalType=url&ratio=2&size=282630&status=done&style=stroke&taskId=u63be8696-650d-4730-94c3-e82aa250607)
如果我们所在的团队人数较少，可以选择限制编辑以防止可能影响团队内部的意外更新。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274494485-728dd88f-8008-418f-877f-543f2c06c5da.png#clientId=uf4082a8c-1fdb-4&from=paste&id=ue6268468&margin=%5Bobject%20Object%5D&name=image.png&originHeight=778&originWidth=1378&originalType=url&ratio=2&size=274518&status=done&style=stroke&taskId=u5d233e21-96b7-4ad3-94c8-6a5e1b27793)​
默认情况下，Xcode Cloud使用本地设置信息来设置代码仓库和项目信息，但是如果需要指定我们的仓库时可以在这里更改这些设置。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274495556-1ddaede3-14de-41d9-bc25-a7ab6375503e.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u16baeb5c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=770&originWidth=1372&originalType=url&ratio=2&size=279620&status=done&style=stroke&taskId=u92f4c419-4779-46fc-a6be-2343a70e4d7)
### 启动条件
​

Start Conditions 是定义 WorkFlows 何时运行的地方。
​

#### 启动条件配置
​

Xcode Cloud 有多种条件类型。对本文 Demo 工作流，我们将其启动条件设置为针对所有打算合并到主分支的 “Pull Requests” 请求运行：Start Conditions -> Type -> Every Change to a Pull Request 
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274495897-721b7d97-579e-4483-9f2c-644df4a86a41.png#clientId=uf4082a8c-1fdb-4&from=paste&id=ud09a8669&margin=%5Bobject%20Object%5D&name=image.png&originHeight=774&originWidth=1380&originalType=url&ratio=2&size=329146&status=done&style=stroke&taskId=ue7b84823-0f2c-4229-a571-9ebc3100f63)
这种条件类型允许我指定源分支和目标分支。我将源分支设置为 Any Branch ，将目标分支设置为 Main。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274495948-1661beb8-47ce-4beb-8505-27bada0bd0bd.png#clientId=uf4082a8c-1fdb-4&from=paste&id=ucd8fb318&margin=%5Bobject%20Object%5D&name=image.png&originHeight=792&originWidth=1376&originalType=url&ratio=2&size=309275&status=done&style=stroke&taskId=u59cd1b7e-99fc-4b8f-9a5c-a6cda7fc47c)
现在，每次团队成员针对 Main创建拉取请求并对其进行更改时，Xcode Cloud 都会自动运行此工作流。
​

其他设置信息：

- 针对特定文件或文件夹的改动
- 并选择设置是否要在工作流运行时自动取消任何以前运行的构建。当我们出现连续地将一个提交推到另一个之上，这事会非常遍历的。

​

当前在构建该项目时，Xcode Cloud 现在会一起构建和测试源分支和目标分支的合并，此时团队成员的任意一次修改都会让其他成员所了解
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274495954-15d140fb-5487-436d-997c-b9effd93f04a.png#clientId=uf4082a8c-1fdb-4&from=paste&id=uaa3c308e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=828&originWidth=1412&originalType=url&ratio=2&size=111814&status=done&style=stroke&taskId=ue1bb5eef-512a-4804-b1c2-1b9992c4f7f)​
#### 其他启动条件类型


对“Pull Requests”的每个更改都只是一个在上面创建的工作流设置的启动条件中，根据团队需要，我们还有其他条件类型提供给我们配置以满足这些需要。

- Every change to a branch：对分支的每次更改将始终构建源分支并忽略任何拉取请求状态；
- Every change to a tag：每当创建新标签时，都会构建对标签的每次更改；
- On a schedule：将在您可以选择的重复计划上构建您选择的分支，如果是偶尔进行长时间运行的测试，这个会很方便；



### 环境配置


Set up Environment  是决定 WorkFlows 如何运行的重要组成部分。
​

#### 基础配置
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274496406-ae180b36-b17c-477e-b0b2-7748511bbde2.png#clientId=uf4082a8c-1fdb-4&from=paste&id=uee5c9d2a&margin=%5Bobject%20Object%5D&name=image.png&originHeight=824&originWidth=1472&originalType=url&ratio=2&size=322480&status=done&style=stroke&taskId=u06b899c1-1287-4dab-9d22-f4332ecb649)

1. Xcode Cloud 提供各种 macOS 和 Xcode 版本，还可以将 Workflows 设置为指向最新版本或 Beta 版本，让我们始终可以在最新软件上进行构建或测试。
1. Clean 选项，大多数的实际项目是包含许多文件的大型项目，构建需要很长一段时间。在 Xcode 中我们可以选择通过仅构建已更改的文件来构建本次项目。 Xcode Cloud 中 Clean 操作就是保证我门能更快的构建当前项目
1. 除了Xcode 提供的现有脚本选项之外，Xcode 还添加了创建自定义脚本的功能，这些脚本在执行构建和测试的设备上运行。这个下面的环节会继续讲解
1. 在这一个配置中，我可以指定Xcode Cloud 提供给自定义脚本的环境变量。这对于我们不想签入源代码存储库的配置和机密是非常有用的。

到目前为止，就是 Xcode Cloud 如何配置工作流和如何运行以及他们应该在什么环境中运行，那灵活性体现在哪里呢？
​

#### 环境的高级配置


苹果还提供了使用环境变量将额外的信息传递到构建中，这样就可以在“Environment”中配置所需的任何环境变量，用 key-value 的形式添加即可。**将API服务中的不同URL传递到测试中。**

![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274496815-9afaa160-d3b0-468a-a52b-88c9f6a49f3e.png#clientId=uf4082a8c-1fdb-4&from=paste&id=uf91e86e7&margin=%5Bobject%20Object%5D&name=image.png&originHeight=970&originWidth=1722&originalType=url&ratio=2&size=221296&status=done&style=stroke&taskId=u4d662792-50c0-4b0d-95a1-4aece7f405f)
##### 环境变量加密
​

对于 API Key 或 access token 等敏感信息，您可以配置秘密环境变量。秘密环境变量会得到安全处理并安全存储，并且它们的解密值仅在运行我们操作的临时环境中可用。只需选中环境变量表中的“秘密”复选框即可。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274497010-004887fe-3b6e-4fcc-a0f7-e8ad0a0c0f2e.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u117457d8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=970&originWidth=1722&originalType=url&ratio=2&size=198088&status=done&style=stroke&taskId=u96ae19ac-9554-4918-a283-084f8692e80)
更多环境变量可以查看[环境变量参考](https://developer.apple.com/documentation/Xcode/Environment-Variable-Reference)。其他更高级的配置，会在文章最后一节进行介绍。
接下来详细介绍一下 Actions。
## 工作流操作


这个部分内容实际上就是将 Xcode 在本地执行的相关操作现在都可以在 Xcode Cloud 中使用：构建、运行静态分析、测试、和存档，与 Xcode Cloud中对应的 Actions 一一对应，在此次Demo中，会依次展示以下操作：
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274497548-76f47756-3211-4538-9786-730c84e2bfed.png#clientId=uf4082a8c-1fdb-4&from=paste&id=ufad413ed&margin=%5Bobject%20Object%5D&name=image.png&originHeight=836&originWidth=1906&originalType=url&ratio=2&size=357435&status=done&style=stroke&taskId=u1a8e926a-a754-44f0-9025-e80e1e6d697)
### 存档


首先在工作流编辑页面的 Actions 目录中，单击操作旁边的加号图标并选择存档来添加存档操作。默认选择了iOS平台和iOS方案。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274497661-080162f8-d5d3-49d9-ada8-7258fc6b5346.png#clientId=uf4082a8c-1fdb-4&from=paste&id=uad9836d2&margin=%5Bobject%20Object%5D&name=image.png&originHeight=768&originWidth=1372&originalType=url&ratio=2&size=312859&status=done&style=stroke&taskId=uc5b2081a-363b-463a-bf11-3269c71eda6)
（我还可以选择注册TestFlight 或使其为 App Store 分发做好准备，但稍后会详细自动部署）

读者是否已经注意到，我们没有管理证书和描述文件。当我们登陆了开发者账号时Xcode Cloud 已经自动为我们关联了。要了解更多相关信息，请查看[Session 10204](https://developer.apple.com/videos/play/wwdc2021/10204)。
### 测试
​

对于开发者来说，Test 更重要的是自测环节，它是开发过程中是一个非常重要的角色，能够提高团队中测试同学的工作效率，进而保障 App 用户极优体验的前提。但是，大多数情况由于本地运行测试可能会占用很长的开发时间和工作环境，导致大多数开发和公司忽略掉这一点，全交由测试同学完成这一项工作，这会导致测试同学会做很多重复性且非常固定 testcase 测试工作。

因此，小编认为 Test action 是一个非常有意义的环节，在开发者完成 Unit test 代码后，通过在 Xcode Cloud 中设置带有测试的工作流，便可以轻松的在稳定、可靠和可重现的环境中运行。这个环节可以在我们做其他工作时在后台运行，释放我们的本地环境，并且可以定时自动开始无需手动开启。

#### 添加测试
要添加测试操作，我只需要点击加号按钮并选择测试。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274498046-79be39a3-76e0-4e28-a38b-ad1286df2d44.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u31909416&margin=%5Bobject%20Object%5D&name=image.png&originHeight=970&originWidth=1732&originalType=url&ratio=2&size=404535&status=done&style=stroke&taskId=u807f3569-b19d-408a-9dc3-e8999d37980)
#### 测试的可选性


对于测试操作，我们可以选择让它 Pass or Not Pass。

- Required To Pass：如果此测试操作失败，则整个构建将失败
- Not Required To Pass：不会影响整体构建状态（在本地构建过程中可以选择该项）

![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274498848-d2a90cf3-9642-414d-ada0-573ae3d7233b.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u441157ff&margin=%5Bobject%20Object%5D&name=image.png&originHeight=970&originWidth=1724&originalType=url&ratio=2&size=388022&status=done&style=stroke&taskId=u0df5f782-62d5-4f0a-9267-be19d6b6c6e)
#### 多种测试方案


在选择要运行的测试时，我们还可以设置多种不同的测试方案。
​

例如苹果官方的 Demo -- Fruta iOS 方案中的设置，或者如果我们想反复测试某组方案，就可以设计一个特定的测试计划。一旦有了这个设置，剩下要做的就是选择我想要运行测试的模拟器。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274499001-cc604323-a2e1-4351-8b88-a1fb2f364f9b.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u9c2c3fde&margin=%5Bobject%20Object%5D&name=image.png&originHeight=970&originWidth=1720&originalType=url&ratio=2&size=403858&status=done&style=stroke&taskId=u20f00618-2145-4781-8a36-685dc02b574)​
#### 模拟器选择
​

Xcode Cloud 提供了一个推荐选项，它是不同屏幕尺寸的模拟器集合。推荐的选项是针对在环境配置部分中选择的 Xcode 进行测试，但如果我们选择了特定的模拟器，也可以从操作列表中进行选择。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274499155-f723d1e4-7db1-4c48-b080-fb070dfd776e.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u659c3c7d&margin=%5Bobject%20Object%5D&name=image.png&originHeight=970&originWidth=1724&originalType=url&ratio=2&size=409061&status=done&style=stroke&taskId=ua9ea8f08-8f19-461d-af05-c526725fe3b)​
### 分析


编译器能够自动发现许多错误并警告我们，这个操作不知道看这篇文章的你们，在平常工作中有没有用到过，实际上小编是偶尔会用到。
​

每当在有大的版本提测之前，会花一天的时间做一下静态分析，真的会发现一些自己或者测试同学不容易发现的一些性能问题，例如内存溢出、循环引用等一些莫名明奇妙不好复现的问题，可以为我们节省大量的开发时间（fix bug 也在我们的开发周期中），同时为我们的用户提供更稳定和无错误的应用体验。
​

小编之所以不是经常用到，是因为“发现、追踪、修复”这个流程真的会花费一段时间，并且也会打断开发业务的节奏。但实际上随着时间的推移隐藏的问题在整个项目中堆积如山，所以在提测之前花一天的时间去做一次静态分析也是有必要的。
​

在这次更新的 Xcode Cloud 中添加了该操作做，可以确保每次更改代码时都会运行静态分析。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274499298-e85fd675-8028-4c40-baac-6c6fe529d1bc.png#clientId=uf4082a8c-1fdb-4&from=paste&id=uf42ed6fc&margin=%5Bobject%20Object%5D&name=image.png&originHeight=970&originWidth=1714&originalType=url&ratio=2&size=362873&status=done&style=stroke&taskId=ufa8197f4-97e7-4b06-a11a-3e92d016b40)​
单击 Actions 的「加号」按钮，然后选择分析。像测试一样，也可以选择将静态分析是否影响构建流程
### 构建


最后要介绍的是 Build Action，这个操作的使用频率是仅次于 Xcode Run 吧。有时我们可能只想确保特定的辅助构建配置或方案仍然可以编译，或者可能只是确保作为应用程序一部分的框架可以自行构建，因此我们可能仅需要一个简单的 Xcode Build 操作。
​

在 Xcode Cloud workflows 中，可以配置post-actions、Post-actions 在所有构建、分析、测试和存档操作完成后运行。
​

可以使用 Xcode Cloud 配置的后期操作是发送通知并使用 TestFlight 进行部署。
​

#### 构建后期操作 - 发送通知
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274499706-4f47fc03-cafc-458d-a838-29a59bb24eb9.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u4488cedb&margin=%5Bobject%20Object%5D&name=image.png&originHeight=746&originWidth=1358&originalType=url&ratio=2&size=93801&status=done&style=stroke&taskId=u55f3512b-bf98-445d-b73d-f7c09ffa9c3)​
例如，可以发送两种类型的通知事件。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274500168-bc3c1216-44f9-4e34-a905-2fae49b8c0a6.png#clientId=uf4082a8c-1fdb-4&from=paste&id=uac6ac46f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=594&originWidth=1338&originalType=url&ratio=2&size=103020&status=done&style=stroke&taskId=ua064b35c-82fb-4aa2-afd9-2d00665cf3d)​

- 构建成功时，可以选择发送所有构建成功的通知 
- 仅修复，即当分支或拉取请求构建从失败转换为通过时；
- 或者不通知。
- 构建失败时，可以为所有构建失败发送通知 
- 仅中断，即当分支或拉取请求构建从通过转换为失败时。
- 或者不通知。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274500791-ba2c459b-5c8a-40a4-b172-e9123574243d.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u30fc6d81&margin=%5Bobject%20Object%5D&name=image.png&originHeight=776&originWidth=1376&originalType=url&ratio=2&size=299572&status=done&style=stroke&taskId=u0d7de980-c913-4f06-b6e0-7cf2e8c2ede)​
在苹果官方 Demo 的工作流程中，想在拉取请求构建完成时通知团队。（点击加号添加操作，有几个用于发送通知的选项）
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274501031-55166d98-b77e-4dc9-892f-a0cdcfe0d77f.png#clientId=uf4082a8c-1fdb-4&from=paste&id=uca65d00e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=776&originWidth=1376&originalType=url&ratio=2&size=299572&status=done&style=stroke&taskId=u48ab2352-580c-427d-ab5b-561934c5f44)

- Xcode Cloud与流行的协作工具 Slack集成。授权 Slack 帐户后，可以单击加号按钮以显示频道列表，选择“ci-builds”频道并单击“确定”。
- 还可以选择添加电子邮件地址。

​

#### 构建后期操作 - TestFlight 自动部署


最后，小编要想要分享自己最感兴趣的 Xcode Cloud Workflows 功能之一：使用 TestFlight 自动部署的能力。在这之前小编一直用的是 fastlane 做一部分的工作，最开始每次上传都需要输入账号和密码，后来试着配置秘钥，最后经常使用的还是其他上传工具，例如 Transporter。

众所周知 TestFlight 已经被集成在 App Store Connect，日常开发中我们可能会使用 Transporter 等其他工具将我们打好的包提交到App Store。现在 Xcode Cloud 提供了两个 TestFlight 部署选项。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274500901-87de6f4a-0048-4ea1-9535-01f87637405a.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u93107721&margin=%5Bobject%20Object%5D&name=image.png&originHeight=810&originWidth=1352&originalType=url&ratio=2&size=169463&status=done&style=stroke&taskId=ude03fa45-bd58-4229-b5b4-50b40d8087a)
同时在 Xcode Cloud 中支持我们管理和使用在 App Store Connect 中的 TestFlight 组，Xcode Cloud 提供了可以 配置 workflows 自动将构建的结果部署到我们拥有的任何的 TestFlight 组内。
### TestFlight 自动部署配置
#### 内部测试
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274501075-8740d224-cb9e-417b-9a7f-dc56ed863b95.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u55ac4457&margin=%5Bobject%20Object%5D&name=image.png&originHeight=512&originWidth=1350&originalType=url&ratio=2&size=107220&status=done&style=stroke&taskId=u9331b4c5-a28c-4b0e-8701-5db5b31fefc)

1. 添加一个存档操作。
1. 将存档上的部署选项设置为内部测试。
1. 添加一个 TestFlight 内部测试后期操作。

​

例如，官方 Demo 工作流程自动部署到 QA 团队，
1、单击 Archive iOS 操作。 
2、选择 TestFlight Internal Testing Only（构建将在 TestFlight 中可用）。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274501257-07e0526c-d914-404b-b814-8a372b825350.png#clientId=uf4082a8c-1fdb-4&from=paste&id=ud677c233&margin=%5Bobject%20Object%5D&name=image.png&originHeight=774&originWidth=1376&originalType=url&ratio=2&size=319921&status=done&style=stroke&taskId=u2cdf25b3-1320-4e17-8781-8dfc7771faa)
3、在生成构建时自动部署给其他同事，需要添加一个 TestFlight Post-Actions 操作（单击 Post-Actions 旁边的加号按钮，并添加 TestFlight 内部测试。） 
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274502217-a7483d67-6ae9-4981-95e8-6c7cf6e06357.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u48b9023c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=774&originWidth=1376&originalType=url&ratio=2&size=318433&status=done&style=stroke&taskId=u1e32e95a-132a-477e-93a9-c5f5840a85c)
现在，QA 团队的成员可以在按照我们预先设置的流程（所有功能合并到主分支之前）验证和测试所有功能。
​

#### 外部测试
​

实质上就是在提交到 App Store 之前就可以安装该 App，以便不是安装过证书的测试机，例如公司想要提前发布给一些忠实用户的一种途径，可以提早获取用户的反馈意见。通过这种方式也可以在发布到 App Store 之前进行问题的发现并修复。（小编说，类似于灰度发布，不知道你们有没有过类似操作呢）。
​

该项部署需要设置一些条件
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274502205-30f60b6c-6712-4661-a87e-92fb67188a18.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u25fedbda&margin=%5Bobject%20Object%5D&name=image.png&originHeight=558&originWidth=1336&originalType=url&ratio=2&size=114866&status=done&style=stroke&taskId=ubc65c778-17c0-4a89-9452-a284fe69cdf)​

1. 在开始条件中选择单个分支，这确保了构建的一致性为我们打算发送给外部 Beta 测试人员。
1. 在环境部分选择 Clean，这保证了我们的代码将从头开始构建，而不使用派生数据。
1. 将 Archive 操作中的部署设置为 TestFlight 和 App Store。

​

完成所有设置后，配置 TestFlight 外部测试 Post-Actions 类似于配置 TestFlight 内部测试了。我们只需添加在 TestFlight 中创建的外部组，TestFlight 外部测试还具有部署到单个测试人员的附加功能。
## 工作流的灵活配置


正如本文介绍，Workflows具有强大的功能和灵活性，可以根据不同的需求创建任意数量的工作流来完成工作。上文展示了“Pull Request”的工作流程，接下来简单介绍一下其他 Workflows 的想法。
​

#### 1. 灰度发布
应用 TestFlight 自动部署到外部测试组，也可以说是我们的VIP用户，等等任何我们想要让他提前体验我们的新功能的用户组。

和上面的介绍的流程一致，执行以下流程
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274502238-f8688b50-7cbb-4a9a-9d69-7c7a578debbb.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u2767096e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=556&originWidth=1274&originalType=url&ratio=2&size=101446&status=done&style=stroke&taskId=u50d79268-f6ce-434e-a53f-569d08b8708)​
这样我们就可以快速获相关友好的反馈，保证我们的功能以最优的效果展示给所有用户使用

#### 2. 固定时间进行测试
不知道读者是否接触过自动化测试，其中一个应用就是将一些不会经常变动的流程和 testcase 进行测试。我们可以创建一个叫做“Overnight testing workflow”。有以下几点需求，
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274502431-a4531349-a53e-4d88-a1b3-cc430e08a939.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u95cd27ba&margin=%5Bobject%20Object%5D&name=image.png&originHeight=524&originWidth=1264&originalType=url&ratio=2&size=110675&status=done&style=stroke&taskId=uaf875a6e-d1d2-4a62-a948-3106c93e13a)​

1. 针对多个模拟器进行测试以覆盖我需要的多个平台。
1. 任何测试失败都会报告给 QA 团队。
1. 并且由于重点完全放在测试上，因此无需在任何地方部署构建。

![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274502983-ab9be79a-b388-40a6-af36-d1d769d65261.png#clientId=uf4082a8c-1fdb-4&from=paste&id=ub19abddf&margin=%5Bobject%20Object%5D&name=image.png&originHeight=700&originWidth=1234&originalType=url&ratio=2&size=249269&status=done&style=stroke&taskId=u9c4a2ea3-e10b-4c21-9741-deb79cf1ddc)​
选择 On a Schedule for a Branch 作为我们每周频率的启动条件类型
​


1. 将启动条件设置为每个工作日晚上运行此工作流。
1. 将周期选择为周一至周五凌晨 1:00在“环境”配置中
1. 选择了最新的 Xcode 版本以确保随着新工具的发布，我们的应用程序构建成功。
1. 想要彻底测试我们的应用程序，可以选择一些需要通过的测试计划和模拟器。
1. 运行静态分析，可以添加了一个分析操作，并要求它通过。
1. 构建成功设置为不通知，并将构建失败设置为所有人。QA 团队会在第二天早上发现任何构建失败。

​

使用这样的的工作流程是节省时间的很好的方法，因为我们的团队可以在白天继续开发，而在下班后晚上的时间通过 Xcode Cloud 来彻底测试我们的应用程序。

最后，在 Xcode 的 Product 菜单下是 Manage Workflows，我可以在其中查到曾经创建和使用的所有工作流。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274503441-e05cebb3-a764-4843-9f4e-26e0e53cc999.png#clientId=uf4082a8c-1fdb-4&from=paste&id=ud8705c02&margin=%5Bobject%20Object%5D&name=image.png&originHeight=718&originWidth=1136&originalType=url&ratio=2&size=304660&status=done&style=stroke&taskId=u5e19c940-ed8c-4299-b756-958391fd0d7)​
随着我们项目的发展，我可以添加更多、编辑或删除工作流程以满足团队的需求。

官方 Demo 中已经向我们展示了如何为“Pull request”创建工作流、如何为不同平台配置操作、如何向 TestFlight 用户分发版本、以及如何设置夜间测试。
## 小编有话
​

还有更多的 workflows 等待我们去发现和探索，并且苹果还在 App Store Connect 中提供了 workflows 的创建、编辑和管理。

通过官方介绍小编的感受是，苹果真的是给开发者的日常工作提供便利，功能强大且灵活，但实际工作中或许有的团队已经有了自己的一套完整的 CI 流程，或者说有的小公司或者个人项目已经适应了没有这些环节的开发。
​

例如阿里集团内部使用的摩天轮，已经完全覆盖了这些操作。那么广大开发者是不是愿意使用这个功能，这还要看接下来真正发布之后，实际应用中是否真的做到了功能强大且灵活、开发便利、提高工作效率，让我们拭目以待吧！
​

Xcode Cloud是Xcode 13的一项功能，目前处于测试阶段，使用 Xcode Cloud Beta 版需要提交申请，小编目前还在排队中
![image.png](https://cdn.nlark.com/yuque/0/2021/png/2621939/1624274503497-2a673e5f-20d7-44b9-81ee-df1a59888f14.png#clientId=uf4082a8c-1fdb-4&from=paste&id=u729cba7b&margin=%5Bobject%20Object%5D&name=image.png&originHeight=782&originWidth=1842&originalType=url&ratio=2&size=292387&status=done&style=stroke&taskId=u2b8f5537-cb04-46d0-a46a-6e4b1f9ae7b)
如果申请下来，会进行实操后继续文章的更新。
