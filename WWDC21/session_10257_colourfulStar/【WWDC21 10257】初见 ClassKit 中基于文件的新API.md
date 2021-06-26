基于 [Session 10257](https://developer.apple.com/videos/play/wwdc2021/10257/) 梳理
​

> 作者：张茜倩，iOS开发，目前就职于好未来新励步。

​


- **前言**

ClassKit 是有关教学活动内容的框架，本 Session 将介绍如何使用 ClassKit 最新的 file-based API ，把学生各种类型的进度数据、学习情况报告给教师，以及如何在开发者模式下测试。
（个人感觉这篇 Session 不仅适合开发看，更适合产品看。😂）


- **关于 ClassKit **

Apple 首次在 WWDC2018 提出 ClassKit。支持 iOS 11.4+ 系统。
ClassKit 可以让自己开发的 App 参与到一个虚拟教室里，需要和 Apple 推出的教育生态  [Apple School Manager and Managed Apple IDs](https://www.apple.com/education/it/) ，还有 Schoolwork App 配合使用。
ClassKit 专门为教育类 App 设计，可以帮助减轻一些工作。举例：你要开发的 App 的功能之一是教师发布作业，作业内容是学生查看和编辑文档、答题，并且记录学生们的学习情况（学习情况：每一个同学是否完成作业、观看时长、完成进度、答题正确率等）。使用 ClassKit 后，你就不需要再为上述情况写逻辑代码或者界面代码，也不需要修改已有的逻辑。教师可以直接在 SchoolWork App 上创建分配有关你 App 内容的教学活动，和查看学生进度。
【WWDC18 Session 215】[Introducing ClassKit](https://developer.apple.com/videos/play/wwdc2018/215)
​


- **关于 Apple School Manager and Managed Apple IDs **

Apple 在 WWDC2018 发布的教育计划，教师需要使用 Apple School Manager 为学生单独或批量创建 Apple ID 。在美国 Apple 会和学校合作，在课堂中使用。
还推出了两款教育 App，**Classroom**：帮助教师管理学生使他们专注于学习任务。**SchoolWork**：帮助教师管理和分发作业，查看进度。


- **国内教育类 App 现状，使用 ClassKit 的可行性**

作者本人有国内互联网K12教育行业五年经验，目前没有听过任何一家国内互联网教育公司使用 ClassKit 。😂
国内K12教育类 App 主要形式有：真人在线直播课、AI互动类直播课、录播课、绘本类、游戏类。教学活动，学习情况一般会直接展示在 App 内（排名、获奖等）用来激励学生学习兴趣。
分析国内没使用 ClassKit 的主要原因：

1. ClassKit 受众用户比较窄：只支持 iOS 。需要对iOS再专门设计一套定制产品。
1. 需要使用 Apple School Manager 给学生创建 Apple ID。需要有校区和班级。
1. 需要和 Classroom App 和 SchoolWork App 配合使用。用户除了下载目标 App，还需要下载另外两款 App，才能使用。学习成本比较高。
1. ClassKit 会剥夺有关激励学生的一些产品设计。

个人感觉国内使用 ClassKit 的可能性很小。
（另外本文写于2021.06，虽然最近一些政策对教育行业影响蛮大，但是我认为科技对教育的贡献还是很大的。
在线直播课、录播课：可以让各个地区的孩子看同一个优秀老师的课程。
AI评测：评测准确率高，减轻教师重复性工作量。
绘本类游戏类学习方式：增强学习趣味性，让简单枯燥的学习体验变的非常有趣，激发学生兴趣。
而且 Apple 这不也出了教育相关的 API， 因此我认为教育类 App 不会彻底消失～）



---

以下是 Session 10257 的具体内容
​

​

快速导航 =======不知道怎么加


## 1.回顾 Schoolwork App，如何与 ClassKit 一起使用
在 App 中使用了 ClassKit 框架，发布了教学内容（CLSContexts）并开始报告学习进度数据后，教师就能在 Schoolwork App 上分配该内容并查看进度数据。因此如果你的 App 使用了 ClassKit ，教师们会更愿意在他们的课堂中使用你的 App。
Schoolwork App 也一直在更新，它简化了教师的工作流程，更有效的给教师提供教学信息。
现在我们已经熟悉了 Schoolwork App ，来看看你的 App 中的数据是如何流入 Schoolwork App ？
你的 App 将数据提交到 ClassKit 框架。ClassKit 将这些数据发布到 Schoolwork App 然后展现给学生和教师。![截屏2021-06-20 下午5.30.30.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624181448808-0fb32949-0b6b-495e-a76e-b3c75f690d82.png#clientId=udc0e2b48-cd4b-4&from=drop&id=ue7cbd6cb&margin=%5Bobject%20Object%5D&name=%E6%88%AA%E5%B1%8F2021-06-20%20%E4%B8%8B%E5%8D%885.30.30.png&originHeight=2240&originWidth=3808&originalType=binary&ratio=2&size=1568513&status=done&style=none&taskId=u44e33aad-19ed-4153-8d06-0597793b401)这是 Schoolwork App 的一个界面，可以看到其中一些作业来自使用了 ClassKit 的 App。
![截屏2021-06-20 下午5.33.41.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624181653301-255ccdfd-d6b9-42aa-8bbd-9f8986ff8601.png#clientId=udc0e2b48-cd4b-4&from=drop&id=uc97cead8&margin=%5Bobject%20Object%5D&name=%E6%88%AA%E5%B1%8F2021-06-20%20%E4%B8%8B%E5%8D%885.33.41.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1364735&status=done&style=none&taskId=u97a7ccd5-498e-4a3b-8c7d-230bcd89613)
点击其中一个作业，可以看到一个具体的例子，这个 App 使用了 ClassKit 并报告了学生的学习进度数据。
![截屏2021-06-20 下午5.35.27.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624181738237-2c4953eb-681f-4544-b752-1ddbd24fbc61.png#clientId=udc0e2b48-cd4b-4&from=drop&id=u759e2dc9&margin=%5Bobject%20Object%5D&name=%E6%88%AA%E5%B1%8F2021-06-20%20%E4%B8%8B%E5%8D%885.35.27.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1177228&status=done&style=none&taskId=ufa62e04a-7115-4882-94da-43083941ede)
下面的文章会详细介绍。


## 2.介绍基于文件的新 API ，以及深入回顾之前的内容
App Store 中目前有19万+个教育类 App。其中有很多 App 都使用了 ClassKit 的基于上下文的 API。其他那些没有使用的主要原因是这些 App 是基于文件交互，不适合基于上下文的 API。
因此添加了基于文件的新 API。它非常适合与文件交互的 App。
使用这个新的 API 后，教师可以在 Schoolwork App 中分配的教学活动和查看学生们的进度数据。这些内容对他们都非常有利。对开发者也减轻了很多工作。
另外需要注意，你开发的 App 必须支持 Open-in-Place，当支持 Open-in-Place 时，学生和老师之间共享的文件才可以在 App 中打开。
​

### 向文件添加进度数据的API：
向文件添加进度数据的 API 是 CLSDataStore 中的 fetchActivity ，下面图片中是这个 API 的异步版本和异步替代版本。调用此 API 时需要传入文件的 URL ，然后会得到 CLSActivity ，获得 CLSActivity 后，就可以添加进度数据了。这些方法正在基于上下文的 API 使用，同时相同的数据类型也可以在基于文件的 API 中使用。下文会具体介绍有哪些类型的进度数据。
![截屏2021-06-20 下午7.12.48.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624187703649-9157721f-9372-4a30-801d-a53de0197515.png#clientId=udc0e2b48-cd4b-4&from=drop&id=u37ec5e73&margin=%5Bobject%20Object%5D&name=%E6%88%AA%E5%B1%8F2021-06-20%20%E4%B8%8B%E5%8D%887.12.48.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=829411&status=done&style=none&taskId=u024ce5ec-22da-4eb7-a130-9e262d8a955)
### CLSActivity：
CLSActivity 是包含所有进度数据的类，以下是可以添加到 CLSActivity 中的数据类型。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624189309586-5624a338-ac8a-4b38-ac6e-3e3075c93636.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=E4Gmc&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1011464&status=done&style=none&taskId=ubeb4af31-112a-41bf-8087-ae0f4dc1ae7&width=1920)
#### 1.duration
duration 是学生处理文件花费的时间，处理任何类型的文件都应该添加 duration。使用这个 API，只需要调用CLSActivity上的start和stop方法。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624189639960-cdedc713-0a1d-4d28-b2a2-49cefd3b7a0e.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=ucd8da6ff&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=446005&status=done&style=none&taskId=u7e61b92a-9dbd-4ab0-919d-5d0b576ed7b&width=1920)
#### 2.progress
progress 的值介于0和1之间，如果想通过文件确定学生的进度，就可以使用 progress。举例：假设某个音频或视频文件，学生听了或看了50%，就可以将播放进度报告设置为0.5。要添加进度，可以直接设置 progress 属性值，
也可以添加某个从开始到结束的范围。可以放心多次添加重叠范围或相同范围，底层会处理以确保向学生和老师报告的进度是正确的。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624190642172-f09dd5c2-816b-404c-bfaa-063a828a1f77.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=u73d77c51&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=638023&status=done&style=none&taskId=ud0097c36-a96b-4499-b473-438936b4ad8&width=1920)
#### 3.primaryActivityItem 和 additionalActivityItems
如果想给学生和教师突出显示某些数据，可在 CLSActivity 上设置 primaryActivityItem 属性。添加了 primaryActivityItem 属性的数据会在 Schoolwork App 的UI中重点显示。
还有一个 additionalActivityItems 属性。要添加 additionalActivityItem ，对 CLSActivity 调用 addAdditionalActivityItem 函数，并传入要添加的activityItem。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624195612246-40ab3cfd-4193-470c-9e38-11a455c17f4f.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=u8e60958d&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=701804&status=done&style=none&taskId=u512c4586-db92-4b65-897f-edac9057be1&width=1920)
primaryActivityItem 和 additionalActivityItem 属性包含以下三个 CLSActivityItem 的子类，可以将下述子类任意组合（一个或者多个或者全部）都添加到一个活动中：
**1）CLSBinaryItem。**
表示任何二进制数据类型。举例：对于测验中的问题。可以用来表示学生得到了正确或错误的答案。
**2）CLSQuantityItem。**
表示任何通用数值。举例：计算文档的页数、幻灯片数或总字数。
**3）CLSScoreItem。**
表示相对于总数的占比是多少。例如，测验的分数；用户得到了8分/10分。
​

## 3.示例
上面介绍了可以添加的数据类型，现在来通过一个具体的示例来演示如何在 App中使用这个 API。这是一个可以打开和编辑文本的示例 App 。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624203479364-b486303c-b9ec-48b0-953c-a2352be8ccb4.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=u8297f049&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1643718&status=done&style=none&taskId=uf5273b27-d877-49e8-bff8-d1ac27ff1cc&width=1920)
当学生打开文本文件时，启动计时器，然后学生开始阅读编辑文件。
具体实现：调用 openFile 函数，启动计时器开始追踪时间。首先获取文件 URL 的 CLS 活动，获得活动后，调用 start() 方法开启定时器，然后调用 CLSDataStore.shared.save() 提交更改。
先在这里添加一个断点，稍后在debug时回到这个断点看看调用情况。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624203789574-b10d1e03-d227-4c11-ad66-44ed3fc85ae8.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=u6de7deb3&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1315319&status=done&style=none&taskId=u4e6de660-374e-4231-b8df-c30ab47daac&width=1920)
当学生关闭文件时，记录总字数、停止计时器并添加 primaryActivityItem。
具体实现：根据文件 URL 调用 CLSDataStore.shared.fetchActivity 获得活动，如果该活动的 primaryActivityItem已经存在，直接进行更新；如果还没有，创建一个新的 CLSQuantityItem 。获得 CLSQuantityItem 后，将它设置为活动的 primaryActivityItem，也可以给活动添加 progress 。最后调用 stop() 方法停止计时器，这里一定要确保调用了 CLSDataStore.shared.save() 。如果没调用，就不会保留所做的任何更改。
然后在这里也添加一个断点。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624205341641-86877f34-3f99-4b97-9e8b-2e3c7344a3e4.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=ude6fa31f&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=2196040&status=done&style=none&taskId=ude0dd5d1-ed95-435c-b21a-c4db0308940&width=1920)
上述的两个断点可以帮助我们调试提交的学生进度数据。


## 4.如何使用 Schoolwork App 和开发者模式进行调试
首先，设置 ClassKit 的开发环境权限。在 Xcode 这里可以看到，默认值为 production 。在测试阶段需要设置成 development 。重要的一点是确保在完成测试后将其改回到 production 状态。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624206026608-dd30fc9b-21c4-46d8-ab4b-1b75d06810ce.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=u9edc2950&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=508938&status=done&style=none&taskId=u2bc63b56-497e-4d2d-86b4-b34a51e5566&width=1920)
接下来，需要在iPad上打开开发者模式。打开“Settings”，找到“Developer”>“ClassKit API”。然后选择老师，转变角色为教师。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624206219678-1ee07d82-29ba-44b4-847d-c54110483f8c.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=u1e7e8f6c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1053432&status=done&style=none&taskId=udbe0c5c0-6ad2-415b-9f92-633d3abba97&width=1920)
打开 Schoolwork App，会看到教师界面。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624206295032-af26a95c-76b0-4d60-b712-76b79c2e9fae.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=uc9f162a4&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=926623&status=done&style=none&taskId=u12144967-edbb-4c47-ac7b-9cfbf92e31d&width=1920)
点击右上角的 Create Assignment 按钮创建作业，添加具体内容，然后发布给班级同学。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624206458403-03ed09d5-1604-4b97-9b72-fc8dd995c12c.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=ubfae9f91&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1559020&status=done&style=none&taskId=u8cd9d04d-ceed-4cbc-bd65-80b55096a3f&width=1920)
创建完作业。回到 “Settings”，找到 “Developer”>“ClassKit API”并点击Student。转变角色成学生。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624206665219-497b8657-4a90-46c5-85f3-2c7b360e88c0.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=ueb253e1b&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1151873&status=done&style=none&taskId=uec389a66-94ff-471c-881d-303f51de675&width=1920)
回到 Schoolwork App，目前登录身份是学生。屏幕中间显示刚刚创建的作业，点击显示作业详情。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624206762043-f681640e-8cce-46af-898c-1d5028b3292a.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=u551a3cc5&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=868572&status=done&style=none&taskId=u8ab8f466-238c-40ba-bd0c-2425e59359b&width=1920)
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624206807899-394fb88d-c412-400b-9971-d00b0e445194.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=uec0a2bbb&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=953249&status=done&style=none&taskId=u5962750d-4054-44fb-a1c4-7bb3f48c61e&width=1920)
点击 Schoolwork App 中的文件图标，此文件在demo App 中打开，启动计时器被调用，开始报告进度数据。可以看到断点被命中。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624207036117-c842a71f-7a56-4cbd-bc69-8c48e2e40e05.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=u5e33144e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1372172&status=done&style=none&taskId=u3ec032dd-8804-4a80-8a13-53e750382a4&width=1920)
放开断点继续执行，返回到demo App，会看到学生进度横幅从顶部下降，表明保存成功，计时器启动。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624207133449-7dbce15e-1b54-4c63-badd-b632b1adcdcc.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=uef6a8ef8&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1707776&status=done&style=none&taskId=ue00a7b3a-0305-4728-a577-b6094e60027&width=1920)
demo App 中有一个“Done”按钮，学生编辑完文件后点击“Done”按钮，closeFile 函数被调用。可以看到第二个断点被命中，此时保存 wordCount 为 primaryActivityItem 并停止计时器。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624207427770-72d2c767-9c07-41bc-81d8-5819a3f45762.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=ufc25fc5e&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=2308977&status=done&style=none&taskId=uffed0220-da92-4a9f-8060-7fa21a376e8&width=1920)
然后放开断点继续执行，返回到 Schoolwork App，可以看到 demo App 提交的进度数据。
首先，时间41分钟。这验证了正确调用 start、stop 和 save方法。接下来看看字数是否正确，因为刚才把字数设置为 primaryActivityItem。它确实显示在 UI 的主要部分，字数为558个字，说明成功提交了 CLSQuantityItem 。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624207749415-30f0a27a-22f7-443e-a5e6-ca3f554faa01.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=u69f56691&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1200239&status=done&style=none&taskId=u1caeb643-f6b3-46ea-9ec0-b391331a799&width=1920)
现在，角色切换回教师，看看 demo App 提交的数据在教师端如何显示。可以看到所有学生的平均时间和平均字数。以及作业中每个学生的数据。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624207913947-8fd32d84-4208-40d8-9cae-52db53646031.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=sRXVj&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1533436&status=done&style=none&taskId=u088ad243-4bb5-47f5-894a-1cc339e2a1a&width=1920)
点击具体学生，可以看到一个学生提交的数据。这里显示 primaryActivityItem、time 和一个 additionalActivityItem：Readability Grade Level 。
![image.png](https://cdn.nlark.com/yuque/0/2021/png/21885541/1624208013603-a89907a2-d7e2-4beb-823e-ac6f98d79620.png#clientId=udc0e2b48-cd4b-4&from=paste&height=1080&id=u848f1cfd&margin=%5Bobject%20Object%5D&name=image.png&originHeight=2160&originWidth=3840&originalType=binary&ratio=2&size=1712771&status=done&style=none&taskId=u49f4a74b-1ea5-4639-a002-de44b8559f9&width=1920)
以上就是如何使用开发人员模式测试 ClassKit 集成情况。最后别忘了把授权重新设置为 production。
​

​

​

​

