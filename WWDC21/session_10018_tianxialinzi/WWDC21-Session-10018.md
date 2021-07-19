---

title: "WWDC21 - What's new in SwiftUI"
title: "WWDC21 - Craft search experiences in SwiftUI"
date: 2021-06-17T00:00:00+00:00
draft: false
tags: [iOS', WWDC21', 'SwiftUI']
categories: ['iOS', 'WWDC', 'SwiftUI']
author: "天下林子"
---


![image.png](https://upload-images.jianshu.io/upload_images/2121032-c91ca811799888d8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


>

WWDC21 Session 10018 - [Discover concurrency in SwiftUI](https://developer.apple.com/videos/play/wwdc2021-10018)

>


# 本文知识目录

![What’s New in SwiftUI.png](https://upload-images.jianshu.io/upload_images/2121032-3c43637d1f857819.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



# 引言

SwiftUI于2019年首次发布，引入了一种比较强大的新方式，以声明式、状态驱动的风格构建用户界面。这次发布，对于SwiftUI来说，也有很重要的改进，主要可以概括为以下几个部分：
* 通过`AsyncImage`支持异步加载图像
* 可以在所有平台上使用的视图修改器`Searchable`
* 创建一个带有schedule的`TimelineView`
* 在iOS 15 的 UIKit中，又为我们带来更多按钮样式，比如 Toggle按钮，Pop-up 按钮等.

# Better lists


### AsyncImage

今年，我们使编写丰富、交互式列表和网格变得更加容易，SwiftUI内置了异步加载图像的支持，在SwiftUI中，使用AsyncImage视图来加载图片列表数据，只需给它一个URL，SwiftUI将自动为你获取和显示远程图像，甚至提供默认占位符。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-f31a830f03fa26dc.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

AsyncImage也可以自定义。例如，我们可以为加载的图像添加修饰符，也可以定义自定义占位符.

![image.png](https://upload-images.jianshu.io/upload_images/2121032-d4ec4addc98ae727.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


我们甚至可以添加自定义动画和错误处理。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-7e8dc22d205da331.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

AsyncImage会立即加载其内容，但有时你的应用程序需要按需加载内容，例如在显示提要时，在iOS和iPadOS上使用新的可刷新修饰符。此修饰符配置刷新操作并传递到环境中。iOS和iPadOS上的列表使用此操作自动添加拉取刷新，但你也可以使用它构建自己的自定义刷新行为。

### await


![image.png](https://upload-images.jianshu.io/upload_images/2121032-2ad4ec2ad9b94e9c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

```

.task {
    await photoStore.updateItems()
}

```
在上面代码段中，你会注意到这里也使用了await关键字，它是Swift 5.5中新的并发语言特性之一，updateItems方法是一个异步操作，它允许我们在不阻塞UI的情况下刷新列表。另一个与并发相关的switui新特性是任务修改器，这个API允许你将异步任务附加到视图的生命周期中。这意味着该任务将在视图首次加载时启动，并在视图被删除时自动取消。
这是我们自动加载第一批照片的好方法。这些新的并发修饰器表面上看起来很简单，但可以用于在应用中构建复杂的异步行为。下面举个例子

![image.png](https://upload-images.jianshu.io/upload_images/2121032-e703b552a831463e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


我设置了一个任务，当最新的照片可用时加载它们。我只编写了一个常规的for循环，但是你会注意到这里也使用了await关键字。当将异步等待最新的newItem，只在下一个newItem可用时才迭代循环。这意味着我们实际上将大量的功能打包到这个单一的修改器中。视图启动一个任务，当它出现时就异步侦听newItem，每次新的newItem变为可用时更新列表，然后当视图消失时自动取消任务，所有这些都不会阻塞我们的应用程序的UI。


关于Swift并发以及如何在SwiftUI中利用它，还有很多东西需要了解，因此我们准备了一些其他讲座来深入了解细节。可以阅读[Discover concurrency in SwiftUI]()

![image.png](https://upload-images.jianshu.io/upload_images/2121032-40c7b1bf4e458e94.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



###  $ 运算符
> 接下来，我们将为你提供新的更好的方法，将交互性构建到你的列表内容中。

在这个例子中，我写了一个简单的列表，关于我的超级秘密藏身之处。在这个列表中文本是不可编辑。如何解决这个问题呢？

我们可以将文本替换为文本域，从而使文本可编辑。
但是，文本字段需要绑定到文本。在列表闭包中，只给集合中的每个元素提供一个普通值，而不是绑定。在这种情况下，要弄清楚如何为每一行获得集合元素的绑定可能会比较棘手。
一种常见的方法是遍历获取集合的索引，使用下标来获得与该索引处的元素的绑定。
然而，不建议使用此方式，因为当任何元素更改时，SwiftUI将被迫重新加载整个列表。

下面我们看看更好的解决方案
今年，SwiftUI为访问集合中的单个元素提供了一种更容易的绑定方式。只需使用 "$" 符号运算符将集合的绑定传递到列表中，SwiftUI将向闭包中的每个单个元素传递绑定

这种新语法是Swift语言的一部分,我们可以在列表中的ForEach视图中使用相同的技术
![image.png](https://upload-images.jianshu.io/upload_images/2121032-5b27c6011205e40a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


另外，对于自定义列表，也增加了新的方法："listRowSeparatorTint" 和“listRowSeparator”
使用 listRowSeparatorTint ，你可以更改单个行分隔符的颜色，
使用listRowSeparator ，可以将分隔符配置为隐藏

![image.png](https://upload-images.jianshu.io/upload_images/2121032-1caf9f703312b25b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


### swipeActions

今年，SwiftUI允许你使用新的swipeActions修饰符定义完全自定义的滑动动作。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-3591d310e6efb7d9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


你可以像SwiftUI中的任何其他类型的菜单一样配置滑动动作，为按钮添加自定义动画，你也可以通过添加新的色彩修改器来定制它们的颜色，默认情况下，SwiftUI在行尾边缘显示滑动动作。使用swipeActions，你可以设置edge参数将它们切换到前边，你甚至可以通过添加多个具有不同边缘配置的修改器来支持左滑和右滑动作。
swipeActions修饰符在每个支持它们的平台上都可用，快来试试吧！

# Beyond lists


### FetchRequests
今年，SwiftUI对CoreData，新增加了几种获取请求的方式，FetchRequests现在提供了一个与它们的排序描述符的绑定，我们可以将其传递给Table，允许我们只用几行代码编写一个完全Core data驱动的表，包含选择和可排序的列。
SwiftUI现在还提供了一个分段获取请求，允许从单个请求驱动复杂的、多分段列表，如下图右边列表。如下图

![image.png](https://upload-images.jianshu.io/upload_images/2121032-680c58059feb107c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在这个例子中，根据数据是否被固定而将其划分为多个部分，使用多个 SortDescriptors来排列数据，并将其分割为固定的和未固定的部分，对最近修改的cell进行排序。根据请求的结果动态的构造表的section和row


### Search 搜索
搜索是我们所有平台的关键部分。由于搜索是一个多平台的问题，它需要一个可以跨所有这些设备扩展的多平台解决方案。
### Searchable

Searchable是SwiftUI中的一个新的视图修改器，可在所有平台上使用。
它允许你将查看内容标记为可搜索的。为了更好地理解Searchable，我们以iOS的天气应用为例。


![image.png](https://upload-images.jianshu.io/upload_images/2121032-c9f9030eaf97d455.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


让我们来分析一下它们的UI结构。
界面从一个导航视图开始，导航视图提供了一个导航栏。
Weather添加一个自定义列表作为导航视图的内容。
在该列表中，它在单元格上添加了一个ForEach。
最后，Weather在其导航视图中添加了可搜索的修饰符。
所有可搜索修饰符的核心是搜索字段的配置。可搜索修饰符获取已配置的搜索字段，并通过环境向下传递，代码如下：

![image.png](https://upload-images.jianshu.io/upload_images/2121032-9db86eccebfb401a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


可搜索修饰符会设置一个名为isSearching的新环境属性，使用该属性根据用户是否搜索来动态更改显示的视图。当查询isSearching环境属性和搜索文本以有条件地显示其结果视图。当展示搜索结果时，在原来视图的基础上新增一个视图，这样在用户从他们的搜索交互返回后，主UI的状态不会改变。


###  Suggestions

SwiftUI提供了一种向应用程序添加搜索建议的简单方法：Suggestions，就是当你在搜索的时候，下面的提示按钮，在iphoneOS 和MacOS 以及watch上都有，如下图：

![image.png](https://upload-images.jianshu.io/upload_images/2121032-4001cc5b6ec8c113.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![image.png](https://upload-images.jianshu.io/upload_images/2121032-831803b0e029a148.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![image.png](https://upload-images.jianshu.io/upload_images/2121032-66f48ac80f0465f3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



对于suggestion参数，可以通过上面的图片知道，这可能只是几个静态按钮，这些数据可以是本地的，也可以来自服务器，

如果你在创建一个应用程序，当用户点击搜索框下面推荐的搜索建议的文本时，可以 根据suggestion获取完整的搜索结果，那么可以考虑使用新的onSubmit修饰符来知道何时获取搜索结果。
将search的值传递给onSubmit修饰符，每当用户提交搜索查询时，就会调用你提供的闭包。这种情况一般会出现在选择一个搜索建议或按硬件键盘上的Enter。你还可以将新的onSubmit修饰符与文本字段或安全字段一起用于与搜索无关的提交。代码如下：

```
//onSubmit

.searchable(text: $text) {
    MySearchSuggestions()
}
.onSubmit(of: .search) {
    fetchResult()
}

```



# Advanced graphics
对于图像，今年有一堆令人兴奋的改进:从符号更新，到强大的新画布视图。首先是符号。

### SF Symbols 

SF Symbols是一个非常简单而且好用的符号，它可以添加到你整个应用程序，除此之外，今年还有很多新的Symbols，并且它们附带了一些新功能，使它们在你的应用程序中更容易使用，更富有表现力。有两种新的呈现模式可以让你对符号的样式有更多的控制。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-633ecd0ab47db733.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


层次结构使用上面的前景样式可以为符号上色，就像单色一样，但会自动添加多级不透明度来真正强调符号的关键元素。调色板可以让你更细粒度地控制符号的各个层，并自定义填充。除了不同的颜色，符号也有许多不同的形状。许多符号都有修饰符，可以显示为填充的，圈起来的，等等。
在swift 5.5之前，你需要对这些符号进行硬编码，今年，你不用担心了，swifttui将根据你使用它的上下文自动为你选择正确的符号属性。所以你所要做的就是提供你想要使用的基本符号。

使用方式可参考下面代码：

![image.png](https://upload-images.jianshu.io/upload_images/2121032-37f75380624be73c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


### Canvas 
Canvas(画布)适用于所有平台。因为Canvas是一个类似于其他视图的视图，我们也可以添加手势、可访问性信息，并基于状态或环境(如适应黑暗模式)更新它。你可以通过添加手势点击和拖动，随着光标在屏幕上移动，每个符号都会平滑地更新。我们还可以利用一个新的accessibilityChildren 修饰符来确保这是完全可访问的。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-7a04b1201f0b8d7f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

很酷的一点是，你重用了在SwiftUI中使用过的相同视图，来完善可访问性特性，在这种情况下，可以像其他人浏览列表中的元素一样枚举符号，在浏览每个元素时说出每个元素。accessibilityChildren 并不局限于Canvas，但可以用于任何视图。我们可以添加到画布的最后一件事是使用新的TimelineView随时更新。

### TimelineView

TimelineView创建时带有一个schedule(时间表),上面的例子中是动画时间表，它提供了渲染的当前时间。
我们可以利用这段时间更新变换中的focalPoint，创建漂亮的符号屏保。
这个TimelineView可以做很多事情。
在Apple Watch 中，有一个非常酷的功能是它的Always On display。以前，你的应用程序将模糊与时间覆盖时，它进入总是On状态。
有了watchOS 8，你的应用现在默认变暗，你可以通过swifti提供你需要的工具来更好地控制它的显示方式，TimelineView就是其中之一。一旦手表进入它的Always On状态，TimelineView可以预加载你的视图在未来日期的显示。
当我们进入未来，这些视图会自动显示在屏幕上而不用把你的应用从背景中取出。
其中一个关键的部分是时间表。

TimelineView可以预先加载每分钟的显示，在浏览器中向我显示下一个符号。
还有一些其他类型的日程安排也可以帮助你满足应用的需求，比如明确的日期集合，这对于在特定时间有事件非常有效。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-6303eb5bcba51ec3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


TimelineView 的另一个重要方面是隐藏用户敏感信息，因为它可能对其他人可见。
我想把我最喜欢的符号保密。通过简单地添加 privacySensitive 修饰符，当手表进入Always On状态时，它将自动编校，这个隐私敏感的修饰符也适用于小组件。通过此功能可以在设备仍处于锁定状态时隐藏敏感信息，并在设备解锁时显示。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-54c0f01df02135b1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### previews in Xcode

Xcode中对SwiftUI预览的一些增强也起到了补充作用。
* 新的预览方向修改器，允许你在预览中指定iOS设备的方向，甚至可以混合和匹配不同方向的预览。
* 在预览中编辑和查看应用程序的可访问性方面有了很大的改进。
* 属性编辑器现在有一个辅助的可访问性修饰符列表，使得优化视图的可访问性行为更加容易。
* 全新的方式来查看你的预览与新的辅助预览标签。
* 你将看到可访问性元素及其属性的实时文本表示。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-c03f1e226acfda49.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![image.png](https://upload-images.jianshu.io/upload_images/2121032-7a71e05dca3bcbb5.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![image.png](https://upload-images.jianshu.io/upload_images/2121032-45bbfe3575d41b69.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



# Text and keyboard

### 支持Markdown格式
文本现在可以包含直接内联的Markdown格式。这可以用来添加强调、链接(可以交互)，甚至代码样式的表示。这些都是建立在Foundation中新的、强大的、基于swift的AttributedString之上。除了对Markdown的支持，它还提供了一整套丰富的、类型安全的属性，以及定义自己的属性。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-92aec08cd6d344aa.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


### 本地化
允许对语言敏感的属性进行适当的本地化。另一个对本地化的巨大改进来自Xcode 13。它现在使用Swift编译器从每次使用LocalizedStringKey以及新的localizedString和attributedString初始化器生成字符串和本地化目录。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-afe95faa0baf267a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



### Dynamic Type

现在，除了这些显示文本的新方法，还有一些新方法可以让文本更加动态。动态类型：Dynamic Type，SwiftUI从一开始就支持动态类型，今年有了一个新的API来限制UI支持的类型大小范围，以防止它变得太大或太小。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-b26020d3c53e2eb0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

下图是设置不同的Dynamic Type，效果的对比
![image.png](https://upload-images.jianshu.io/upload_images/2121032-698de2478e28d115.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



### textSelection 文本选择

macOS不支持动态类型，但它支持另一个重要的文本交互:textSelection。
该修饰符可以应用于任何视图，并应用于其中的所有文本。我们还在iOS和iPadOS上引入了这个修改器，使文本能够被复制或共享。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-20468ec323da4205.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


### onSubmit

使用新的onSubmit修饰符，你可以很容易地为用户提交字段文本时添加补充操作，比如按下Return键。这个修饰符提供了一些额外的灵活性，因为它甚至可以应用于整个控件形式。为了给用户提示提交字段时会发生什么动作

![image.png](https://upload-images.jianshu.io/upload_images/2121032-cda15e93ca8c004d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

可以使用submitLabel修饰符。在软件键盘上，它可以作为返回键的标签,使用方式如下

```
.submitLabel(.done)

```

此外，我们可以使用新的键盘工具栏位置将附件视图添加到键盘。这些视图将显示在iOS和iPadOS软件键盘上方的工具栏中，或在macOS的触摸栏中。这是一种很好的方式，让用户快速访问键盘上方的操作，而不会忽略它，以避免中断应用的编辑体验。
键盘还扮演着导航和焦点的另一个重要角色，这一功能存在于每个平台上。

![image.png](https://upload-images.jianshu.io/upload_images/2121032-f4e871dc4d44baae.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


### FocusState

这是一个属性包装器，它既反映焦点状态，又提供对焦点状态的精确控制。
在最简单的情况下，它可以返回布尔值。
它可以使用聚焦修饰符绑定到一个聚焦视图。当该视图被聚焦时，该值将为true，反之为false。这个值也可以写入，以控制焦点。例如，当某人按下一个按钮。
允许用户在执行相关操作后立即开始输入。这个布尔版本为它的完整形式提供了便利，它表示任何可哈希类型。

看下面这个例子

![image.png](https://upload-images.jianshu.io/upload_images/2121032-b0cf4e7aebc2050d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



* 定义一个 可选类型的字段focusedField
* FocusState属性使用该类型来反映当前状态
* 当$focusedField 的值为addAttendee 将其状态设置为focused
* 当我们通过按钮点击时，可以设置focusedField的值为addAttendee
Focus state也为iOS应用提供了一个很好的方式，通过清除软件键盘的值来消除软件键盘。如果你有兴趣学习更多，可以查看今年的session, "Direct and reflect focus in SwiftUI“


# More buttons

按钮，在我们的应用程序中是最常见不过了，大的小的、有图像的没图像的、有背景的没背景的、红的蓝的绿的，基本上承载了用户交互的大部分工作。
而 iOS 15 的 UIKit 又为我们带来更多按钮样式。以下是新的 UIKit 提供的四种基本样式，

![16241020296826.jpg](https://upload-images.jianshu.io/upload_images/2121032-b5a3bffb63316559.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


### UIButtonConfiguration

我们可以使用这个类来配置按钮的行为和外观，而无需重新自定义一个 UIButton 来实现我们想要的效果。

![16241021762827.jpg](https://upload-images.jianshu.io/upload_images/2121032-aa1542114d32cc15.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


另外，我们还可以设置按钮的 configurationUpdateHandler，让按钮在状态发生改变时自动去执行一些操作

![16241022317929.jpg](https://upload-images.jianshu.io/upload_images/2121032-9e708c51b3b45b11.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


如果需要在按钮中显示菊花，只需要设置 showsActivityIndicator 为 true 即可，也可以自己更改加载器的图片

![16241022513264.jpg](https://upload-images.jianshu.io/upload_images/2121032-5767d8f77a8cac4b.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)



### Toggle 按钮

切换按钮（UISwitch）非常适合做开关。而很多场景下的按钮，也有类似 UISwitch 的需求，像日历顶部 UIBarButtonItems，这个是启用和禁用日期详细信息的按钮，它也可以有一个 selected 属性。

![16241022756899.jpg](https://upload-images.jianshu.io/upload_images/2121032-dd3738f02ded11e5.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


为了让一个按钮变成切换按钮，只需要设置按钮的 changesSelectionAsPrimaryAction 值为 true。

![16241022931126.jpg](https://upload-images.jianshu.io/upload_images/2121032-9a8fa25b120effd1.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


### Pop-up 按钮

如果我们需要更多选项，则可以使用弹出按钮。弹出按钮更像是下拉按钮的延伸，不过它能确保选择一个且仅选择一个菜单元素。创建起来也很方便，类似于以后效果
实现上只需要给按钮分配一个菜单，设置按钮的 showsMenuAsPrimaryAction 为 true，让按钮成为一个菜单按钮，然后再设置 changesSelectionAsPrimaryAction 为 true 即可

![16241023276249.jpg](https://upload-images.jianshu.io/upload_images/2121032-e9d40f92869c30bb.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

# 总结
今年的SwiftUI,提供了很多UI以及app性能上的新玩法，本文仅仅只是其中一部分，另外因本人是初次参与阅读翻译WWDC，文中有很多不足支持，还请提出指正，谢谢！
