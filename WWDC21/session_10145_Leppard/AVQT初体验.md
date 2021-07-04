# WWDC21 10145 - Evaluate videos with the Advanced Video Quality Tool

在网络视频行业中，视频压缩技术被广泛采用并服务于在线、离线视频消费场景。但随着用户对体验提出更高的要求，如何选择视频压缩的码率，也是一个值得思考的话题。对用户来说，更快的视频加载/下载速度，更好的画质，就能带来更好的体验。遗憾的是，速度和画质对于视频压缩来说处在天平的两端：低码率的压缩方式，可以带来视频更小的存储体积，更少的带宽占用以及更快的加载速度，但是带来了画面质量的劣化，更大块的马赛克；反过来，高码率压缩方式虽然提升了画面质量和观感，但是会让下载时间变长，对流媒体来说低带宽下的观看卡顿也变严重了。找到这个最优的平衡点，是本次 session 内容想解决的问题。

在用户视觉可接受的前提下，视频压缩力度肯定越大越好。但是视觉可接受的视频画质如何评判呢？我们需要一个可量化的评价指标，且该指标在不同场景下，都能较好地匹配用户实际观感。因此，Apple 出品了一个全新的视频质量评估工具：Advanced Video Quality Tool，简称 AVQT。

本文基于[WWDC2021 10145 - Evaluate videos with the Advanced Video Quality Tool](https://developer.apple.com/videos/play/wwdc2021/10145/)。内容分为五个小节，第一小节简单介绍了 AVQT 的相关概念，其中提到的一些视频专业知识和压缩算法，不在本次 session 的介绍范围之内，感兴趣的读者可在标注出的链接处做延伸阅读；第二小节介绍了 AVQT 输出的评价指标，在横向对比下的优势，以及性能优势；第三小节介绍了 AVQT 在实际场景中的使用表现；第四小节通过一个 Demo 演示介绍了基本的使用方法和工作流；第五小节为总结。

## AVQT是什么

上文提到，为了保证传输流畅，高质量的源视频几乎都要经过压缩，降低码率后才会提供给用户。一个典型的视频传输工作流程如下图：

![视频传输工作流程](https://images.xiaozhuanlan.com/photo/2021/beb2b8cc71fdda19400c1e0155b0dc91.png)

作为视频消费内容的生产者，通过 [AVAssetWriter](Using AVAssetWriter to compress video files for network transfer) 这类 AVFoundation APIs ，或如 [Compressor](https://www.apple.com/final-cut-pro/compressor/) 这类专门的视频压缩软件，都可以进行压缩。但是，无论如何控制压缩参数，压缩过的视频都难免会出现画质的损伤，也就是类似右图中的画面模糊：

![压缩前后视频对比](https://images.xiaozhuanlan.com/photo/2021/7e3305711c5531eae83c529fc37e4d1e.png)

对于用户来说，视频越清晰，越接近源视频，观感越好。但是怎样量化这种观感呢？

我们可以定义一个评分标准，分数范围从 1 到 5，分数越高，代表了画面质量越高。

将视频观感量化成评分，最直观也最简单的方式当然是让真实的用户来观看视频，并基于大致感受打出分数。

但是，这个过程不够自动化，同时也很主观。Apple 这次带来的 AVQT 则可以解决这一问题，它将压缩后的视频和压缩前的源视频同时作为输入，最后输出一个视频质量分数（ 1-5 之间的浮点数）。流程如下：

![AVQT工作流程](https://images.xiaozhuanlan.com/photo/2021/90e4f2070cdb55923bd19a787789cf4f.png)

AVQT 的评估粒度可支持：

* 视频帧维度（video frame）
* 几秒内视频帧聚合成的视频段维度（video segment）

AVFoundation 支持的所有视频格式，都可用于 AVQT 的视频输入，包括：

* [HDR](https://en.wikipedia.org/wiki/High-dynamic-range_video)，包括 HLG，HDR10 和 Dolby Vision（[详解HDR的三个标准](https://blog.csdn.net/charleslei/article/details/80385407)）
* [SDR](https://en.wikipedia.org/wiki/Standard-dynamic-range_video)

目前，AVQT 以命令行工具的形式提供给广大开发者，目前已经发布到了 [AVQT Download](http://developer.apple.com/services-account/download?path=/Developer_Tools/Advanced_Video_Quality_Tool/AdvancedVideoQualityTool.dmg) 供大家下载体验。

## 工具优势

AVQT 作为新推出的画质评价工具，有哪些出众之处呢？我们通过使用者最关心的两个方面，即不同内容场景下的评分表现，以及计算性能来展开介绍。

### 不同场景下评分可信度

在 AVQT 之前，对于图像质量的评价，一般会使用以下两个指标：（[图像质量评价指标之 PSNR 和 SSIM](https://zhuanlan.zhihu.com/p/50757421)）

* PSNR（Peak Signal-to-Noise Ratio）
* SSIM （Structural SIMilarity）

但是，这两个评价指标对于不同内容类型（如动画、自然或体育），评价效果不够稳定；而 AVQT 在对应场景下，都能更好地拟合用户对画质的实际观感和评价。

我们可以来看一个实际的例子。

这里有一段体育类别的视频（称作 A 视频），在源视频的基础上进行压缩，并挑取压缩前后的某一帧来做对比：

<img src="https://images.xiaozhuanlan.com/photo/2021/bcb996b85d7f83db776b8e48f20cc966.png" alt="体育类源视频" style="zoom:50%;" />

<img src="https://images.xiaozhuanlan.com/photo/2021/c9c36763089d9f3e38f09fc13020a2a5.png" alt="体育类压缩视频" style="zoom:50%;" />

因为压缩的力度不大，和相同帧的源画面相比，压缩后的这一帧图像依然保留了很多图片细节。从评分上看，PSNR 和 AVQT 都给出了较高的画质评价分数，符合高画质的用户观感。

接着换一段人像类别的视频（称作 B 视频），压缩前后，截取某一帧对比：

<img src="https://images.xiaozhuanlan.com/photo/2021/ad3e4d336a35e389a8a2949bbec774d3.png" alt="人像原视频" style="zoom:50%;" />

<img src="https://images.xiaozhuanlan.com/photo/2021/934d5cb1fb148042809b64468b5bfa15.png" alt="人像压缩视频" style="zoom:50%;" />

可以看到，背景部分还好，但是人像部分，眼睛眉毛以及头发等部位都出现了比较明显的模糊，面部细节丢失较为严重。评分上，PSNR 依旧给出了 35.2 的较高分，与 A 视频得分一致；但是 AVQT 这次给出了一个中等偏下的评分，相比 PSNR 评分可信度更高，更加符合看上去画质不佳的主观感受。

### 计算性能

由于评价工具需要逐帧或者逐段，对源视频和压缩视频进行对比计算，因此计算速度是这类工具可用性的重要影响因素。由于是 Apple 官方出品，AVQT 天然借力于 [Metal](https://developer.apple.com/metal/)，并基于 Metal 做了算法设计和优化。

数据表现上，典型的几种视频分辨率的计算速度如下：

![计算性能](https://images.xiaozhuanlan.com/photo/2021/b59b49ec7518eec1f0d8e7be9ac9f9c4.png)

对于 1080p 的视频，AVQT 每秒能处理 175 帧。也就是说，一个 10 分钟的 1080p，24Hz 刷新率的视频，AVQT 在 1.5 分钟以内就能给出这个视频的画质评分。

### 其他因素对评分的影响

目前为止，我们只讨论了视频本身的压缩属性对用户的画质感知和评价会造成影响。然而，一些外部的客观条件，例如显示设备的尺寸，分辨率，甚至观看时与显示设备的距离，都会对主观评价造成影响。举个例子：

在 A 场景中，我们用一块 4K 显示器，播放一段 4K 画质的视频，画幅高度记为 H，接着让用户在离显示器 1.5H的 距离外，观看视频；

在 B 场景中，条件不变，但让用户在离显示器 3H 的距离外观看视频。

根据常识可知，在 B 场景中，由于离屏幕更远了，我们更难看出视频压缩后的一些模糊和[伪影](https://www.jianshu.com/p/dbeec7b682f3)，因此相比 A 场景，我们更偏向认为 B 场景的画质看上去更好一些。

而AVQT 在设计时就考虑到了这类客观因素对评分的影响。这些因素包括现实设备尺寸，分辨率，观看距离等，都可以作为工具的输入参数，加入计算，最终影响到评分结果。

以本节提到的 AB 两个场景为例，随着压缩力度减小，压缩后的视频码率越高，不同观看距离下 AVQT 评分变化如图所示：

![AVQT观看距离影响](https://images.xiaozhuanlan.com/photo/2021/e3a97260d3a92e305072f7849964726f.png)

图中横坐标为视频压缩码率，纵坐标为 AVQT 评价分数。从结果我们能获得两个信息：

1. 相同的观看距离下，压缩后码率越高，AVQT 评分越高，符合用户对不同码率的直观感受；
2. 相同压缩码率下，观看距离越远，AVQT 评分越高，符合用户越远观看越难发现压缩模糊和伪影的直观感受。

有了这类因素的参数支持，AVQT 的评分适用场景和范围拓宽了，同时可信度也大大提高了。

## 实际表现

让我们用两组公开的视频画质数据集，测试一下 AVQT 在实际案例中的表现。

### 数据集

数据集分别是：

* [Waterloo IVC 4K](http://ivc.uwaterloo.ca/database/4KVQA.html)
  * 包含了 20 个源视频和 480 个压缩视频；
  * 因为压缩编码和画面缩放产生了视频伪影；
  * 分辨率横跨 2160p、1080p、720p 和 540p；
  * 压缩标准为 H264，HEVC。
* [VQEG HD3](http://www.cdvl.org/)（需要注册后才能看到下载链接）
  * 包含了 9 个源视频和 72 个压缩视频；
  * 因为压缩编码产生了视频伪影；
  * 分辨率均为 1080p；
  * 压缩标准均为 H264。

这两组数据集都是公开且免费的，感兴趣的读者可以点击链接自行下载，用 AVQT 或其他工具来体验压缩画质评估。

### 相关性评估

在对数据集中不同视频都跑出 AVQT 评分后，我们需要评估 AVQT 的评分结果，对真实用户对视频画质的实际感受，拟合程度是否够好。

换句话说，当用户感官觉得压缩视频具有高还原度高画质时，AVQT 也应该有较高评分；反之亦然。因此，我们可以选相同一组视频（包含源视频，压缩视频），将用户实际观看感受评分作为 X 变量，AVQT 评分作为 Y 变量，分析 X 变量和 Y 变量之间的相关性。（[数据相关性分析](https://zhuanlan.zhihu.com/p/343361192)）

对变量的相关性分析，我们会用到两个度量指标：

* [Pearson Correlation Coefficient](https://zh.wikipedia.org/wiki/%E7%9A%AE%E5%B0%94%E9%80%8A%E7%A7%AF%E7%9F%A9%E7%9B%B8%E5%85%B3%E7%B3%BB%E6%95%B0)（简称 PCC）PCC 取值范围为 -1 到 1，1 代表两个变量呈正相关，Y 随着 X 增加必然增加；0 代表两个变量间无相关性；-1 代表两个变量呈负相关。
* [Root Mean Square Error](https://zh.wikipedia.org/zh/%E5%9D%87%E6%96%B9%E6%A0%B9%E8%AF%AF%E5%B7%AE)（简称 RMSE），RMSE 越高，代表两个变量变化越离散，即越不相关。

针对上文中的两个数据集，都能分别生成一组 X 值和一组 Y 值，以此能计算出 X 和 Y 之间的 PCC 和 RMSE。同时，为了能可视化表达，我们利用直角坐标系的 X 轴 Y 轴分别表达 X 变量和 Y 变量，一组视频能对应一个 X 值和一个 Y 值，也对应了坐标系中一个坐标点。

首先，我们将 ”Waterloo IVC 4K“ 数据集的坐标点绘制出来，同时列出其 PCC 和 RMSE：

![数据集1效果](https://images.xiaozhuanlan.com/photo/2021/dd0b62cb786c71f8d82b8e0ccacb9fb4.png)

从图中，我们可以获得以下信息：

1. 总体看，随着主观评分的增加，AVQT 评分也随之增加，二者呈正相关关系，可以大致拟合出 Y=X 的一个函数；
2. PCC 接近 1，数据上佐证了 X 值和 Y 值相关性很强；
3. RMSE 较小，即各个数据点距离 Y=X 的函数直线距离不远，表明噪点和误差较小，AVQT 出现误判的情况不多。

总结来说，在”Waterloo IVC 4K“数据集上，AVQT 的画质评价表现是十分优秀的。

接下来我们换另外一组数据源 “VQEG HD3”。按照同样的步骤，我们也将该数据集的主观评分、AVQT 评分作为 X、Y 坐标绘制出来，同时计算出 PCC 和 RMSE 并列出：

![数据集2效果](https://images.xiaozhuanlan.com/photo/2021/2857b1c99ebae9dabbbea4c49b39f9ad.png)

这组数据集的规模较 ”Waterloo IVC 4K“ 会小一些，但是也足够获得一些信息：

1. 总体看，主观评分和 AVQT 评分仍然呈正相关，且拟合 Y=X 的函数；
2. PCC 更接近 1，X 值和 Y 值有很强相关性；
3. RMSE 更小，每次 AVQT 计算误差更小。

总结来说，在 “VQEG HD3” 数据集上，AVQT 的画质评价有更优的表现。

对两个数据集的计算，最终都得出了主观评分和 AVQT 评分之间近似拟合了 Y=X 函数的结论。我们可以认为，AVQT 评分结果能够近似等于用户的主观评分，可以用于自动化地评判视频压缩画质的好坏，从而指导我们对压缩参数和力度的选择。

## 如何使用

最后，也是大多数用户最关心的，就是如何使用 AVQT。我们通过一次实际操作，来按步骤讲解。

### 评分步骤

1. 下载并安装 AVQT；
2. `which AVQT` 可以查看工具所在的目录，一般都在 `usr/local/bin` 下；
3. `AVQT --help` 可以查看AVQT所支持的不同参数及用法；
4. 在当前目录下准备好一个源视频样本（sample_reference.mov），一个压缩视频样本（sample_compressed.mov）；
5. 通过 `--output参数`，指定好输出评分结果的文件；简单运行：

```shell
AVQT --reference sample_reference.mov --test sample_compressed.mov --output sample_output.csv
```

6. 程序运行完成后，查看 sample_output.csv 文件，结果中不仅包含了每一视频帧的 AVQT 画质评分（图中鼠标位置即是视频第 160 帧的 AVQT 评分），我们还得到了上文提到的按视频段聚合的 AVQT 评分（由于默认的分段时间为 6 秒，而视频样本时长只有 5 秒，所以整个视频只有一段）：

![实际操作评分结果](https://images.xiaozhuanlan.com/photo/2021/d05f5d32bad84beadc7470824df49815.png)

在步骤 5 中，只展示了几个关键的参数，除此之外工具还有一些额外选项可供定制化：

* **metrics**: 视频画质评价指标，选项为：MSE，PSNR，AVQT；默认为 AVQT；
* **segment-duration**: 视频以多少秒分段，即每个视频段多少秒；默认为 6 秒；
* **temporal-pooling**: [时间池化算法](https://www.cnblogs.com/makefile/p/pooling.html)，可选用[算数平均数](https://zh.wikipedia.org/wiki/%E7%AE%97%E6%9C%AF%E5%B9%B3%E5%9D%87%E6%95%B0)，[调和平均数](https://zh.wikipedia.org/wiki/%E8%B0%83%E5%92%8C%E5%B9%B3%E5%9D%87%E6%95%B0)等；
* **output-format**: 输出文件的格式；
* **viewing-distance**: 观看者离显示设备的距离除以显示设备高度；如上文提到的 1.5H，3H，1.5 和 3 就是该参数的输入值；
* **display-resolution**: 显示设备的分辨率，如 1920x1080。

更多参数和功能，可以参考 `--help` 中的帮助，和 README 文档中的介绍。

### 完整流程

使用工具得到评分还不够，实际使用中往往还需要用评分来指导我们对视频压缩参数的选择。即这样一个过程：

![AVQT反馈流程](https://images.xiaozhuanlan.com/photo/2021/2267b0d86f662222c7f033a9931ef99b.png)

1. 为源视频选择一个压缩码率；
2. 进行视频压缩；
3. 用源视频和压缩视频计算出 AVQT 评分；
4. 分析结果：
   * 如果 AVQT 评分很高，说明码率还有优化空间，可以回到步骤 1，考虑降低码率重新压缩；
   * 如果 AVQT 评分刚好达到预期，说明码率目前比较合适，压缩视频可直接使用；
   * 如果 AVQT 评分未达到设定好的预期分数，说明码率过低，可以回到步骤 1，考虑升高码率重新压缩。

以 Apple 的 [HLS](https://developer.apple.com/streaming/) 推流为例，预先需要为我们的源视频选择一个压缩码率。Apple 虽然给出了在[不同分辨率下的推荐码率](https://developer.apple.com/documentation/http_live_streaming/hls_authoring_specification_for_apple_devices)，但是这个推荐码率只是适用于适合 HLS 传输的典型内容场景。由于不同内容有不同的压缩编码复杂性，这也意味着不同内容的最佳压缩码率可能是不同的，这时，压缩码率合理性就需要 AVQT 来帮助判断。

例如我们现在有两个内容场景：

![动画类内容和体育类内容](https://images.xiaozhuanlan.com/photo/2021/3e85753de293b33246701925b93bc3e6.png)

左边是动画类内容，右边是运动类内容。

从 Apple 给出的推荐压缩码率中，我们挑选出一个配置，用于这两个内容视频的压缩：

![为AVQT选择码率](https://images.xiaozhuanlan.com/photo/2021/7190825b6790db4786d718c4896c49db.png)

即 2160p，每秒 11.6Mb 的码率。

对于 2160p 的视频来说，我们期望能看到高质量的视频画质，因此我们将 AVQT 评分阈值定为 4.5，如果压缩后的视频评分能在 4.5 分以上，表示该压缩内容已接近卓越画质，满足我们的需要。

动画内容的视频和体育内容的视频最后的分段评分如下：

![初步评价结果](https://images.xiaozhuanlan.com/photo/2021/daccb635eff562a79e10fde75cffe809.png)

可以看到，对于动画内容视频来说，现有的压缩码率选择足够好了。

但是，对体育内容视频，大部分视频段得分都低于阈值，容易影响整体观看体验，因此需要用这个结果重新调整体育内容视频的压缩码率。

![优化码率选择](https://images.xiaozhuanlan.com/photo/2021/0165cf880176c77c08b470706d234d51.png)

我们将体育类的内容，压缩码率从 11600 调整为 12760，即每秒 12.76Mb。之后再次计算体育类内容的 AVQT 评分：

![反馈后评价结果](https://images.xiaozhuanlan.com/photo/2021/ed24f53cedbdfd95174b3b640300144b.png)

这一次，体育类内容的评分都在 4.5 分之上，满足了我们对压缩后的内容呈现高画质的要求。

## 总结

作为 Apple 官方推出的压缩视频画质评价新工具，AVQT 填补了这一领域的工具空缺，方便广大开发者和用户进行自动化的画质评价，并用其来指导压缩码率的选择。

同时，通过 session 中的介绍和案例实践，我们也能感受到 AVQT 的鲜明特色：

* 支持所有基于 AVFoundation 的视频格式；
* 兼容不同内容场景，评分可信度高；
* 计算性能佳；
* 工具兼顾到了多种会影响用户实际观看时对画质评价的因素，如显示设备的尺寸，分辨率，甚至观看时与显示设备的距离等；
* 操作简单，参数易用。

然而，由于截止发稿前官方刚发布了工具下载链接 [AVQT Download](https://developer.apple.com/download/)，潜在的使用问题还未暴露出来，细节的使用方式也还等待读者们详细查阅工具 README。

另外，目前工具的表现仅限于 session 中提到的几个 Demo 视频评分。究竟最终服务于各个场景和各类需求时，实战效果如何，大家拭目以待。