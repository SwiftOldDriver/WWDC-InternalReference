> 作者：张茜倩，iOS 开发，目前就职于好未来新励步。
>
> 审核：JonyFang，iOS 开发，老司机技术周报编辑，就职于哔哩哔哩直播部门

本文基于 [Session 10257](https://developer.apple.com/videos/play/wwdc2021/10257/) 梳理

- **前言**

ClassKit 是有关教学活动内容的框架，本 Session 将介绍如何使用 ClassKit 最新的 file-based API ，把学生各种类型的进度数据、学习情况报告给教师，以及如何在开发者模式下测试。
（个人感觉这篇 Session 不仅适合开发看，更适合产品看。😂）


- **关于 ClassKit**

Apple 首次在 WWDC2018 提出 ClassKit。支持 iOS 11.4+ 系统。
ClassKit 可以让自己开发的 App 参与到一个虚拟教室里，需要和 Apple 推出的教育生态  [Apple School Manager and Managed Apple IDs](https://www.apple.com/education/it/) ，还有 Schoolwork App 配合使用。
ClassKit 专门为教育类 App 设计，可以帮助减轻一些工作。举例：你要开发的 App 的功能之一是教师发布作业，作业内容是学生查看和编辑文档、答题，并且要记录学生们的学习情况（学习情况：每一个同学是否完成作业、观看时长、完成进度、答题正确率等）。使用 ClassKit 后，你就不需要再为上述情况写逻辑代码或者界面代码，也不需要修改已有的逻辑。教师可以直接在 SchoolWork App 上创建分配有关你 App 内容的教学活动，和查看学生进度。

【WWDC18 Session 215】[Introducing ClassKit](https://developer.apple.com/videos/play/wwdc2018/215)

(贴一篇比较好的解读 [iOS ClassKit.Framework](https://www.jianshu.com/p/95c995cb4f1e))
​
- **关于 Apple School Manager and Managed Apple IDs**

Apple 在 WWDC2018 发布的教育计划，教师需要使用 Apple School Manager 为学生单独或批量创建 Apple ID 。在美国 Apple 会和学校合作，在课堂中使用。
还推出了两款教育 App，**Classroom**：帮助教师管理学生。**SchoolWork**：帮助教师管理和分发作业，查看进度。


- **国内教育类 App 现状，使用 ClassKit 的可行性**

本人在国内互联网K12教育行业工作了五年，目前没有听过任何一家国内互联网教育公司使用 ClassKit 。😂
国内K12教育类 App 主要形式有：真人在线直播课、AI互动类直播课、录播课、绘本类、游戏类。教学活动，学习情况一般会直接展示在 App 内（排名、获奖等）用来激励学生学习兴趣。
分析国内没使用 ClassKit 的主要原因：

1. ClassKit 受众用户比较窄：只支持 iOS 。需要对iOS再专门设计一套定制产品。
1. 需要使用 Apple School Manager 给学生创建 Apple ID。需要有校区和班级。
1. 需要和 Classroom App 和 SchoolWork App 配合使用。用户除了下载目标 App，还需要下载另外两款 App，才能使用。学习成本比较高。
1. ClassKit 会剥夺有关激励学生的一些产品设计。

个人感觉国内使用 ClassKit 的可能性很小。
（另外本文写于2021.06，虽然最近一些政策对教育行业影响蛮大，但是我认为科技对教育的贡献还是很大的。
在线直播课、录播课：可以让各个地区的孩子看同一个优秀老师的课程。AI评测：评测准确率高，减轻教师重复性工作量。绘本类游戏类学习方式：增强学习趣味性，让简单枯燥的学习体验变的非常有趣，激发学生兴趣。
而且 Apple 这不也出了教育相关的 API， 因此我认为教育类 App 不会彻底消失～）

---

以下是 [Session 10257](https://developer.apple.com/videos/play/wwdc2021/10257/) 的具体内容

## 1.回顾 Schoolwork App，如何与 ClassKit 一起使用
在 App 中使用了 ClassKit 框架，发布了教学内容（CLSContexts）并开始报告学习进度数据后，教师就能在 Schoolwork App 上分配该内容并查看进度数据。因此如果你的 App 使用了 ClassKit ，教师们会更愿意在他们的课堂中使用你的 App。
Schoolwork App 也一直在更新，它简化了教师的工作流程，更有效的给教师提供教学信息。
现在我们已经熟悉了 Schoolwork App ，来看看你的 App 中的数据是如何流入 Schoolwork App ？
下图说明了数据流向。你的 App 将数据提交到 ClassKit 框架，ClassKit 将这些数据发布到 Schoolwork App，然后展现给学生和教师。![](https://i.loli.net/2021/07/24/YBZsASP6oWjnRdf.png#id=iwBK8&originHeight=2240&originWidth=3808&originalType=binary&ratio=1&status=done&style=none)
这是 Schoolwork App 的一个界面，可以看到其中一些作业来自使用了 ClassKit 的 App 。
![](https://i.loli.net/2021/07/24/AlUPKCIjdsQc25G.png#id=jSaUQ&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
点击其中一个作业，可以看到一个具体的例子，这个 App 使用了 ClassKit 并报告了学生的学习进度数据。
![](https://i.loli.net/2021/07/24/fZGghnVFRkCtBe4.png#id=UWqrV&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
下文会详细介绍。


## 2.介绍基于文件的新 API ，以及深入回顾之前的内容
App Store 中目前有19万+个教育类 App。其中有很多 App 都使用了 ClassKit 的基于上下文的 API。其他那些没有使用的主要原因是这些 App 是基于文件交互的，不适合基于上下文的 API。
因此这次添加了基于文件的新 API。它非常适合基于文件交互的 App。
使用这个新的 API 后，教师可以在 Schoolwork App 中分配的教学活动然后查看学生们的进度数据。这些内容对他们都非常有利。对开发者来说也减轻了很多工作。
另外需要注意，你开发的 App 必须支持 Open-in-Place，当支持 Open-in-Place 时，学生和老师之间共享的文件才可以在 App 中打开。[Open-in-Place](https://developer.apple.com/cn/document-based-apps/)
​

### 向文件添加进度数据的API：
向文件添加进度数据的 API 是 CLSDataStore 中的 `fetchActivity` ，下图中是这个 API 的异步版本和异步替代版本。调用此 API 时需要传入文件的 URL ，然后会得到 CLSActivity ，获得 CLSActivity 后，就可以添加进度数据了。上述这些方法已经在基于上下文的 API 使用，同时相同的数据类型也可以在基于文件的 API 中使用。下文会具体介绍有哪些类型的进度数据。
![](https://i.loli.net/2021/07/24/vumCYobKIWxjykL.png#id=PEW06&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
### CLSActivity：
CLSActivity 是包含所有进度数据的类，以下是所有可以添加到 CLSActivity 中的数据类型。
![](https://i.loli.net/2021/07/24/uXv6KTGbEZHxflJ.png#id=ksvNa&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
#### 1.duration
`duration` 是学生处理文件花费的时间，处理任何类型的文件都应该添加 `duration`。使用这个 API，只需要调用 CLSActivity 上的 `start` 和 `stop` 方法。
![](https://i.loli.net/2021/07/24/h9V62CJZwlHjPXA.png#id=P7HLN&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
#### 2.progress
如果想通过文件确定学生的进度，就可以使用 `progress`，`progress` 的值介于0和1之间。举例：假设某个音频或视频文件，学生听了或看了50%，就可以将播放进度报告设置为0.5。要添加进度，可以直接设置 `progress` 属性值，
也可以添加某个从开始到结束的范围。可以放心多次添加重叠范围或相同范围，底层会处理以确保向学生和老师报告的进度是正确的。
![](https://i.loli.net/2021/07/24/lbMG9UaeAxDmvZT.png#id=wEus9&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
#### 3.primaryActivityItem 和 additionalActivityItems
如果想给学生和教师突显某些数据，可在 CLSActivity 上设置 `primaryActivityItem` 属性。添加了 `primaryActivityItem` 属性的数据会在 Schoolwork App 的UI中重点显示。
还有一个 `additionalActivityItems` 属性。要添加 `additionalActivityItem` ，对 CLSActivity 调用 `addAdditionalActivityItem` 函数，并传入要添加的 `activityItem`。
![](https://i.loli.net/2021/07/24/V8pzKnsSh2HjbAY.png#id=Sf1cE&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
`primaryActivityItem` 和 `additionalActivityItem` 属性包含以下三个 CLSActivityItem 的子类，可以将下述子类任意组合（一个或者多个或者全部）都添加到一个活动中：
**1）CLSBinaryItem。**
表示任何二进制数据类型。举例：对于测验中的问题。可以用来表示学生得到了正确或错误的答案。
**2）CLSQuantityItem。**
表示任何通用数值。举例：计算文档的页数、幻灯片数或总字数。
**3）CLSScoreItem。**
表示相对于总数的占比是多少。举例：测验的分数，用户得到了8分/10分。
​

## 3.示例
上面介绍了可以添加的数据类型，现在来通过一个具体的示例来演示如何在 App中使用这个 API。这是一个可以打开和编辑文本的示例 App 。
![](https://i.loli.net/2021/07/24/dxhXeIuOaZqpF37.png#id=xwCBJ&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
当学生打开文本文件时，启动计时器，然后学生开始阅读编辑文件。
具体实现：调用 `openFile` 函数，启动计时器开始追踪时间。首先获取文件 URL 的 CLS 活动，获得活动后，调用 `start()` 方法开启定时器，然后调用 `CLSDataStore.shared.save()` 提交更改。
先在这里添加一个断点，稍后在debug时回到这个断点看看调用情况。
![](https://i.loli.net/2021/07/24/jkwiZ2CPERFyl4Y.png#id=qIfrl&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
当学生关闭文件时，记录总字数、停止计时器并添加 `primaryActivityItem`。
具体实现：根据文件 URL 调用 `CLSDataStore.shared.fetchActivity` 获得活动，如果该活动的 `primaryActivityItem` 已经存在，直接进行更新；如果还没有，创建一个新的 `CLSQuantityItem` 。获得 `CLSQuantityItem` 后，将它设置为活动的 `primaryActivityItem`，也可以给活动添加 `progress` 。最后调用 `stop()` 方法停止计时器，这里一定要确保调用了 `CLSDataStore.shared.save()` 。如果没调用，就不会保留所做的任何更改。
然后在这里也添加一个断点。
![](https://i.loli.net/2021/07/24/iMKTehXYxnIFSGR.png#id=WMPbV&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
上述的两个断点可以帮助我们调试提交的学生进度数据。


## 4.如何使用 Schoolwork App 和开发者模式进行调试
首先，设置 ClassKit 的开发环境权限。在 Xcode 这里可以看到，默认值为 production 。在测试阶段需要设置成 development 。重要的一点是确保在完成测试后将其改回到 production 状态。
![](https://i.loli.net/2021/07/24/PqZ1LJGxlFBm9tA.png#id=jXj3y&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
接下来，需要在iPad上打开开发者模式。打开“Settings”，找到“Developer”>“ClassKit API”。然后选择老师，转变角色为教师。
![](https://i.loli.net/2021/07/24/6ZvyEKf82JYw5nV.png#id=UEeOd&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
打开 Schoolwork App，会看到教师界面。
![](https://i.loli.net/2021/07/24/QhkwZfUn2XRSWD6.png#id=XjCYc&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
点击右上角的 Create Assignment 按钮创建作业，添加具体内容，然后发布给班级同学。
![](https://i.loli.net/2021/07/24/SetjEXB1G5MsNDY.png#id=wm4xa&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
创建完作业。回到 “Settings”，找到 “Developer”>“ClassKit API”并点击 Student。转变角色成学生。
![](https://i.loli.net/2021/07/24/4YMf5E2PlSVgO8q.png#id=egHLC&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
回到 Schoolwork App，目前登录身份是学生。屏幕中间显示刚刚创建的作业，点击显示作业详情。
![](https://i.loli.net/2021/07/24/oBqSklwFTPiWJXh.png#id=IzP5g&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
![](https://i.loli.net/2021/07/24/eRU2VtvCZkLImJb.png#id=lWY28&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
点击 Schoolwork App 中的文件图标，此文件在demo App 中打开，启动计时器被调用，开始报告进度数据。可以看到断点被命中。
![](https://i.loli.net/2021/07/24/ZGaPkbyR2S6lFvN.png#id=X5fcl&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
放开断点继续执行，返回到 demo App，会看到学生进度横幅从顶部下降，表明保存成功，计时器启动。
![](https://i.loli.net/2021/07/24/u3QVtPx1nIbiUsc.png#id=A8ATM&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
demo App 中有一个“Done”按钮，学生编辑完文件后点击“Done”按钮，`closeFile` 函数被调用。可以看到第二个断点被命中，此时保存 wordCount 为 `primaryActivityItem` 并停止计时器。
![](https://i.loli.net/2021/07/24/lCHV8T4M9pmeaEG.png#id=xDSWB&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
然后放开断点继续执行，返回到 Schoolwork App，可以看到 demo App 提交的进度数据。
首先，时间41分钟。这验证了正确调用 `start`、`stop` 和 `save` 方法。接下来看看字数是否正确，因为刚才把字数设置为 `primaryActivityItem`。它确实显示在 UI 的主要部分，字数为558个字，说明成功提交了 CLSQuantityItem 。
![](https://i.loli.net/2021/07/24/blcjO73T6VIAktB.png#id=gNw3z&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
现在，角色切换回教师，看看 demo App 提交的数据在教师端如何显示。可以看到所有学生的平均时间和平均字数。以及作业中每个学生的数据。
![](https://i.loli.net/2021/07/24/lRskbvw2oKjtmZu.png#id=fLWgz&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
点击具体学生，可以看到一个学生提交的数据。这里显示 `primaryActivityItem`、`time` 和一个 `additionalActivityItem`：Readability Grade Level 。
![](https://i.loli.net/2021/07/24/Iy9KChJT5bnVaQZ.png#id=qEsAq&originHeight=2160&originWidth=3840&originalType=binary&ratio=1&status=done&style=none)
以上就是如何使用开发人员模式测试 ClassKit 集成情况。最后别忘了把授权重新设置为 production。

## 关注我们

我们是「老司机技术周报」，一个持续追求精品 iOS 内容的技术公众号。欢迎关注。

![](https://images.xiaozhuanlan.com/photo/2021/71326704716a5f65a020bfcc08f409a3.)

**关注有礼，关注【老司机技术周报】，回复「WWDC」，领取 《WWDC20 内参》**
