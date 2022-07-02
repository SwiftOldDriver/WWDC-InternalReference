---

session_ids: [10068]

---

# Session 10068 - UIKit 新特性

本文基于[Session 10068](https://developer.apple.com/videos/play/wwdc2022/10068/) 梳理。

> 作者：
>
> 审核：

## 前言

UIKit 作为iOS开发过程中非常核心的一个framework。本次更新覆盖了四个方面

## 提升生产效率方面的改动

### NavigationBar新特性

在 iOS 16 ，UIKit 新增了两种新的Navigation样式：**Browser**和**Editor**。

Browser样式给使用**历史记录或文件夹结构**进行导航的应用程序提供了更加用户友好的UI样式，例如 Web和文档浏览器。

而Editor样式专门针对编辑文档提供了一套更加便捷的UI样式。

// TODO: 图1



可以看到，这两种样式会把TitleView挤到左边展示，在中间提供一块操作区。

在 iOS 16 ，可以在navigationBar的中间展示Bar button Items 。

通过点击菜单中的“自定义工具栏” menu，可以通过在弹出窗口中拖动来重新排列这些Items。改动之后的新配置在应用程序重启后仍然保留。

//TODO: 动图2



在屏幕尺寸适应方面，例如，开启side-by-side模式时，系统会自动提供一个菜单来，把屏幕上展示不开item都放在里面。



添加了一个与新导航样式相配的title menu，它会提供一些基础的标准功能：复制、移动、重命名、导出和打印。当我们实现相应的delegate方法时，它们就会会自动显示在菜单中。

当然，我们也可以将完全自定义的项目添加到title menu。

此外，使用 Mac Catalyst 构建的应用程序通过与 NSToolbar 无缝集成，无需额外代码即可利用新的Navigation Bar样式。



### 文本操作

iOS 16 提供了可以在各种应用程序中一致地操作文本的新方法。

#### 查找和替换

新的查找和替换是专门处理文本的，而不是应用于一些更高级的应用内搜索，去处理一些数据模型对象例如照片或日历事件。

[TODO: 图片]

只需设置isFindInteractionEnabled 为true，就可以使让UITextView ， WKWebView和PDFView使用新的查找和替换事件。

这项特性可以在引入该系统的多个视图和文档中无缝工作。

#### 编辑菜单

在iOS16里，编辑菜单进行了比较重大的升级。根据用户的操作行为不同，会展示不同的样式。

如果用户使用touch交互，会展示一个重新设计过后更具交互性的菜单。

而如果是使用指针交互，会展示功能更加全面的菜单。

[TODO: 图片]

为了同时可以提供这两种体验，iOS16 引入了 UIEditMenuInteraction，替换掉了已经废弃的 UIMenuController。

它还提供了一些新的 API 让我们可以在textView的菜单里加入一些自己的action。

TODO: 



在 iOS 16 中，slide over模式下，UIKit 会替我们管理一组私有视图，这样侧边栏会自动变得更加醒目，而无需我们增加任何额外代码。



## 控件改动

### UICalendarView

UIDatePicker 的inline calendar样式（iOS14引入）现在单独摘出去，成为了一个全新的组件UICalendarView。

UICalendarView 支持不同类型的选择行为，例如可选的单个日期，以及选择多个日期。除了可用的日期范围之外，它还支持从选择中禁用单个日期。

UICalendarView 和 UIDatePicker 之间的一个主要区别是 UICalendarView 将日期表示为 NSDateComponents，而不是 NSDate。

与 NSDate 不同，NSDateComponents可以更准确地去表达一个日期，而 NSDate代表的是一个时间点。但是由于NSDateComponent比较灵活，提供了各种日历，所以在使用的时候，开发者需要指定Calendar的类型。

UICalendarView还提供了一个比较好玩的特性是开发者可以使用装饰来注释单个日期。装饰会展示在日期的下方，提供了四种样式：none，defaultDecoration，image和custom。defaultDecoration是一个小圆点，可以设置颜色和大小。

custom的装饰是不允许交互的，如果过大会被裁减。

TODO：代码例子

### PageControl

PageControl也做了一些优化。

- PageControl之前只可以左右滑动，现在可以自定义控件的排列方向和滑动方向了。现在提供了一个direction属性，支持从上到下，从左到右，或者是从下到上，从右到左的方式去滚动。
- PageControl之前只支持设置indicator的图片，而具体展示出来当前的页面的indicator样式依赖于系统去处理深色和浅色的变化来做区别。现在支持了自定义当前的indicator图片。

TODO: 代码And图片



吐槽：应该很少有开发者在实际之中使用系统的PageControl吧。小编从来都是使用自己封装的pageControl组件。系统的组件对于UI同学设计出来的UI样式，乃至比较炫酷的动画效果，支持还是不够也不够灵活。

### PasteBoard

 Apple一直在持续更新一些功能来保护用户隐私和安全。

在 iOS 15，当App在不使用系统提供的 Paste 接口，而是以代码的方式访问pasteboard时，会在屏幕上展示一个横幅来提醒用户。

而在iOS 16会弹出一条alert向用户询问是否同意使用pasteboard，用户同意之后才能拿到内容。

如果用户用的是系统提供的粘贴接口，就可以不弹出alert，隐式地访问pasterboard的内容。

如果开发者使用了自定义的粘贴控件，可以用这个新的 UIPasteControl 来替换它们，这个控件的外观和行为类似于fill样式的 UIButton。只要pasteboard获得与控件的粘贴target兼容的内容，它就会变成enable的状态。它的样式如下

TODO: 图

TODO：导向

## API 改动

### 自定义Sheets

 iOS 15给Sheets加了detent属性，包含large和medium两种样式，使得sheet可以在页面中展示出两种不同的高度。

 iOS 16对于这个属性做了扩展，增加了custom样式，之后开发者就使用custom来自己定义这个高度，我们可以给高度赋一个常数值，或者给一个最大高度的百分比。而且自定义的detent是可以通过提供Identifier来实现复用的。但

需要注意的是这个高度值不能包含底部的安全区高度，以便我们在浮动的和跟底部相连的sheets展示的样式不会有问题。

TODO：代码+图片

TODO：导向Customize and resize sheets in UIKit video.链接

### SF Symbols 的新功能

#### 渲染模式

SF Symbols 支持四种渲染模式：单色、多色、分层和调色板。

在iOS 15及以前，UIKit 默认会使用单色渲染，但在iOS16里，UIKit 可能会默认使用其他的模式来渲染。例如一些设备相关的Symbols，在iOS16 会默认使用分层渲染。

如果在iOS16里依然需要使用单色渲染，那我们需要通过如下方式单独进行设置

```swift
UIImage.SymbolConfiguration.preferringMonochrome() 
```

#### 变量渲染

UIKit 增加了对可变Symbol的支持，我们可以给他设置一个从0-1范围内的值来控制它展示不同的样式。例如我们想要展示音量的时候，就可以通过设置扬声器的图片的变量来实现。

以上提到的这两种（变量渲染与渲染模式）是可以混合使用的。现在许多系统符号现在支持可变渲染，并且开发者也可以更新其自定义符号以支持可变性。



// TODO：

要了解如何创建自定义变量符号，可以去看“在 SF Symbols 中采用可变颜色”和“SF Symbols 4 中的新增功能”。

### Swift 并发编程改动

TODO: [**【WWDC21 10019】在 SwiftUI 中遇见并发编程**](https://xiaozhuanlan.com/topic/2957164803)

iOS 16中 为了迎合swift 并发编程这一特性，对UIKit也做了一些相应的改动。包括使 UIImage, UIColor, UIFont, UITraitCollection 等不可变类型也遵循 Sendable协议，这使得我们可以在 MainActor 和自定义的Actor 之间发送它们而不会引起编译器警告。

由于这些类型是不可变的，在后续的步骤里如果需要对这些对象进行修改，就必须得创建一个copy，对copy进行操作。而原对象还是原来的样子，不会发生改动，其他使用原对象的地方还是原来的样子。而与之相比，UIBezierPath就不遵循Sendable协议，因为他是可变类型，不够安全。

TODO：引用文献 “使用 Swift 并发消除数据竞争”和“可视化和优化 Swift 并发”。



### UIScene

iOS 16  对额外展示提供了更多的支持。

如果你没在用UIScreen 的API的话，开发者无需对此做任何改动。

开发者现在不能在假设app是在main screen上了，因为接下来会把UIScreen.main和UIScreen生命周期的通知废弃掉。

如果开发者还没有用UIScene的话，现在为了支持多窗口，可能需要调整升级API了

### 自适应Cell

UICollectionView 和 UITableView 中的Cell现在根据Cell里面的内容变化自己适应大小了。为此UIKit给这两个组件提供了一个`selfSizingInvalidation`的属性，这个属性默认是enbale的状态。

当自适应属性启用的时候，Cell可以让它所在的TableView或者是CollectionView来重新布局。如果你使用UIListContentConfiguration 来设置cell，自适应会在cell的配置发生变动的时候自动触发。当然我们也可以在cell里调用 invalidateIntrinsicContentSize 方法来调整单元格的大小。

默认情况下，cell 大小发生变化时会有动画，这时候我们可以把 invalidateIntrinsicContentSize 的调用放在 UIView.performWithoutAnimation 的block里来去掉动画。

UICollectionView 和 UITableView 会智能地将多个cell的大小变化合并成一次更新操作，在最佳时间去执行。

如果在cell的布局里中使用Autolayout，我们可以用 enabledIncludingConstraints。当cell 检测到它的contentView 内的有任何自动布局更改时，它会自动调用自身的 invalidateIntrinsicContentSize。



### 在UITableView和UICollectionView里使用SwiftUI

在iOS16中，提供了一种方式`UIHostingConfiguration`来使得SwiftUI的cell可以和UIKit的cell在一个TableView里混合使用。

TODO: 例子：



TODO：导向



### UIDevice改动

1. 为了防止用户被标记，UIDevice.name 现在不再返回用户自定义的设备名称，而是设备的型号名称。而想要获取用户自定义的设备名称现在需要用户授权才可以。

2. 不再可以通过设置UIDevice.orientation来控制横竖屏了，取而代之的是UIViewController里面的方法preferredInterfaceOrientation等API。
