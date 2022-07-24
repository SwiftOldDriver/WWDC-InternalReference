---
session_ids: [10137]
---

# 基于 Swift Charts 实现高效图表与优质图表设计要素

本文章基于 WWDC22 中 4 个关于 Swift Charts 的 Session 而进行创作：
[Session 10136 - Hello Swift Charts](https://developer.apple.com/videos/play/wwdc2022/10136/)
[Session 10137 - Swift Charts: Raise the bar](https://developer.apple.com/videos/play/wwdc2022/10137/)
[Session 110340 - Design an effective chart](https://developer.apple.com/videos/play/wwdc2022/110340)
[Session 110342 - Design app experiences with charts](https://developer.apple.com/videos/play/wwdc2022/110342/)
建议您在阅读本文章时，对 SwiftUI 的声明式语法有所了解；这里是一个 [SwiftUI 快速上手](https://developer.apple.com/tutorials/swiftui/creating-and-combining-views)



本文将会让大家基于 Swift Charts API 实现从简单到复杂的图表，同时了解一些优质图表的设计体验要素。
当我们聊到 iOS 中图表的绘制，您应该了解现有流行的高分库 [danielgindi/Charts](https://github.com/danielgindi/Charts) ， 其拥有 25.6K stars，能够同时为 Android 和 iOS 提供相同 API 以绘制图标。其中的 iOS 部分基于 CoreGraphics 进行绘制。
Swift Charts 是基于 SwiftUI 的图表框架，同样提供一种简洁的声明式的 API 用于实现各种样式的图表，用法甚至比开源的 Charts 还要精简许多。并且 Swift Charts 有对辅助功能 Accessibility 提供功能丰富的支持，包括读出图表内容，音调式播报数据值，图表交互的朗读，这些能力是 danielgindi/Charts 不具有的，这也是 Swift Charts 的一大优势。
如下图所示，从简单的柱状图与饼图到复杂的向量图和热力图，Swift Chart 都可以少量代码实现：

![image](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/image.png)

在 iOS16 系统的自带 App 中，例如股票 Stock 、健康 Health 等 App 的图表展示与交互是基于 Swift Charts 实现的：

![image](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/image1.png)

接下来我们结合一个具体的例子，来逐步了解 Swift Charts 的使用，这个例子是：
一对搭档运营了一个煎饼餐车，他们提供各式煎饼，包括了美式煎饼、墨西哥塔克、中式煎饼果子等 6 种煎饼类型。煎饼餐车有时会停在库比提诺小镇经营，有时会停在旧金山街头经营。

![image](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/image2.png)

首先我们实现一个最简单的 Chart

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568392541047.jpg)

这个 Chart 中只包含一个数据项 BarChart

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16567519275527.jpg)

正如大家看到的 Chart 充当容器的角色，其中的数据项 Mark 作为数据内容填充在 Chart 中，上面的例子中只有一个 BarMark。
接下来我们试着把煎饼车过去 30 天内所有类型煎饼销售数量，按照煎饼类型都展示出来：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568393069672.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568393319544.jpg)

实现以上代码后，大家可以发现，柱状图的大小、标注标签、坐标的尺度、乃至图表的颜色都自动实现了，Swift Charts API 的一个关键优势就在这里，能够基于 Mark 数据的内容和 SwiftUI 上下文，自动化协调图表中的各种因素，以更美观的呈现。Swift Charts 自动支持 Accessibility 的 VoiceOver 等辅助功能；

因为这辆煎饼餐车有时停在库比提诺营业，有时停在旧金山营业。如果我们希望通过图表对比查看两地的经营数据，我们可以基于过去一周的煎饼售卖数据，按照经营地分组来制作两个图表，并使用 Segment Picker 来切换两个图表。
SwiftUI 的代码非常的简洁，我们在这里使用 mock 数据来生成旧金山和库比提诺的销售数据，并使用 Picker 来切换不同的折线图，代码如下：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568388908445.jpg)

![Screen Recording 2022-07-02 at 20.42.29 -1-](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/screen-recording-20220702-at-204229-1.gif)

结合上面的例子，大家会发现 Swift Charts 提供非常简洁的 API 来为图表元素遍历所有元素；其中的核心是 Mark 以及 Mark 所对应的 Property 属性。
Swift Charts 一共提供了 6 种 Mark ，如下图所示，这些 Mark 的具体效果用途广泛；每个 Mark 都可以通过属性控制 X 与 Y 坐标、颜色、节点、大小、线条点样式。
与此同时，Swift Charts 提供了扩展的能力，你也可以实现自定义的 Mark 和与之对应的属性；
上面的例子带我们简单了解了 Swift Charts 的能力；

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16567666214536.jpg)

Swift Charts 的核心目标是为了实现数据可视化，与此同时也支持了数据交互、辅助功能、本地化、暗黑模式、自动布局、泛型、跨平台与图表动画等能力。
接下来我们就特定单个的 Chart 并结合煎饼餐车的例子，来深入了解一些 Swift Charts API 的实现与控制。以下实例主要关于三个方面：

- 图表的标记和组成
  - 声明式语法
  - 丰富的自定义选项
- 使用合适的标记属性来展示数据
- 图表自定义

## 标记 Mark 与其元素

在 Swift Charts 中 Mark 就是展示的单个数据值项，以我们刚刚煎饼的柱状图为例，每一个柱状条就是一个 Mark ，在这个图表中一共有六个 Mark

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568468120383.jpg)

每一个 Mark 都有丰富的 Property 来控制其表现样式。
比如我们想要在单个图表中，同时显示两个数据项，只需在 Chart 中插入两个 Mark 即可，直接变更 Mark 类型就可以切换 Mark 样式，请看下面的例子：
刚才我们使用 Picker 来切换图表，我们把两个图表合二为一，我们通过两层 For 循环来构建包含两组数据的图表，

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568532359551.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568532380586.jpg)

此时的图表没有像我们想象中的，按照库比提诺和旧金山分为两组数据，要想按组呈现只需要控制 Chart 的 forgroundStyle 属性，并传入 Value 告知 Chart 需要以城市来区分这两组数据，代码如下：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568537842502.jpg)

此时大家可以看到库比提诺和旧金山的数据分组展示了，但是他们在单个 Bar 上堆叠起来。

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568530356370.jpg)

如需按照城市区分两个图表，分为两个 Bar 条来展示，就此我们只需要控制 Chart 的 position 属性，具体代码和效果如下：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568538307928.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568530530754.jpg)

如果我想看看折线图，只需要把 BarMark 变更为 LineMark 就可以得到一个折线图（这里保留了 Chart 的 foregroundStyle 属性），具体代码和效果如下

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568539067138.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568530685320.jpg)

如果想给这个折线图增加一个曲线的润色和数据点的标记符号，只需为单个 LineMark 控制 interpolationMether 和 symbol 属性，具体代码和效果如下

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568539581477.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568530833700.jpg)

上面简单介绍了折线图 LineMark 和柱状图 BarMark 的使用，Swift Charts 还支持以下类型的 Mark ，包括柱状、折线、点图、区域图、规则曲线、矩形图等。你可以结合多种 Mark 的组合展示来实现更复杂图表逻辑。

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568540392986.jpg)

想要组合展示，只需要在同个 Chart 内填充不同类型的 Mark ，比如想要实现一个最大值最小值组成的矩形区域，同时组合平均值曲线图，只需要简单实现 AreaMark 和 LineMark 即可，具体代码和效果如下：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568554956402.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568554991899.jpg)

或者想要实现一个最大值最小值的柱状图，同时叠加展示平均值的值（这个数据展示方式在健康应用内有很多应用），具体代码和效果如下：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568555033474.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16568555053548.jpg)

在 Health App 中我们经常会看到平均值，针对上述界面实现平均值展示，只需新增一个 RuleMark，代码如下图所示，注意此时为其他 Mark 设置了灰色半透明的样式属性，此处代码针对 BarMark 和 RectangleMark 进行了折叠，具体如下：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16569872542214.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16569872770578.jpg)

Swift Charts 支持三种类型数据作为值：

- 数据型（各种整型、浮点等数值）
- 名义型（各种字符串）
- 时间型（各种日期与时间类型的数值）

针对每种 Mark ，通用的常见属性包括 x 、y 、前台样式、线条样式、节点样式、节点尺寸：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16569877967090.jpg)

x 和 y 支持上面提到的三种数据类型；每个 Mark 都会有 x 和 y 两个属性，你可以对调这两个属性的值来展示不同的图表效果；上面的例子，大部分使用默认的颜色和坐标轴，接下来我们聊聊如何自定义坐标轴、数据项和交互等细节。
之前的例子里 Y 坐标都是自动由 Swift Charts 控制的，他们默认为 0-300 之间，假设我想要固定 0-200 的 Y 坐标轴区间，我可以通过 chartYScale 来控制，注意这个属性是 Chart 所有的，具体代码和效果如下

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16569919487851.jpg)

简单的改变坐标轴的区间，只需要一行代码
![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16569920394434.jpg)

如下图所示，图表维度的自定义，主要包括坐标轴、注解和图形区域三部分
![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16569928728212.jpg)

接下来先从 Axes 坐标轴和 Legend 注解着手，结合之前煎饼餐车例子来进一步了解 Swift Charts 的自定义能力
默认情况下，在展示煎饼餐车 12 个月的销售数据时，囿于屏幕宽度，Swift Chart 会按照季度来展示时间的 X 轴

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570180564015.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570180605931.jpg)

假如我们想要按照月份来展示 X 轴，我们可以结合 chartXAxis 属性和 AxisMarks：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570191162464.jpg)

最终效果会如下呈现，我们会发现全拼月份名称无法完整展示，基本都是缩略状态

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570192024840.jpg)

因此采取月份缩写的方式更符合手机尺寸的设备，针对坐标轴，有 GridLine 网格线、Tick 坐标轴交叉标记、ValueLabel 值文本标签三个属性控制。这三个属性可能字面比较难理解，上图

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570228494336.jpg)

三行代码，分别定义了绿色网格线、红色交叉标记和按季度显示的季度 X 轴值标签。

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570240032357.jpg)

具体效果如图

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570240653016.jpg)

当然你也可以对 Y 轴进行类似的自定义，甚至直接隐藏 X 与 Y 轴（在有限可视区区域时，隐藏坐标轴的图表是一种简洁明了的数据展现形式，比如在桌面小组件股票中，就没有坐标轴）：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570257263141.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570256994042.jpg)

上面了解了坐标轴与注解的自定义方法，接下来看看图形绘制区域的自定义方法，直接上例子

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570271109305.jpg)

我们交换了 X 和 Y 轴的值，并通过 plotStyle 设置了 Bar 条为红色，背景为粉红色，图表边框为红色

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/11/16575159826985.jpg)

我们还可以通过 ChartProxy 来获取特定数据值的坐标信息，以及特定坐标对应的数据值，进而我们可以实现跟踪用户对于图表的操作点击事件，直接上代码。
在这段代码中，通过 Chart Proxy 监听 LineMark 来获取用户图表选择区域，并在图表中根据选择起止区域展示了一个 RectangleMark ，这实际上就是 iOS 健康 App 中的一种图表交互。

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570299752857.jpg)

![Screen Recording 2022-07-05 at 22.07.02 -1-](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/screen-recording-20220705-at-220702-1.gif)

综上，通过各种实例绘制了几种图表，会发现 iOS 中很多复杂的图表，都可以使用寥寥几行 Swift Charts 代码实现，因此 API 的简单并不意味实现不了复杂功能，简洁反而是 Swift Charts 和 SwiftUI 的一大优势。
简洁与功能复杂并不是对立的，在 iOS 各种提供图表的 App 中（例如健康和运动），功能复杂仍然能够保持简洁大方的视觉呈现效果；提到了视觉呈现效果，我们可以聊聊两个关于 Swift Charts 设计师的 Session：
[Session 110340 - Design an effective chart](https://developer.apple.com/videos/play/wwdc2022/110340)
[Session 110342 - Design app experiences with charts](https://developer.apple.com/videos/play/wwdc2022/110342/)
设计师由于更关注于视觉，也不会过多关注实现，可以跳脱出工程师关注「实现原理限制」，提出更符合直觉的建议；了解和学习设计师的建议和指南，有助于我们从更全面的视角实现 Charts；
具体而言，苹果设计团队对于数据与图表展现提出一些体验要素指南，各位可以与自己团队的设计师分享这些指南。还是结合我们的煎饼餐车，老板可以通过表格或文本的形式来读取自己的销售数据，但像下面这样的数据呈现形式显然不够直观：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16570719470935.jpg)

从三个维度结合来讨论图表应用：

1. 什么时候应该使用图表
2. 如何使用图表
3. 图表的实际设计逻辑

### 1、 什么时候使用图表

图表可以视觉化展现数据的「变化」「比例」「比较」

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571703727329.jpg)

例如在前述煎饼餐车的例子里，诸如「最近销售数据」「热销煎饼类型」「不同停车位置与时间的数据」都是关键销售数据。
在 App 中，重要的需要让用户关注的复杂数据，推荐以图表方式展现，这就是第一个问题「什么时候使用图表？」的参考答案。

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571706391315.jpg)

### 2、如何使用图表

当我们使用条形图来呈现月销售数据时，加上数据的描述与结论作为辅助，可以让用户更直观的感受到数据的变化，同事了解数据的概括性结论。
因此「对图表辅助加以描述」是一种推荐的图表用法

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571708457717.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571707060470.jpg)

再比如在上述条形图中，我们可以把不同数据进行组合呈现，这可以呈现更具象的对比信息，如下图，按照不同维度来对比展示销售数据

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571712629155.jpg)

而在一些小屏幕或者显示区域较小的场景中，可以使用极简风格的静态图表，此时这些图表不需包含坐标轴信息：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571714109374.jpg)

在大一些的具体图表场景中，可以增加一些用户交互，这样能让用户更全面的了解图表中的信息；与此同时，无论是大的还是小的图表，都应尽量减少图表复杂度，因为图表本身就是为了直观的呈现数据，太过复杂就会导致用户难以获取主要信息，违背了使用图表呈现数据的「简洁」的目的。

![16571716223955](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/24/16571716223955.jpg)


综上，在图表中增加描述性内容，提供可交互的图表与激进的降低图表复杂度，是使用图表的三个建议性原则。

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571717862344.jpg)

### 3、图表的设计系统

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571721108382.jpg)

在 App 内使用一套风格匹配的图表呈现样式，比如在 App 内统一使用风格、宽度、颜色、倒角等设计样式相似的柱状图和线图，同时避免引入过多类型样式的图表；
与此同时，不同图表之间也需要有一些区别，以便用户不会混淆内容；
不同类型数据和结论应考虑用不同图表样式呈现；
下面还是以煎饼餐车为例，该 App 内设计风格一致而和谐的图表系统；

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571728644561.jpg)

上面讲了图表设计的三个建议原则：
本章节我们就「什么时候使用图表」「如何使用图表」「图表的设计逻辑」三方面来提供了一些图表体验要素的指南。

接下来我们聊聊 「Session 110340 Design an effective chart 设计高效清晰的图表」中的内容，我们仍以煎饼餐车为例，本节着重关注在图表呈现效率上（煎饼餐车的日销售数据图表），具体而言是三个方面：
- Focused 清晰明确的
- Approachable 易于理解的
- Accessible 完善的辅助功能支持

煎饼餐车销量数据中，图形、范围、值、最大最小值等维度都可以向用户传达不同的信息，但单个的类型数据的图表传达的意义是有限的，不应在单个图表中堆叠很多类型不同的 Mark。

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571740814846.jpg)

在图表中单个数据项的 Mark 、图表的坐标轴 Axes、文字描述 Description、交互 Interaction 和颜色 Color 决定了图表的呈现效果，下面针对这 5 个维度，围绕高效图表，给出一些设计建议：

### 1、数据项 Mark

比如在选择 Mark 类型时，点图更适合与拨动幅度较小的数据，拨动幅度大时，选择点图呈现会较为混乱。这种情况可以考虑使用线图：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571744240018.jpg)

但当数据中混有 0 的值时，线图的呈现也不够美观，这种情况，使用柱状图是更优雅的呈现方式：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16571745785588.jpg)

Swift Charts API 较为完美的支持了辅助功能，这里就不展开叙述了，有需要的可以参考辅助功能的相关 WWDC21 Session - Bring accessibility to charts in your app。

### 2、坐标轴 Axes

接下来聊聊坐标轴，坐标轴的设计可以让图表区间和数据对比显而易见，比如煎饼餐车日销量图表中，坐标轴只需标注起止日期，就可以轻松传达 30 天的时间跨度；而纵坐标中，设置最高销量值为坐标轴最大值，可以有效利用图表的纵向区域和并发挥对比功能（让对比更加明显）。

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16573595368403.jpg)

在设置中电池的例子中，由于电池电量只会是 0% - 100% ，设置 100% 为坐标轴最大值是一个常识，如果设置为其他值，只会让用户困惑。

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16573596660504.jpg)

在运动 App 中，基于用户每天的步数的实际值而设置纵坐标，可以充分利用图表区域，比如下面两个分别是 3000 和 1500 步：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16573598624294.jpg)

坐标轴上还有网格线和对应的值标签，网格线可以提供区间与值的关系，但过多或过少都不好，具体需要结合实际而言；比如下面的销量表格，纵向 3 条网格线和日期按照周数来区分，是一个较好的分割逻辑：

![16573601167043](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/24/16573601167043.jpg)


### 3、描述性文字

接下来来聊聊图表中的描述性元素，以煎饼餐车为例，在月度销售数据中，添加合适的「结论性描述」，可以更直观的传达数据的结论：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16573603028602.jpg)

在天气 App 中，就采用了这种「结论性描述」的策略

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16573607982416.jpg)

### 4、图表的交互

接下来讲讲图表的交互 Interaction，在健康 App 中，几乎所有的图表都可以进行交互，以查看不同维度数据，或是查看单项 Mark 的值，结合煎饼餐车例子，我们可以为单个 Mark 数据项添加交互标签。具体实现方法在前文有所提及：

。![Screen Recording 2022-07-09 at 18.04.31 -1-](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/screen-recording-20220709-at-180431-1.gif)

### 5、图表的颜色搭配

最后一个议题：图表的颜色。图表的颜色可以用来强调内容，传递特定语境中的意思（股票的红涨绿跌）。合适的颜色组合看上去和谐也可以平衡视觉效果，如系统的浅色与深色主题。下面是一些例子：

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16573621277023.jpg)

__综上，在设计一个高效图表时，需要呈现清晰明确的数据、同时支持易于理解和完善的辅助功能。为了实现这些目标，可以从单个数据项、坐标轴、描述、交互和颜色五个方面着手。__
下图是一些优秀设计范例

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16573622635582.jpg)

![](https://wwdc22.oss-cn-hangzhou.aliyuncs.com/2022/07/10/16573623506043.jpg)

## 总结

- Swift Chart 由 Mark 和 Mark 的属性、坐标轴、值标签、绘制样式等 API 控制；
- Swift Chart 提供了丰富强大的图表绘制能力，与此同时保持响应式 SwiftUI 代码的简洁高效；
- 在设计高效图表时，需要考虑单个数据项、坐标轴、文字描述、交互和颜色搭配等元素；

希望本文对大家绘制图表会有所帮助。
