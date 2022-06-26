---
session_ids: [10089]
---

# Session 10089 - What's new in PDFKit

> 摘要：本文基于WWDC17  Introducing PDFKit on iOS以及WWDC22 What's new in PDFKit 两个Session的内容梳理，先后介绍了PDF的简介、苹果在PDF处理中的发展历史、PDFKit的基本内容以及PDFKit最新的特性。
>
>作者：Jimmy（曹鉴津），iOS开发者，就职于金山办公，目前参与WPS Office iOS端的业务开发。
>
>编辑：士土Edmond木, 对 CocoaPods 有一点了解，目前对 Bazel 和 Swift 比较感兴趣。[Github Page](https://looseyi.github.io)

- 文章大纲如下图所示：

![](./images/Outline.png)

>阅读建议：
>- 如果是小白，建议从头开始看。
>- 如果已经非常熟悉PDFKit框架，建议直接查看"PDFKit的新特性"章节。
>
>相关Session：
>
>[WWDC2022 - What's new in PDFKit](https://developer.apple.com/videos/play/wwdc2022/10089/)
>
>[WWDC2017 - Introducing PDFKit on iOS](https://www.bilibili.com/video/BV1SQ4y1f741?spm_id_from=333.1007.top_right_bar_window_history.content.click&vd_source=1ffa2efbb3d86bce7d7cd27f2c9b9bac) //由于笔者在写这篇文章时，在苹果开发者网站搜索该[session](https://developer.apple.com/videos/wwdc2017/)发现已经下架了，因此无法提供官方链接，但是在网上搜到了有人把这个视频给搬下来了，仅供参考。

### 前言
**什么是PDF?**

PDF全称叫`Portable Document Format`，可移植的文档格式。

**我们为什么要使用PDF？**

PDF有以下优势：
- 在政府、医疗、金融和商业中具有普遍的应用价值
- 具有权限模型的强加密
- 用户可以与小部件以及注释进行交互。
- 打印出来的效果跟你看到的PDF是一样的。

PDF不只是一个静态文档，它最强大的地方在于可以与用户产生交互。

### 1. PDF处理的发展历史
我们先来回顾一下在iOS中，苹果提供的处理PDF的框架的迭代更新。

##### 1.1. CoreGraphics PDF Framework
苹果在很早之前就为我们提供了一个较低层次的解决方案，那就是`CoreGraphics PDF Framework`，它提供了可以生成、显示以及修改PDF的API。

以下代码使用`CoreGraphics PDF Framework`实现了读取一个PDF文档的第一页并绘制到视图上。
```
class CoreGraphicPDFView: UIView {
    override func draw(_ rect: CGRect) {
        let url = Bundle.main.url(forResource: "WWDC_-_Developer_s_Living", withExtension: "pdf") as CFURL?
        if let document = CGPDFDocument.init(url!) {
            if let context = UIGraphicsGetCurrentContext() {
                if let page = document.page(at: 1) {
                    //由于Quartz坐标系和UIView坐标系不一样，所以需要调整坐标系，使pdf正立
                    context.translateBy(x: 0.0, y: self.bounds.size.height)
                    context.scaleBy(x: 1.0, y: -1.0)
                    //创建一个仿射变换，该变换基于将PDF页的BOX映射到指定的矩形中。
                    let transfrom = page.getDrawingTransform(.cropBox, rect: self.bounds, rotate: 0, preserveAspectRatio: true)
                    context.concatenate(transfrom)
                    context.drawPDFPage(page)
                }
            }
        }
    }
}
```
效果如下：
![](./images/CGPDFFrameworkReadImage.png)

关于Core Graphic处理PDF的更多细节可以参考苹果官方文档（https://developer.apple.com/documentation/coregraphics/cgpdfdocument/）。

下面说一下`CoreGraphics PDF Framework`的一些问题：
![](./images/CGPDFFramework.png)

这个框架有以下特点：

1、与PDF图形相同的绘图模型。

2、具备读写功能。

3、C语言函数。

但是它也有一些局限：

1、没有适用于AppKit的原生类型。

2、不支持文档交互，比如不能与文档进行任何的实时互动，也不能突出显示搜索结果等。

3、不支持辅助功能。

因此，`PDFKit`来了。

### 2. 介绍PDFKit (introducing PDFKit in iOS)
WWDC17，苹果正式推出更加强大的PDF处理框架`PDFKit`。
![](./images/PDFKitFramework.png)

- `PDFKit`在原有的`CoreGraphics PDF`框架的基础上，新增了更加现代化的`Swift`和`Objective-C`的`API`。
- 同时支持AppKit和UIKit。
- 更加容易去打开、修改、绘制以及保存文档的内容选择并搜索文本。
- 改进了对PDF可访问性的支持。

##### 2.1. PDFKit框架概述
![](./images/PDFKitFrameworkOverview.png)
`PDFKit`中所有的类都可以归为`View`、`Document`、`Support`这三种类型中的一种。
- `View`层

`PDFView`：是`PDFKit`中的主要视图，主要用于显示以及管理PDF文档的内容。
`PDFThumbnailView`：是一个包含PDF页面缩略图集合的自定义视图，用户可以通过滚动或者手势交互来控制`PDFView`视图中的页面变化，相当于页面的索引。

- `Document`层

`PDFDocument`：代表一个PDF文件，它是所有`PDFPage`的容器。它不仅为你提供了加载、修改和保存一组PDF页面的能力，而且还有解锁、搜索以及与文档结构交互的能力。
`PDFPage`：代表`PDFDocument`中的某一页。
`PDFAnnotation`：是PDF文档中所有标注类型的包装类。它是一个直接映射到PDF文件格式的键值对的容器，在Adobe PDF规范（1.7）中，你可以通过制定键值对来实现注释的属性。

- `Support`层

`PDFSelection`：代表一段被选择的内容的范围。我们可以提取该范围的字符串文本，也可以对该范围的字符串文本进行装饰。
`PDFOutline`：代表大纲层次结构中的节点。
`PDFAction`：是一个抽象类，用于表示用户可以触发的事件与所属注释的交互，这些事件可以是PDFActionGoTo、PDFActionNamed、PDFActionRemoveGoTo、PDFActionResetForm、PDFActionURL等，通常这些事件主要用于移动PDF视图的视口、打开网页浏览器、清除表单等。

之后会详细讲解这些类的特性和使用方式。

![](./images/PDFKitFrameworkCoreClass.png)
`PDFView`、`PDFDocument`、`PDFPage`、`PDFAnnotation`这四个类可以完成大部分PDF功能。

##### 2.1.1. PDFView
我们来看一个使用PDFView来显示PDF的例子

![](./images/PDFViewShow.png)
以上代码创建了一个PDFView，设置了文档居中，并且背景颜色是灰色的；最特别的是，只要设置了`pdfView.allowsDragging = true`后，我们就可以通过手动拖动pdf文件到视图范围内就可以加载文档了。

![](./images/PDFViewFeatures.png)


 PDFView有以下特点
-  可定制的PDF文档视图
-  允许与页面和小部件进行完整的用户交互
-  可以定义很多属性，比如布局、方向、间距、缩放因子和自动缩放，通过调整这些属性的值来达到查看内容的最佳位置
- 视图到页面、页面到视图的坐标转换
- 当我们用手指触碰pdf的内容时，我们可以知道触碰的是文件中的哪一页。
- 直接把一个带有URL的PDFDocument赋值给PDFView的document属性，无论是什么文档，都会以PDF格式显示
- ...

下面介绍两个PDFView中的枚举类型，PDFDisplayMode和PDFDisplayDirection：
- PDFDisplayMode代表页面显示的模式
```
public enum PDFDisplayMode : Int {
    case singlePage = 0
    case singlePageContinuous = 1
    case twoUp = 2
    case twoUpContinuous = 3
}
```
效果如下
![](./images/PDFDisplayMode.png)

- PDFDisplayDirection代表页面显示的方向
```
public enum PDFDisplayDirection : Int {
    case vertical = 0
    case horizontal = 1
}
```
效果如下
![](./images/PDFDisplayDirection.png)

##### 2.1.2. PDFThumbnailView
![](./images/PDFThumbnailView.png)
当我们在界面上加入了PDFThumbnailView，并且关联到PDFView，我们就可以控制当前页面的位置。
![](./images/PDFThumbnailViewPage.png)

如图所示，PDFThumbnailView可以横向显示也可以纵向显示，当我们触碰到某一页的缩略图时，PDFView就会跳转到对应的页面。

**Document, Page, and Annotations Model**

![](./images/DocumentPageAnnotation.png)
接下来让我们来谈谈Document、Page、Annotations Model之间的关系。

关系很简单，PDFDocument包含了一系列的PDFPage，每个PDFPage又包含着一系列的PDFAnnotation。也就是说，一个PDF文档里包含着很多页面，而每一个页面都包含很多标注。

##### 2.1.3. PDFDocument
![](./images/PDFDocument.png)
PDFDocument是一个页面容器，它具备以下能力：
- 添加、交换和删除页面
- 解密和验证权限
- 设置文档属性
- 搜索字符串

关于PDFDocument的使用请看以下代码例子

![](./images/PDFDocumentUse.png)
以上代码展示了PDFDocument对象的读写操作，使用-`writeToURL:withOptions:`还可以指定键为`.ownerPasswordOption`和值为密码的可选项为文档加密。

一般来说，我们打开一个PDF文档，并不是简单的直接打开，而且会检查是否加密、各种权限控制等，那么如何处理加密的情况？苹果建议我们这样去做：

![](./images/PDFDocumentDecryption.png)

- 首先通过isEncrypted判断是否加密。
- 尝试使用unlock(withPassword: "") 传入密码去解密。
- 如果解密成功，就再次判断document的权限。
```
public enum PDFDocumentPermissions : Int {
    case none = 0         //没有文档权限
    case user = 1         //用户文档权限
    case owner = 2        //所有者权限
}
```
当处于owner状态时，代表拥有所有者权限，那么就可以任意操作文档了，否则就要逐个权限去进行判断（比如是否允许复制，是否允许打印等）。

![](./images/PDFDocumentPageManipulation.png)
PDFDocument还提供了几个操作PDFPage的方法，包括插入页面、交换页面和删除页面。其中插入页面时需要注意该PDFPage对象是否来自于其他的PDFDocument对象，如果是的话，那么最好做一次copy（拷贝）操作再插入，这是因为如果两个PDFDocument对象同时持有同一个PDFPage对象，只要该PDFPage对象发生改动（比如把属性rotation设置为90度），那么两个PDFDocument对象的对应PDFPage都会发生变化。

![](./images/PDFDocumentNotificationDelegate.png)

PDFDocument还提供了一系列的事件通知（如文档解锁、文档开始写入数据等）以及代理回调（如字符串查找匹配成功，结束字符串查找等）。

PDFDocument的介绍就到这里了，更多细节请参考苹果API文档（https://developer.apple.com/documentation/pdfkit/pdfdocument）。



##### 2.1.4. PDFPage

![](./images/PDFPage.png)

接下来我们来聊聊PDFPage，PDFPage有以下特点：
- 它是一个装载文档内容的容器，
- 它作为一个页面可以从文档中提取出来。
- 默认有两个初始化方法，`init()`（空白页面），`init?(image: UIImage)` (图片页面)。
- 它同时也是装载标注的容器，具有添加、检索、删除注释的功能。
- 可以自定义页面大小、旋转角度以及自定义绘制等。
- 支持选择文本。

![](./images/PDFPageProperties.png)

以上示例通过加载图片`PDFPage(image:)`的方式生成一个PDFPage对象。
- 使用`string`属性可以得到页面上的普通文本字符串。
- 使用`attributedStrinng`可以得到富文本字符串。
- 传入一个`NSRange`范围可以得到该范围内的字符串文本选区对象。
- 传入一个`CGRect`区域可以得到该区域内的页面内容选区对象。

![](./images/PDFPageStringExtraction.png)

我们做一个测试，建立一个视图装载两个子View，左边是PDFView，右边是NSTextView。

![](./images/PDFPageStringExtractionResult.png)

我们让PDFView加载一个PDF文件，然后使用提取页面富文本字符串功能，把提取结果赋值给右边的NSTextView，效果显示，富文本的所有属性样式跟原文档完美一致。

![](./images/PDFPageThumbnails.png)

获取指定页面的缩略图可以使用：
```
func thumbnail(of size: CGSize, for box: PDFDisplayBox) -> UIImage
```
这里有两个参数size和box，size表示要生成缩略图的大小，box是一个PDFDisplayBox枚举类型，如下图
```
public enum PDFDisplayBox : Int {
    case mediaBox = 0   //定义用于显示或打印的物理介质边界的矩形，以默认用户空间单位表示。
    case cropBox = 1    //定义可见区域边界的矩形，以默认用户空间单位表示。默认值等于kPDFDisplayBoxMediaBox。
    case bleedBox = 2   //定义生产环境中页面内容的剪辑区域边界的矩形。默认值等于kPDFDisplayBoxCropBox。
    case trimBox = 3    //定义完成页面的预期边界的矩形。默认值等于kPDFDisplayBoxCropBox。
    case artBox = 4     //定义页面有意义内容边界的矩形，包括用于显示的周围空白。默认值等于kPDFDisplayBoxCropBox。
}
```
下图展示了使用mediaBox和cropBox的效果：
![](./images/PDFCoordinateSpace.png)

**PDFPage自定义绘制**

![](./images/CustomPDFPageDrawing.png)
我们经常会往PDF中添加水印，那么在PDFPage中我们是如何实现的呢？

1、成为PDFDocument的代理。
```
document.delegate = self
```
2、实现代理方法`classForPage`。
```
func classForPage() -> AnyClass {
    return WatermarkPage.self
}
```
并返回一个自定义类型（这里是WatermarkPage）。

3、在WatermarkPage中重写`draw(with box: PDFDisplayBox, to context: CGContext)`方法。
```
override func draw(with box: PDFDisplayBox, to context: CGContext) {
    super.draw(with: box, to: context)
        
    // Draw rotated overlay string
    UIGraphicsPushContext(context)
    context.saveGState()
        
    let pageBoundns = self.bounds(for: box)
    context.translateBy(x: 0.0, y: pageBoundns.size.height)
    context.scaleBy(x: 1.0, y: -1.0)
    context.rotate(by: CGFloat.pi / 4.0)
        
    let string: NSString = "U s e r   3 1 4 1 5 9"
    let attributes = [
        NSAttributedString.Key.foregroundColor: UIColor(red: 0.5, green: 0.5, blue: 0.5, alpha: 0.5),
        NSAttributedString.Key.font: UIFont.boldSystemFont(ofSize: 64)
    ]
        
    string.draw(at: CGPoint(x: 250, y: 40), withAttributes: attributes)
    context.restoreGState()
    UIGraphicsPopContext()
}
```
在这个方法里就可以使用context来进行各种自定义绘制了。

以上代码为每一个PDFPage加上一层水印，效果如下：
![](./images/PDFWatermark.png)

##### 2.1.5. PDFAnnotation

![](./images/AnnotationsSupportedByPDFKit.png)

![](./images/PDFAnnotation.png)
PDFPages可以拥有很多标注。你可以添加、修改和移动PDFView去更新值。

通过键值对实现全面支持。
- 您在字典中设置的内容将在文件中设置。
- 允许使用未定义的标注。

PDFAnnotation还有一个分类是PDFAnnotationUtilities，让我们能够更容易地设置和获取我们支持的属性。

![](./images/AnnotationsLineType.png)
比如，我们可以用六种不同的线条样式来生成一个标注。

![](./images/PDFAnnotationLineTypeKeyValue.png)
拿第二种样式举例子，我们可以通过键值对的方式去设置起点和终点坐标、线条的结尾样式、线条显色，但这种方式使用起来比较麻烦，我们使用PDFAnnotationUtilities来完成这一切看看：

![](./images/PDFAnnotationLineTypeProperties.png)
可以看到通过PDFAnnotationUtilities可以直接使用属性赋值。
![](./images/PDFAnnotationCodeCompare.png)

我们来对比一下这两种方式，比如设置起点和终点坐标。

键值对：
```
line.setValue([0, 0, 100, 100], forAnnotationKey: .linePoints)
```
PDFAnnotationUtilities：
```
line.startPoint = CGPoint(x:0, y:0)
line.endPoint = CGPoint(x:100, y:100)
```

很明显通过PDFAnnotationUtilities的方式更加清晰和易用。

![](./images/PDFAnnotationUse.png)
PDFAnnotation的创建方式也非常简单，传入坐标、标注类型、属性字典即可：
```
let newAnnotationn = PDFAnnotation(bounds: CGRect(x: 10, y: 10, width: 100, height: 100), forType: .square, withProperties: nil)
```
type是PDFAnnotationSubtype结构体，它有非常多种类型：
```
public struct PDFAnnotationSubtype : Hashable, Equatable, RawRepresentable {

    public init(rawValue: String)
}

extension PDFAnnotationSubtype {
    @available(iOS 11.0, *)
    public static let text: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let link: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let freeText: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let line: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let square: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let circle: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let highlight: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let underline: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let strikeOut: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let ink: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let stamp: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let popup: PDFAnnotationSubtype

    @available(iOS 11.0, *)
    public static let widget: PDFAnnotationSubtype
}
```
我们使用line类型看看效果如何：

![](./images/PDFAnnotationUseCompare.png)
以上右上角的标注效果展示了两种不同的实现方式，键值对和PDFAnnotation。

##### 2.1.6. PDFAction and PDFDestination
![](./images/PDFActionAndPDFDestination.png)
当PDFAnnotation为link类型时，可以设置action属性，用户通过触摸或者点击PDFAnnotation就响应事件，响应事件的类型是PDFAction的各种子类：

PDFActionGoTo：用于跳转PDF中的某个页面的具体位置，与PDFDestination搭配。
```
func createActionGoTo(page: PDFPage, point: CGPoint) -> PDFAction {
    let destination = PDFDestination(page: page, at: point)
    let actionGoTo = PDFActionGoTo(destination: destination)
    return actionGoTo
}
```
PDFActionNamed & PDFActionNamedName：定义用于处理 PDF 文档中的操作的方法。
```
public enum PDFActionNamedName : Int {
    case none = 0                        //无操作
    case nextPage = 1                    //跳转到下一页
    case previousPage = 2                //跳转到上一页
    case firstPage = 3                   //跳转到第一页
    case lastPage = 4                    //跳转到最后一页
    case goBack = 5                      //undo      
    case goForward = 6                   //redo
    case goToPage = 7                    //跳转到指定的页面
    case find = 8                        //查找
    case print = 9                       //打印
    case zoomIn = 10                     //放大
    case zoomOut = 11                    //缩小
}

func createActionNamed() -> PDFAction {
    let actionNamed = PDFActionNamed(name: .nextPage)
    return actionNamed
}
```
PDFActionRemoteGoTo：定义了获取和设置针对另一个文档的 go-to 操作的目的地的方法。
```
func createActionRemoteGoTo(pageIndex: Int, point: CGPoint, url: URL) -> PDFAction {
    let actionGoTo = PDFActionRemoteGoTo(pageIndex: pageIndex, at: point, fileURL: url)
    return actionGoTo
}
```
PDFActionResetForm：定义获取和清除 PDF 表单中的字段的方法。
```
func createActionResetForm() -> PDFAction {
    let actionResetForm = PDFActionResetForm()
//  actionResetForm.fields = ["PDFDocument"]
//  actionResetForm.fieldsIncludedAreCleared = false
    return actionResetForm
}
```
PDFActionURL：用于跳转URL。
```
func createActionURL() -> PDFAction {
    let appleURL = URL(string: "http://apple.com")!
    let actionUrl = PDFActionURL(url: appleURL)
    return actionUrl
}
```
##### 2.1.7. Widgets
![](./images/Widgets.png)
PDFAnnotationn提供了很多的小部件，包括文本框、复选按钮、可选项等。

在初始化PDFAnnotation时把type设置为widget，然后设置widgetFieldType属性即可。
```
let textWidget = PDFAnnotation(bounds: CGRect(x: 50, y: 50, width: 100, height: 100), forType: .widget, withProperties: nil)
let buttonWidget = PDFAnnotation(bounds: CGRect(x: 50, y: 50, width: 100, height: 100), forType: .widget, withProperties: nil)
let choiceWidget = PDFAnnotation(bounds: CGRect(x: 50, y: 50, width: 100, height: 100), forType: .widget, withProperties: nil)
        
textWidget.widgetFieldType = .text
buttonWidget.widgetFieldType = .button
choiceWidget.widgetFieldType = .choice
```
![](./images/WidgetsButtonType.png)

当我们使用widgetFieldType类型为button的时候，我们可以设置3种不同风格的按钮类型radioButtonControl、checkBoxControl、pushButtonControl。

![](./images/WidgetsChoiceType.png)
同样地，使用widgetFieldType类型为choice时，也有两种不同的风格，isListChoice设为true时为列表框，false则为组合框。

![](./images/WidgetsTextfield.png)
以上是设置一个文本框小部件的示例。

**Advanced widget annotationns （标注小部件的最佳实践）**

![](./images/PDFAnnotationBestPractices.jpeg)
使用标注小组件实现一个填充表单的功能，代码如下：
```
import UIKit
import PDFKit

class ViewController: UIViewController {

    var pdfView: PDFView?

    func insertFormFieldsInto(_ page: PDFPage) {

        let pageBounds = page.bounds(for: .cropBox)

        // Intro: "Name:" & "Date:"
        let textFieldNameBounds = CGRect(x: 169, y: pageBounds.size.height - 102, width: 371, height: 23)
        let textFieldName = PDFAnnotation(bounds: textFieldNameBounds, forType: .widget, withProperties: nil)
        textFieldName.widgetFieldType = .text
        textFieldName.backgroundColor = UIColor.blue.withAlphaComponent(0.25)
        textFieldName.font = UIFont.systemFont(ofSize: 18)
        page.addAnnotation(textFieldName)

        let textFieldDateBounds = CGRect(x: 283, y: pageBounds.size.height - 135, width: 257, height: 22)
        let textFieldDate = PDFAnnotation(bounds: textFieldDateBounds, forType: .widget, withProperties: nil)
        textFieldDate.widgetFieldType = .text
        textFieldDate.backgroundColor = UIColor.blue.withAlphaComponent(0.25)
        textFieldDate.font = UIFont.systemFont(ofSize: 18)
        textFieldDate.maximumLength = 5
        textFieldDate.hasComb = true
        page.addAnnotation(textFieldDate)
    }

    func insertRadioButtonsInto(_ page: PDFPage) {

        let pageBounds = page.bounds(for: .cropBox)

        // Yes button
        let radioButtonYesBounds = CGRect(x: 135, y: pageBounds.size.height - 249, width: 24, height: 24)
        let radioButtonYes = PDFAnnotation(bounds: radioButtonYesBounds, forType: .widget, withProperties: nil)
        radioButtonYes.widgetFieldType = .button
        radioButtonYes.widgetControlType = .radioButtonControl
        radioButtonYes.fieldName = "Radio Button"
        radioButtonYes.buttonWidgetStateString = "Yes"
        page.addAnnotation(radioButtonYes)

        // No button
        let radioButtonNoBounds = CGRect(x: 210, y: pageBounds.size.height - 249, width: 24, height: 24)
        let radioButtonNo = PDFAnnotation(bounds: radioButtonNoBounds, forType: .widget, withProperties: nil)
        radioButtonNo.widgetFieldType = .button
        radioButtonNo.widgetControlType = .radioButtonControl
        radioButtonNo.fieldName = "Radio Button"
        radioButtonNo.buttonWidgetStateString = "No"
        page.addAnnotation(radioButtonNo)
    }

    func insertCheckBoxesInto(_ page: PDFPage) {

        let pageBounds = page.bounds(for: .cropBox)

        let checkboxLoremFestivalBounds = CGRect(x: 255, y: pageBounds.size.height - 370, width: 24, height: 24)
        let checkboxLoremFestival = PDFAnnotation(bounds: checkboxLoremFestivalBounds, forType: .widget, withProperties: nil)
        checkboxLoremFestival.widgetFieldType = .button
        checkboxLoremFestival.widgetControlType = .checkBoxControl
        page.addAnnotation(checkboxLoremFestival)

        let checkboxIpsumFestivalBounds = CGRect(x: 255, y: pageBounds.size.height - 417, width: 24, height: 24)
        let checkboxIpsumFestival = PDFAnnotation(bounds: checkboxIpsumFestivalBounds, forType: .widget, withProperties: nil)
        checkboxIpsumFestival.widgetFieldType = .button
        checkboxIpsumFestival.widgetControlType = .checkBoxControl
        page.addAnnotation(checkboxIpsumFestival)

        let checkboxDolorFestivalBounds = CGRect(x: 255, y: pageBounds.size.height - 464, width: 24, height: 24)
        let checkboxDolorFestival = PDFAnnotation(bounds: checkboxDolorFestivalBounds, forType: .widget, withProperties: nil)
        checkboxDolorFestival.widgetFieldType = .button
        checkboxDolorFestival.widgetControlType = .checkBoxControl
        page.addAnnotation(checkboxDolorFestival)
    }

    func insertMultilineTextBoxInto(_ page: PDFPage) {

        let pageBounds = page.bounds(for: .cropBox)

        let textFieldMultilineBounds = CGRect(x: 90, y: pageBounds.size.height - 632, width: 276, height: 80)
        let textFieldMultiline = PDFAnnotation(bounds: textFieldMultilineBounds, forType: .widget, withProperties: nil)
        textFieldMultiline.widgetFieldType = .text
        textFieldMultiline.backgroundColor = UIColor.blue.withAlphaComponent(0.25)
        textFieldMultiline.font = UIFont.systemFont(ofSize: 24)
        textFieldMultiline.isMultiline = true
        page.addAnnotation(textFieldMultiline)
    }

    func insertResetButtonInto(_ page: PDFPage) {

        let pageBounds = page.bounds(for: .cropBox)

        let resetButtonBounds = CGRect(x: 90, y: pageBounds.size.height - 680, width: 106, height: 32)
        let resetButton = PDFAnnotation(bounds: resetButtonBounds, forType: .widget, withProperties: nil)
        resetButton.widgetFieldType = .button
        resetButton.widgetControlType = .pushButtonControl
        resetButton.caption = "Obliviate!"
        page.addAnnotation(resetButton)

        // Create PDFActionResetForm action to clear form fields.
        let resetFormAction = PDFActionResetForm()
        resetFormAction.fieldsIncludedAreCleared = false
        resetButton.action = resetFormAction
    }

    override func viewDidLoad() {

        super.viewDidLoad()
        
        pdfView = PDFView(frame: self.view.bounds)
        self.view.addSubview(pdfView!)

        // Load our simple PDF document, retrieve the first page
        if let documentURL = Bundle.main.url(forResource: "MyForm", withExtension: "pdf"),
            let document = PDFDocument(url: documentURL),
            let page = document.page(at: 0) {

            // Set our document to the view, center it, and set a background color
            pdfView?.document = document
            pdfView?.autoScales = true
            pdfView?.backgroundColor = UIColor.lightGray

            // Add Name: and Date: fields
            self.insertFormFieldsInto(page)

            // Add Question 1 widgets: "Have you been to a music festival before?"
            self.insertRadioButtonsInto(page)

            // Add Question 2 widgets: "Which of the following music festivals have you attended?"
            self.insertCheckBoxesInto(page)

            // Question 3: "Give one recommendation to improve a music festival:"
            self.insertMultilineTextBoxInto(page)

            // Reset Form
            self.insertResetButtonInto(page)
        }
    }
}
```
- 最后，苹果给了我们使用PDFKit的一些建议。
![](./images/WidgetBestPractices.png)

Recommended（推荐）:
- Use annotations for custom or real-time drawinng

使用标注进行自定义或实时绘图
- Use PDFAnnotationUtilities for easy access to properties

使用PDFAnnotationUtilities更加方便地访问属性
- Custom draw functions (PDFPage and PDFView) must be thread-safe

PDFPage和PDFView的自定义绘制方法必须是线程安全的
- Custom PDFPage drawing should call super for original page content

自定义PDFPage绘制时应该调用super来获取原始页面内容

Not Recommended（不推荐）：
- Do not call PDFView's setNeedsDisplay to update content

不要调用PDFView的setNeedsDisplay来更新内容
- Do not mutate PDFPage from different threads

不要通过不同的线程去改变PDFPage
- Do not use deprecated drawing methods

不使用已弃用的绘制方法

### 3. PDFKit的新特性（What's new in PDFKit）
本章主要讲解WWDC22的`What's new in PDFKit`session内容。

该session中，苹果为我们带来了PDFKit的许多改进，主要有以下几部分：
![](./images/PDFKitNewFeatures.jpeg)
- PDFKit review （简单回顾一下PDFKit的内容）
- Live text and forms （新特性：实况文本和表单）
- Create PDFs from images  （使用image对象来创建PDF页面）
- Overlay views （覆盖视图）

##### 3.1. 简单回顾PDFKit（PDFKit review）
![](./images/PDFKitReview.jpeg)
- PDFKit是一个功能齐全的框架，它可以让我们的应用程序去查看、编辑和写入PDF文件。
- 它可以在iOS, macOS和Mac Catalyst上使用。
- 在SwiftUI中，它也可以通过UIViewRepresentable的方式使用。
![](./images/PDFKitFrameworkAnalyze.jpeg)

PDFKit包含4个核心类，PDFView、PDFDocument、PDFPage、PDFAnnotation，它们所提供的API足以涵盖我们开发中需要使用的大部分功能。
- PDFView负责显示PDF文档的内容。它允许用户导航、设置缩放级别以及将文本复制到粘贴板；在使用SwiftUI或者Interface Builder布局时都可以使用PDFView。
- PDFDocument代表一个PDF文档对象。一般来说，可以直接使用PDFDocument，它足以满足我们的开发需求，我们很少会去子类化PDFDocument。如图所示，PDFDocument是PDF对象图的根。
- PDFPage代表一个PDF文档里的一个页面。每个文档都会包含一个或者多个PDFPage，PDFPage负责渲染和存储该页面特有的字体和图像等资源。
- PDFAnnotation是PDFPage的叶子结点，它是可选的。PDFPage的内容是不能编辑的，而PDFAnnotation本质上是可交互可编辑的。

如果想详细了解更多关于PDFKit的基础知识，请查看第一章`介绍PDFKit`。

现在我们来谈谈在iOS 16和macOS Ventura中引入的新功能。
##### 3.2. 新特性：实况文本和表单（Live text and forms）
![](./images/LiveText.jpeg)

PDFKit现在支持实况文本（Live Text）了，它拥有以下几个功能：
- 支持在PDF文档中选择和搜索文本内容。
- PDFKit会按需识别当前选择的文本。
- 在识别选中的文本时，OCR就已经完成了，不需要再拷贝一份文档去处理。
- 如果你想选择保存整个文档的文本，在保存的时候会有一个选项可以实现。

![](./images/Forms.jpeg)
除了实况文本之外，PDFKit还改进了对表单的处理：
- 包含表单字段的文档将被自动识别，即使它们不包含内置文本字段。
- 你可以按`tab`键切换这些文本字段并输入文本。

##### 3.3. 使用image对象来创建PDF页面（Create PDFs from images）
![](./images/CreatePDFsFromImages.jpeg)
在iOS 16和macOS Ventura中，有一个新的、灵活的API，可以让您的应用程序使用图像作为输入创建PDF页面。并且PDFKit会使用高质量的JPEG格式的编码对其进行压缩。因为CGImageRef是CoreGraphics中的原生数据类型，所以不需要进行额外的转换。另外还提供了可选参数来处理几种最常见的情况：
- mediaBox：可以指定页面的大小。你可以选择完美地适配图像大小，或者选择指定像信封一样的纸张大小。
- rotation：允许指定页面的纵向或横向方向。
- upscaleIfSmaller：默认情况下，如果图像比mediaBox指定的大小还要大，那么图像将缩小尺寸去适应，如果图像比mediaBox指定的大小还要小，那么图像将被缩放以填充页面。

##### 3.4. 覆盖视图 （Overlay views）
苹果首先对“怎么用Apple Pencil在PDF页面上画画”这一个很多人问过的问题做出了解答：那就是使用覆盖视图（overlay views）。

以前在PDF上进行附加绘制时，我们只能通过两种方法来实现：
- 一个是创建PDFPage的子类并重写绘制方法。
- 另一个是使用自定义的PDFAnnotation。

但是从iOS 16和macOS Ventura开始，我们可以在每个PDF页面的顶层覆盖自定义视图了，这代表我们的应用程序可以创建实时的、完全交互式的视图，并且显示在PDF页面的顶部。

下面是关于覆盖视图需要知道的三件事情：
![](./images/OverlayViews.jpeg)
- 首先，我们需要使用一个新的协议在PDF页面上安装覆盖视图。
- 当需要保存时，我们要将内容合并到PDF中。
- 关于保存，苹果介绍了保存PDF文档时的一些最佳实践。

![](./images/InstallOverlayViewsOnPDFPages.jpeg)
在PDF页面上安装覆盖视图非常简单，但是有个问题，PDF可能包含着数百（甚至上千）个页面，所以在打开PDF时，我们不可能为所有的页面都创建覆盖视图。如果用户快速来回滚动，我们如何知道何时创建覆盖视图？

幸运的是，PDFKit已经被设计成在人们滚动页面进入视图之前就会提前准备好内容了，所以它知道什么时候请求绘制覆盖视图，我们只需要遵守新的协议并重写对应的方法就可以了。

![](./images/PDFPageOverlayViewProvider.jpeg)
新的协议是PDFPageOverlayViewProvider，它提供了三个方法，我们可以看到这里使用到了PDFKitPlatformView，PDFKitPlatformView只是一个适配不同平台的类型，它可能是UIView也可能是NSView，具体要看所在的平台。
我们来看看这三个协议方法：
- overlayViewForPage：是必须要实现的协议方法，我们只需要提供一个视图的示例对象，PDFKit就会通过使用适当的约束来调整它的大小。如果页面是一个旋转视图，那么我们提供的覆盖视图也会跟着旋转。
- willDisplayOverlayView：是可选实现的协议方法，它可以用来处理一些手势操作，也可以让这些手势在PDFKit中失效
- willEndDisplayingOverlayView：也是可选实现的协议方法，当我们的覆盖视图已经添加完成之后（比如当页面滚动时覆盖视图已经超出屏幕范围时），就会调用这个方法，我们可以在这个方法里面释放覆盖视图。这个方法还有另一个重要的用途，假如我们的覆盖视图保存了一些表示绘制内容的数据，我们可以在这个方法里获取这些数据并且把这些数据放在其他地方（下面会举例子来说明这个用途），否则就不需要实现这个方法。

以下是一个实现了PDFPageOverlayViewProvider协议的例子

![](./images/ImplementinngTheProtocol.jpeg)
在这个例子中，我们创建了一个Coordinator类，它遵守了PDFPageOverlayViewProvider协议，并且声明了一个pageToViewMappinng变量，它是一个key为PDFPage类型，value为UIView类型的字典，并且实现了两个协议，overlayViewFor和willEndDisplayingOverlayView。

![](./images/OverlayViewFor.jpeg)

我们来看看overlayViewFor的具体实现：
- 首先声明了一个PKCanvasView类型的返回变量resultView。
- 接着传入当前的PDFPage对象到pageToViewMapping中取出对应的view，如果存在，则直接赋值给resultView；否则就初始化一个新的PKCanvasView类型的canvasView并赋值给resultView，与此同时，会将当前page与canvasView做一层映射缓存到pageToViewMapping字典中。
- 最后从当前的PDFPage对象中获取页面的绘制内容drawing并存储到resultView里面，在这里使用的MyPDFPage是PDFPage的一个子类，它仅仅只是添加了一个drawing属性。

现在，我们看看WillEndDisplayingOverlay方法的实现：
![](./images/WillEndDisplayingOverlayView.jpeg)
实现很简单：
- 获取当前的覆盖视图overlayView，并将当前page的绘制内容（drawing）替换为overlayView的绘制内容。
- 从pageToViewMapping中移除当前页面的缓存。

接着苹果展示了一个Apple Pencil与PDF的交互绘制流程：

![](./images/PDFViewWithApplePencil.jpeg)
图中的黄色部分就是使用Apple pencil在PDF绘制的内容，其本质上就是往PDF上添加了一些覆盖视图。

那么我们如何去保存这些绘制内容呢？

同时，对于保存的结果，我们还希望能实现：
- 以高保真度去匹配屏幕外观。
- 可以双向编辑（round-trip editing），意思就是支持undo和redo。

![](./images/SavingYourWork.jpeg)

这时候PDFAnnotation就派上用场了，在PDFAnnotation中，它有一个“外观流（Appearance Stream）”，这是一个PDF绘制命令流，几乎任何可以使用Quartz2D绘制的内容都可以记录在这个外观流中，然后渲染成图像，并记录下来。
而且，因为它被记录为PDF绘制的图像，它将看起来与使用Adobe阅读器，Chrome等时的效果完全一致。

关于外观流的具体操作，我们来看看示例代码：
![](./images/CreateAnnotationsToModelYourSketches.jpeg)
- 首先创建一个PDFAnnotationn的子类MyPDFAnnotationn，目的是为了重写draw()方法，PDFKit将在保存我在上面提到的外观流时调用这个方法。

![](./images/AddAnnotationsToYourDocumentWhenSaving.jpeg)
- 为了保存文档，我们又重写了UIDocumennt的contents方法，在这个方法中，我们循环遍历PDF文档的所有页面，图中省略的部分实现在下面说明。

![](./images/AddAnnotationsToYourDocumentWhenSavingTwo.jpeg)

- 以上是第一处省略的代码。在每个页面中，创建一个MyPDFAnnotation，将页面的drawing编码为data类型，然后使用键值对的方式存储到MyPDFAnnotation中，最后把MyPDFAnnotation添加到当前遍历的页面。

![](./images/AddAnnotationsToYourDocumentWhenSavingThree.jpeg)

- 以上是第二个省略的代码。到这里，我们已经对所有的页面添加完标注了，现在我们使用PDFDocument的dataRepresentation()来返回结果。

![](./images/BurnedIn.jpeg)

- 当页面内容保存为标注时，文档的接收者可以移动它、调整它的大小或者删除它，一般情况下，这就是我们想要的。但有时候，我们希望这个标注能够作为页面的一部分“嵌入”。在iOS 16和macOS Ventura中有一个新的PDFDocumentWriteOption可选项，只需要在编码为data的时候加上这个可选项并添加burnannotationsoption = true就可以实现了。

![](./images/BestPracticesWhenSavingPDFs.jpeg)
- CoreGraphics一直致力于以最大保真度保存pdf格式的图像，因此图像会以全分辨率保存，具有无损压缩的性质。如果PDF文件是在大型打印机上打印的，这是最好的情况。但很多时候，它都是显示在屏幕上的，所有的高保真图像数据将导致它变成一个非常大的文件。为了解决这个问题，我们可以使用PDFDocumentWriteOption，在iOS 16和macOS Ventura已经提供了几个选项了，针对以上问题我们可以使用两个选项（saveAllImagesAsJPEG和optimizeImagesForScreen）：

**saveAllImagesAsJPEG** ：通过字面意思理解，无论图像是如何创建的，它都将以JPEG编码保存在PDF中。

**optimizeImagesForScreen** ：通过对图像进行向下采样到最大的HiDPI屏幕分辨率。

以上两个选项可以同时使用。

**createLinearizedPDF** ：LinearizedPDF是PDF文件中的一种特殊格式，它为互联网做了不少优化，所以可以通过互联网更快地进行查阅。
在互联网出现之前，PDF格式的最初设计是从文件末尾读取的，这意味着在显示任何内容之前，需要先下载全部内容。而LinearizedPDF包含了在文件开头显示第一页所需的所有内容，所以web浏览器可以在加载其余内容时快速显示该内容。

我们可以在使用PDFDocument的dataRepresentation或者writeToURL方法时根据所需传递这些选项。
![](./images/WrapUp.jpeg)

- PDFKit是非常强大且易用的，在如今的iOS和macOS平台中有许多的应用程序都在使用，现在我们可以使用iOS16和macOS Ventura新增的功能来完成一些有意义的功能设计了！

### 4. 总结
- 第一章介绍了苹果在PDF处理方面的发展历史，在CoreGraphics PDF Framework转变到PDFKit的这个过程中支持了很多的新功能并且使用面向对象的设计，使得API使用起来更加易用了。
- 第二章介绍了WWDC2017苹果首次推出PDFKit的session内容，全面介绍了PDFKit的框架内容。
- 第三章介绍了WWDC2022苹果对PDFKit优化的一些新特性：实况文本、表单处理、覆盖视图。

从首次推出PDFKit（WWDC17）到现今的PDFKit增加新特性（WWDC22），可以看出苹果在PDFKit上的更新不算太多，但目前的PDFKit已经很强大了，足以满足大多数对PDF文档的处理。不过对于一些比较历史久远的应用程序来说，比如WPS Office在开发前期时苹果还没有推出PDFKit，所有的效果都是自己去实现的一套方案，目前看来替换为PDFKit来实现的可能性不大，成本较高。不过我们还是可以参考一下PDFKit的一些新特性，并尝试去实现这些特性，给用户带来更好的体验。